import { Injectable, computed, inject, signal } from '@angular/core';
import { Mission, MissionInput, OpResult } from '../models/models';
import { BackendService } from './backend.service';
import { DroneService } from './drone.service';
import { NotificationService } from './notification.service';

/** Gestion des missions connectée à 100% à la base MySQL via l'API Laravel. */
@Injectable({ providedIn: 'root' })
export class MissionService {
  private readonly drones = inject(DroneService);
  private readonly notifications = inject(NotificationService);
  private readonly backend = inject(BackendService);

  private readonly _missions = signal<Mission[]>([]);
  readonly missions = this._missions.asReadonly();
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly activeCount = computed(() => this._missions().filter((m) => m.status === 'in-progress').length);

  constructor() {
    this.loadFromBackend();
  }

  async loadFromBackend(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const mapped = await this.backend.getMissions();
      this._missions.set(mapped);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors du chargement des missions');
    } finally {
      this.loading.set(false);
    }
  }

  byId(id: string | undefined): Mission | undefined {
    return id ? this._missions().find((m) => m.id === id) : undefined;
  }

  available(includeId?: string): Mission[] {
    return this._missions().filter((m) => m.id === includeId || m.status === 'planned');
  }

  async add(input: MissionInput): Promise<OpResult> {
    const res = await this.backend.createMission(input);
    if (!res.ok) {
      return res;
    }
    await this.loadFromBackend();
    this.notifications.success(`Mission « ${input.name} » créée en base de données.`);
    return { ok: true };
  }

  async update(id: string, input: MissionInput): Promise<OpResult> {
    const res = await this.backend.updateMission(id, input);
    if (!res.ok) {
      return res;
    }
    await this.loadFromBackend();
    this.notifications.success('Mission mise à jour en base de données.');
    return { ok: true };
  }

  async remove(id: string): Promise<OpResult> {
    const res = await this.backend.deleteMission(id);
    if (!res.ok) {
      this.notifications.push(res.error ?? 'Erreur lors de la suppression de la mission', 'error');
      return res;
    }
    await this.loadFromBackend();
    this.notifications.success('Mission supprimée de la base de données.');
    return { ok: true };
  }

  start(id: string, droneId: string): OpResult {
    const m = this.byId(id);
    const d = this.drones.byId(droneId);
    if (!m || !d) return { ok: false, error: 'Mission ou drone introuvable.' };
    this._missions.update((l) => l.map((x) => (x.id === id ? { ...x, status: 'in-progress' as const, droneId } : x)));
    this.drones.setMission(droneId, id);
    return { ok: true };
  }

  complete(id: string): void {
    const m = this.byId(id);
    if (!m) return;
    if (m.droneId) this.drones.setMission(m.droneId, undefined);
    this._missions.update((l) => l.map((x) => (x.id === id ? { ...x, status: 'completed' as const, droneId: undefined } : x)));
  }

  cancel(id: string): void {
    const m = this.byId(id);
    if (!m) return;
    if (m.droneId) this.drones.setMission(m.droneId, undefined);
    this._missions.update((l) => l.map((x) => (x.id === id ? { ...x, status: 'cancelled' as const, droneId: undefined } : x)));
  }

  interruptForDrone(droneId: string): void {
    const running = this._missions().find((m) => m.droneId === droneId && m.status === 'in-progress');
    if (running) {
      this.cancel(running.id);
    }
  }
}
