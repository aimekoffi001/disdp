import { Injectable, computed, inject, signal } from '@angular/core';
import { APP_SETTINGS } from '../config/app-settings';
import { createMockDrones, MOCK_PREVIOUS_DAY } from '../data/mock-data';
import { Drone, DroneInput, LatLng, OpResult } from '../models/models';
import { BackendService } from './backend.service';
import { NotificationService } from './notification.service';
import { StorageService } from './storage.service';

/** Source de vérité unique pour les drones. Connecté au backend Laravel & BDD MySQL. */
@Injectable({ providedIn: 'root' })
export class DroneService {
  private readonly storage = inject(StorageService);
  private readonly notifications = inject(NotificationService);
  private readonly backend = inject(BackendService);

  private readonly _drones = signal<Drone[]>(this.storage.get('drones', createMockDrones()));
  readonly drones = this._drones.asReadonly();
  readonly selectedId = signal<string>(this._drones()[0]?.id ?? '1');

  readonly selected = computed(() => this._drones().find((d) => d.id === this.selectedId()) ?? this._drones()[0]);

  // --- Statistiques calculées (évoluent automatiquement en temps réel) ---
  readonly averageBattery = computed(() => {
    const d = this._drones();
    return d.length ? d.reduce((s, x) => s + x.batteryLevel, 0) / d.length : 0;
  });
  readonly totalDistanceKm = computed(() => this._drones().reduce((s, x) => s + x.distanceKm, 0));
  readonly averageSpeed = computed(() => {
    const flying = this._drones().filter((d) => d.status === 'in-flight');
    if (flying.length) return flying.reduce((s, x) => s + x.speed, 0) / flying.length;
    const sel = this.selected();
    return (sel && sel.status === 'in-flight') ? sel.speed : 0;
  });
  readonly maxRangeKm = APP_SETTINGS.maxRangeKm;
  readonly effectiveMaxRangeKm = computed(() => {
    const flying = this._drones().filter((d) => d.status === 'in-flight');
    if (flying.length > 0) {
      const sel = this.selected();
      const target = (sel && sel.status === 'in-flight') ? sel : flying[0];
      return target.currentRangeKm ?? Math.round((target.maxRangeKm ?? APP_SETTINGS.maxRangeKm) * (target.batteryLevel / 100) * 10) / 10;
    }
    const sel = this.selected();
    const nominal = sel?.maxRangeKm ?? APP_SETTINGS.maxRangeKm;
    const batt = sel?.batteryLevel ?? this.averageBattery();
    return Math.round((nominal * (batt / 100)) * 10) / 10;
  });
  readonly previous = MOCK_PREVIOUS_DAY;

  constructor() {
    this.loadFromBackend();
  }

  async loadFromBackend(): Promise<void> {
    const data = await this.backend.fetchDashboard();
    if (data?.drones && data.drones.length > 0) {
      const mapped = this.backend.mapDrones(data.drones);
      this._drones.set(mapped);
      const inFlight = mapped.find((d) => d.status === 'in-flight');
      if (!this.selectedId() || !mapped.some((d) => d.id === this.selectedId())) {
        this.selectedId.set(inFlight ? inFlight.id : mapped[0].id);
      }
      this.persist();
    }
  }

  byId(id: string | undefined): Drone | undefined {
    return id ? this._drones().find((d) => d.id === id) : undefined;
  }
  nameOf(id: string | undefined): string {
    return this.byId(id)?.name ?? '—';
  }

  select(id: string): void {
    if (this.byId(id)) this.selectedId.set(id);
  }

  add(input: DroneInput): OpResult {
    const error = this.validate(input);
    if (error) return this.fail(error);
    const id = 'd' + Date.now().toString(36);
    const drone: Drone = {
      id,
      ...this.clean(input),
      latitude: APP_SETTINGS.baseLat - 0.0065,
      longitude: APP_SETTINGS.baseLng + (Math.random() - 0.5) * 0.006,
      altitude: 0, speed: 0, heading: 0, distanceKm: 0, flightMode: 'manual',
    };
    this._drones.update((l) => [...l, drone]);
    this.persist();
    this.notifications.success(`Drone « ${drone.name} » ajouté.`);

    // Persistance asynchrone dans MySQL via Laravel
    this.backend.createDrone(input).then((res) => {
      if (res.ok) this.loadFromBackend();
    });

    return { ok: true };
  }

  update(id: string, input: DroneInput): OpResult {
    const error = this.validate(input, id);
    if (error) return this.fail(error);
    this._drones.update((l) =>
      l.map((d) => {
        if (d.id !== id) return d;
        const next = { ...d, ...this.clean(input) };
        if (next.status !== 'in-flight') { next.speed = 0; next.altitude = 0; }
        return next;
      }),
    );
    this.persist();
    this.notifications.success('Drone mis à jour.');
    return { ok: true };
  }

  remove(id: string): OpResult {
    const d = this.byId(id);
    if (!d) return this.fail('Drone introuvable.');
    if (d.status === 'in-flight') return this.fail('Impossible de supprimer un drone en vol.');
    this._drones.update((l) => l.filter((x) => x.id !== id));
    if (this.selectedId() === id) this.selectedId.set(this._drones()[0]?.id ?? '');
    this.persist();
    this.notifications.success(`Drone « ${d.name} » supprimé.`);
    return { ok: true };
  }

  /** Mise à jour issue de la télémétrie simulée : pas de persistance (haute fréquence). */
  applyTelemetry(next: Drone[]): void {
    this._drones.set(next);
  }

  /** Modification d'état (décollage, atterrissage, mode de vol…) avec persistance. */
  patch(id: string, changes: Partial<Drone>): void {
    this._drones.update((l) => l.map((d) => (d.id === id ? { ...d, ...changes } : d)));
    this.persist();
  }

  setMission(droneId: string, missionId: string | undefined): void {
    this._drones.update((l) => l.map((d) => (d.id === droneId ? { ...d, currentMissionId: missionId } : d)));
    this.persist();
  }

  assignPerimeter(droneId: string, perimeter: LatLng[] | undefined, zoneName?: string): void {
    this._drones.update((l) => l.map((d) => (d.id === droneId ? { ...d, assignedPerimeter: perimeter, assignedZoneName: zoneName } : d)));
    this.persist();
    if (zoneName) {
      this.notifications.success(`Zone « ${zoneName} » assignée au drone en temps réel.`);
    } else {
      this.notifications.push('Périmètre libéré : vol standard rétabli.', 'info');
    }
  }

  reset(): void {
    this._drones.set(createMockDrones());
    this.selectedId.set(this._drones()[0].id);
    this.persist();
  }

  persist(): void {
    this.storage.set('drones', this._drones());
  }

  private clean(i: DroneInput): DroneInput {
    return {
      name: i.name.trim(),
      code: i.code.trim().toUpperCase(),
      status: i.status,
      batteryLevel: Math.min(100, Math.max(0, Math.round(Number(i.batteryLevel)))),
    };
  }

  private validate(i: DroneInput, ignoreId?: string): string | null {
    const name = i.name?.trim();
    const code = i.code?.trim().toUpperCase();
    if (!name) return 'Le nom est obligatoire.';
    if (!code || !/^[A-Z0-9\-_]{3,12}$/i.test(code)) return 'Le code doit contenir entre 3 et 12 caractères (ex. DRN-001, DR-001).';
    if (this._drones().some((d) => d.id !== ignoreId && d.code === code)) return `Le code ${code} existe déjà.`;
    if (this._drones().some((d) => d.id !== ignoreId && d.name.toLowerCase() === name.toLowerCase())) return `Le nom « ${name} » existe déjà.`;
    const b = Number(i.batteryLevel);
    if (!Number.isFinite(b) || b < 0 || b > 100) return 'La batterie doit être comprise entre 0 et 100 %.';
    return null;
  }

  private fail(error: string): OpResult {
    return { ok: false, error };
  }
}
