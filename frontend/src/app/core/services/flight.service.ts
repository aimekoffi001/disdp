import { Injectable, inject, signal } from '@angular/core';
import { FlightRecord, ModePlan, OpResult, ScheduledFlight, ScheduledFlightInput, ScheduleStatus } from '../models/models';
import { BackendService } from './backend.service';
import { DroneService } from './drone.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class FlightService {
  private readonly drones = inject(DroneService);
  private readonly notifications = inject(NotificationService);
  private readonly backend = inject(BackendService);

  private readonly _history = signal<FlightRecord[]>([]);
  private readonly _schedule = signal<ScheduledFlight[]>([]);
  readonly history = this._history.asReadonly();
  readonly schedule = this._schedule.asReadonly();
  readonly loading = signal<boolean>(true);

  constructor() {
    this.loadFromBackend();
  }

  async loadFromBackend(): Promise<void> {
    this.loading.set(true);
    try {
      const [flights, schedule] = await Promise.all([
        this.backend.getFlights(),
        this.backend.getSchedule(),
      ]);
      this._history.set(flights);
      this._schedule.set(schedule);
    } finally {
      this.loading.set(false);
    }
  }

  byId(id: string): ScheduledFlight | undefined {
    return this._schedule().find((s) => s.id === id);
  }

  async add(input: ScheduledFlightInput): Promise<OpResult> {
    const res = await this.backend.createFlight({
      drone_id: Number(input.droneId),
      mission_id: Number(input.missionId),
      date_heure_depart_prevue: input.departure,
      statut: 'en_attente',
    });

    if (!res.ok) {
      return res;
    }

    await this.loadFromBackend();
    this.notifications.success('Vol planifié avec succès en base de données.');
    return { ok: true };
  }

  async update(id: string, input: ScheduledFlightInput): Promise<OpResult> {
    const flight: ScheduledFlight = { id, status: 'planned', ...this.clean(input) };
    this._schedule.update((l) => l.map((s) => (s.id === id ? flight : s)));
    this.notifications.success('Programmation modifiée.');
    return { ok: true };
  }

  setStatus(id: string, status: ScheduleStatus, startedAt?: string): void {
    this._schedule.update((l) => l.map((s) => (s.id === id ? { ...s, status, ...(startedAt ? { startedAt } : {}) } : s)));
  }

  async cancel(id: string): Promise<void> {
    await this.backend.deleteFlight(id);
    await this.loadFromBackend();
    this.notifications.success('Programmation annulée en base de données.');
  }

  record(flight: Omit<FlightRecord, 'id'>): void {
    this._history.update((l) => [{ id: String(Date.now()), ...flight }, ...l]);
  }

  private clean(i: ScheduledFlightInput): ScheduledFlightInput {
    return {
      droneId: i.droneId,
      missionId: i.missionId,
      departure: new Date(i.departure).toISOString(),
      modePlan: { initial: i.modePlan.initial, steps: [...i.modePlan.steps].sort((a, b) => a.afterMin - b.afterMin) },
      perimeters: i.perimeters.map((p) => p.map(([a, b]) => [a, b] as [number, number])),
    };
  }

  validatePlan(plan: ModePlan): string | null {
    let last = 0;
    for (const s of plan.steps) {
      if (!Number.isFinite(s.afterMin) || s.afterMin <= 0) return 'Le délai de changement de mode doit être supérieur à 0 minute.';
      if (s.afterMin <= last) return 'Les changements de mode doivent se succéder dans l\'ordre chronologique.';
      last = s.afterMin;
    }
    return null;
  }
}
