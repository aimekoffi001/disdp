import { Injectable, inject, signal } from '@angular/core';
import { createMockFlights, createMockSchedule } from '../data/mock-data';
import { FlightRecord, ModePlan, OpResult, ScheduledFlight, ScheduledFlightInput, ScheduleStatus } from '../models/models';
import { DroneService } from './drone.service';
import { NotificationService } from './notification.service';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class FlightService {
  private readonly storage = inject(StorageService);
  private readonly drones = inject(DroneService);
  private readonly notifications = inject(NotificationService);

  private readonly _history = signal<FlightRecord[]>(this.storage.get('flights', createMockFlights()));
  private readonly _schedule = signal<ScheduledFlight[]>(this.storage.get('schedule', createMockSchedule()));
  readonly history = this._history.asReadonly();
  readonly schedule = this._schedule.asReadonly();

  byId(id: string): ScheduledFlight | undefined {
    return this._schedule().find((s) => s.id === id);
  }

  add(input: ScheduledFlightInput): OpResult {
    const err = this.validate(input);
    if (err) return { ok: false, error: err };
    const flight: ScheduledFlight = { id: 's' + Date.now().toString(36), status: 'planned', ...this.clean(input) };
    this._schedule.update((l) => [...l, flight]);
    this.persist();
    this.notifications.success('Vol programmé (simulation : aucun ordre envoyé au drone).');
    return { ok: true };
  }

  update(id: string, input: ScheduledFlightInput): OpResult {
    const err = this.validate(input, id);
    if (err) return { ok: false, error: err };
    this._schedule.update((l) => l.map((s) => (s.id === id ? { ...s, ...this.clean(input) } : s)));
    this.persist();
    this.notifications.success('Programmation modifiée.');
    return { ok: true };
  }

  setStatus(id: string, status: ScheduleStatus, startedAt?: string): void {
    this._schedule.update((l) => l.map((s) => (s.id === id ? { ...s, status, ...(startedAt ? { startedAt } : {}) } : s)));
    this.persist();
  }

  cancel(id: string): void {
    this.setStatus(id, 'cancelled');
    this.notifications.success('Programmation annulée.');
  }

  /** Ajoute un vol à l'historique (clôture d'une mission). */
  record(flight: Omit<FlightRecord, 'id'>): void {
    this._history.update((l) => [{ id: 'f' + Date.now().toString(36), ...flight }, ...l]);
    this.persist();
  }

  reset(): void {
    this._history.set(createMockFlights());
    this._schedule.set(createMockSchedule());
    this.persist();
  }

  private persist(): void {
    this.storage.set('flights', this._history());
    this.storage.set('schedule', this._schedule());
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

  private validate(i: ScheduledFlightInput, ignoreId?: string): string | null {
    const drone = this.drones.byId(i.droneId);
    if (!drone) return 'Choisissez un drone.';
    if (drone.status === 'maintenance' || drone.status === 'offline') {
      return `${drone.name} est ${drone.status === 'maintenance' ? 'en maintenance' : 'hors ligne'} : programmation impossible.`;
    }
    if (!i.missionId) return 'Choisissez la mission à exécuter.';
    const t = new Date(i.departure).getTime();
    if (!Number.isFinite(t)) return 'La date de départ est invalide.';
    if (t <= Date.now()) return 'La date de départ doit être dans le futur.';
    const planErr = this.validatePlan(i.modePlan);
    if (planErr) return planErr;
    if (i.perimeters.some((p) => p.length < 3)) return 'Chaque périmètre doit comporter au moins 3 points.';
    const clash = this._schedule().some(
      (s) => s.id !== ignoreId && s.status === 'planned' && s.droneId === i.droneId && Math.abs(new Date(s.departure).getTime() - t) < 60 * 60 * 1000,
    );
    if (clash) return `${drone.name} a déjà un vol programmé à moins d'une heure de ce créneau.`;
    const missionTaken = this._schedule().some((s) => s.id !== ignoreId && s.missionId === i.missionId && (s.status === 'planned' || s.status === 'running'));
    if (missionTaken) return 'Cette mission est déjà rattachée à un autre vol.';
    return null;
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
