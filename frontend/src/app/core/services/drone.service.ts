import { Injectable, computed, inject, signal } from '@angular/core';
import { APP_SETTINGS } from '../config/app-settings';
import { Drone, DroneInput, LatLng, OpResult } from '../models/models';
import { BackendService } from './backend.service';
import { NotificationService } from './notification.service';

/** Source de vérité unique pour les drones, connectée à 100% à MySQL via l'API Laravel. */
@Injectable({ providedIn: 'root' })
export class DroneService {
  private readonly notifications = inject(NotificationService);
  private readonly backend = inject(BackendService);

  private readonly _drones = signal<Drone[]>([]);
  readonly drones = this._drones.asReadonly();
  readonly selectedId = signal<string>('');
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly selected = computed(() => {
    const list = this._drones();
    return list.find((d) => d.id === this.selectedId()) ?? list[0];
  });

  // --- Statistiques calculées en direct sur les vraies données MySQL ---
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
    const sel = this.selected();
    if (!sel) return 0;
    const nominal = sel.maxRangeKm ?? APP_SETTINGS.maxRangeKm;
    return Math.round((nominal * (sel.batteryLevel / 100)) * 10) / 10;
  });
  readonly previous = { battery: 0, distanceKm: 0, speed: 0 };

  constructor() {
    this.loadFromBackend();
  }

  async loadFromBackend(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const mapped = await this.backend.getDrones();
      this._drones.set(mapped);
      if (mapped.length > 0) {
        if (!this.selectedId() || !mapped.some((d) => d.id === this.selectedId())) {
          const inFlight = mapped.find((d) => d.status === 'in-flight');
          this.selectedId.set(inFlight ? inFlight.id : mapped[0].id);
        }
      } else {
        this.selectedId.set('');
      }
      this.error.set(null);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de la récupération des drones');
    } finally {
      this.loading.set(false);
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

  async add(input: DroneInput): Promise<OpResult> {
    const cleanInput = this.clean(input);
    const res = await this.backend.createDrone(cleanInput);

    if (!res.ok) {
      return res;
    }

    await this.loadFromBackend();
    this.notifications.success(`Drone « ${cleanInput.name} » ajouté en base de données.`);
    return { ok: true };
  }

  async update(id: string, input: DroneInput): Promise<OpResult> {
    const cleanInput = this.clean(input);
    const res = await this.backend.updateDrone(id, cleanInput);

    if (!res.ok) {
      return res;
    }

    await this.loadFromBackend();
    this.notifications.success(`Drone « ${cleanInput.name} » modifié avec succès.`);
    return { ok: true };
  }

  async remove(id: string): Promise<OpResult> {
    const d = this.byId(id);
    const name = d ? d.name : id;

    const res = await this.backend.deleteDrone(id);
    if (!res.ok) {
      this.notifications.push(res.error ?? 'Erreur lors de la suppression', 'error');
      return res;
    }

    await this.loadFromBackend();
    this.notifications.success(`Drone « ${name} » définitivement supprimé.`);
    return { ok: true };
  }

  applyTelemetry(next: Drone[]): void {
    this._drones.set(next);
  }

  async patch(id: string, changes: Partial<Drone>): Promise<void> {
    this._drones.update((l) => l.map((d) => (d.id === id ? { ...d, ...changes } : d)));
  }

  setMission(droneId: string, missionId: string | undefined): void {
    this._drones.update((l) => l.map((d) => (d.id === droneId ? { ...d, currentMissionId: missionId } : d)));
  }

  assignPerimeter(droneId: string, perimeter: LatLng[] | undefined, zoneName?: string): void {
    this._drones.update((l) => l.map((d) => (d.id === droneId ? { ...d, assignedPerimeter: perimeter, assignedZoneName: zoneName } : d)));
    if (zoneName) {
      this.notifications.success(`Zone « ${zoneName} » assignée au drone.`);
    } else {
      this.notifications.push('Périmètre libéré.', 'info');
    }
  }

  persist(): void {
    // Les mutations sont persistées directement en BDD MySQL via l'API REST Laravel.
  }

  private clean(i: DroneInput): DroneInput {
    return {
      name: i.name.trim(),
      code: i.code ? i.code.trim().toUpperCase() : '',
      status: i.status,
      batteryLevel: Number(i.batteryLevel),
    };
  }
}
