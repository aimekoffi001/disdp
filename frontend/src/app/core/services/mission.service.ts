import { Injectable, computed, inject, signal } from '@angular/core';
import { createMockMissions } from '../data/mock-data';
import { Mission, MissionInput, OpResult } from '../models/models';
import { BackendService } from './backend.service';
import { DroneService } from './drone.service';
import { FlightService } from './flight.service';
import { NotificationService } from './notification.service';
import { StorageService } from './storage.service';

/** Gestion des missions connectée au backend Laravel & BDD MySQL. */
@Injectable({ providedIn: 'root' })
export class MissionService {
  private readonly storage = inject(StorageService);
  private readonly drones = inject(DroneService);
  private readonly notifications = inject(NotificationService);
  private readonly flights = inject(FlightService);
  private readonly backend = inject(BackendService);

  private readonly _missions = signal<Mission[]>(this.storage.get('missions', createMockMissions()));
  readonly missions = this._missions.asReadonly();
  readonly activeCount = computed(() => this._missions().filter((m) => m.status === 'in-progress').length);

  constructor() {
    this.loadFromBackend();
  }

  async loadFromBackend(): Promise<void> {
    const data = await this.backend.fetchDashboard();
    if (data?.missions && data.missions.length > 0) {
      const mapped = this.backend.mapMissions(data.missions);
      this._missions.set(mapped);
      this.persist();
    }
  }

  byId(id: string | undefined): Mission | undefined {
    return id ? this._missions().find((m) => m.id === id) : undefined;
  }

  /** Missions pouvant être planifiées : planifiées et non déjà rattachées à un vol programmé ou en cours. */
  available(includeId?: string): Mission[] {
    const taken = new Set(
      this.flights.schedule().filter((s) => s.status === 'planned' || s.status === 'running').map((s) => s.missionId),
    );
    return this._missions().filter((m) => m.id === includeId || (m.status === 'planned' && !taken.has(m.id)));
  }

  add(input: MissionInput): OpResult {
    const err = this.validate(input);
    if (err) return this.fail(err);
    const mission: Mission = { id: 'm' + Date.now().toString(36), ...this.clean(input), status: 'planned' };
    this._missions.update((l) => [...l, mission]);
    this.persist();
    this.notifications.success(`Mission « ${mission.name} » créée.`);

    // Persistance asynchrone dans MySQL via Laravel
    this.backend.createMission(input).then((res) => {
      if (res.ok) this.loadFromBackend();
    });

    return { ok: true };
  }

  update(id: string, input: MissionInput): OpResult {
    const err = this.validate(input);
    if (err) return this.fail(err);
    this._missions.update((l) => l.map((m) => (m.id === id ? { ...m, ...this.clean(input) } : m)));
    this.persist();
    this.notifications.success('Mission mise à jour.');
    return { ok: true };
  }

  /** Démarre la mission avec un drone en vol (appelé par l'exécution d'un vol programmé). */
  start(id: string, droneId: string): OpResult {
    const m = this.byId(id);
    const d = this.drones.byId(droneId);
    if (!m || !d) return this.fail('Mission ou drone introuvable.');
    if (d.status !== 'in-flight') return this.fail(`${d.name} n'est pas en vol.`);
    this._missions.update((l) => l.map((x) => (x.id === id ? { ...x, status: 'in-progress' as const, droneId } : x)));
    this.drones.setMission(droneId, id);
    this.persist();
    return { ok: true };
  }

  complete(id: string): void {
    const m = this.byId(id);
    if (!m) return;
    this._missions.update((l) => l.map((x) => (x.id === id ? { ...x, status: 'completed' as const } : x)));
    if (m.droneId && this.drones.byId(m.droneId)?.currentMissionId === id) this.drones.setMission(m.droneId, undefined);
    this.flights.record({ date: new Date().toISOString(), droneId: m.droneId ?? '', missionName: m.name, durationMin: m.durationMin, status: 'completed' });
    this.persist();
    this.notifications.success(`Mission « ${m.name} » terminée.`);
  }

  cancel(id: string): void {
    const m = this.byId(id);
    if (!m) return;
    this._missions.update((l) => l.map((x) => (x.id === id ? { ...x, status: 'cancelled' as const } : x)));
    if (m.droneId && this.drones.byId(m.droneId)?.currentMissionId === id) this.drones.setMission(m.droneId, undefined);
    this.persist();
    this.notifications.success('Mission annulée.');
  }

  /** Quand un vol s'interrompt (atterrissage manuel ou batterie critique), la mission redevient planifiable. */
  interruptForDrone(droneId: string): void {
    let changed = false;
    this._missions.update((l) =>
      l.map((m) => {
        if (m.droneId === droneId && m.status === 'in-progress') { changed = true; return { ...m, status: 'planned' as const, droneId: undefined }; }
        return m;
      }),
    );
    if (changed) this.persist();
  }

  reset(): void {
    this._missions.set(createMockMissions());
    this.persist();
  }

  persist(): void {
    this.storage.set('missions', this._missions());
  }

  private clean(i: MissionInput): MissionInput {
    return { name: i.name.trim(), description: (i.description ?? '').trim(), durationMin: Math.round(Number(i.durationMin)) };
  }

  private validate(i: MissionInput): string | null {
    if (!i.name?.trim()) return 'Le nom de la mission est obligatoire.';
    const d = Number(i.durationMin);
    if (!Number.isFinite(d) || d <= 0 || d > 1440) return 'La durée doit être comprise entre 1 et 1440 minutes.';
    if ((i.description ?? '').length > 500) return 'La description ne doit pas dépasser 500 caractères.';
    return null;
  }

  private fail(error: string): OpResult {
    return { ok: false, error };
  }
}
