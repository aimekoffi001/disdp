import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { interval } from 'rxjs';
import { FlightMode, ModePlan, OpResult } from '../models/models';
import { AlertService } from './alert.service';
import { BackendService } from './backend.service';
import { DroneService } from './drone.service';
import { FlightService } from './flight.service';
import { MissionService } from './mission.service';
import { NotificationService } from './notification.service';
import { FLIGHT_MODE } from '../../shared/utils/labels';

const MIN_TAKEOFF_BATTERY = 20;

/**
 * Commandes de vol synchronisées avec le backend Laravel & BDD MySQL.
 */
@Injectable({ providedIn: 'root' })
export class FlightControlService {
  private readonly drones = inject(DroneService);
  private readonly missions = inject(MissionService);
  private readonly flights = inject(FlightService);
  private readonly notifications = inject(NotificationService);
  private readonly alerts = inject(AlertService);
  private readonly backend = inject(BackendService);

  /** Accélération du temps pour l'exécution des vols programmés (démo : ×60 = 1 min simulée par seconde). */
  readonly timeScale = signal(1);
  private readonly elapsedMs = new Map<string, number>();

  constructor() {
    const sub = interval(1000).subscribe(() => this.tick());
    inject(DestroyRef).onDestroy(() => sub.unsubscribe());
  }

  takeOff(droneId: string, mode: FlightMode = 'manual', initialSpeed = 12.0): OpResult {
    const d = this.drones.byId(droneId);
    if (!d) return this.fail('Drone introuvable.');
    if (d.status === 'in-flight') return this.fail(`${d.name} est déjà en vol.`);
    if (d.status === 'maintenance') return this.fail(`${d.name} est en maintenance : décollage impossible.`);
    if (d.status === 'offline') return this.fail(`${d.name} est hors ligne : décollage impossible.`);
    if (d.batteryLevel < MIN_TAKEOFF_BATTERY) return this.fail(`Batterie trop faible (${Math.round(d.batteryLevel)} %) : minimum ${MIN_TAKEOFF_BATTERY} %.`);
    const speed = Math.max(2, Math.min(35, initialSpeed));
    this.drones.patch(droneId, { status: 'in-flight', speed, targetSpeed: speed, altitude: 15, flightMode: mode });
    this.notifications.success(`${d.name} mis en marche : décollage à ${speed.toFixed(1)} m/s (${Math.round(speed * 3.6)} km/h).`);

    // Synchronisation backend Laravel & BDD MySQL
    this.backend.takeOff(droneId);
    this.backend.setDroneSpeed(droneId, speed);
    return { ok: true };
  }

  setSpeed(droneId: string, speedMs: number): OpResult {
    const d = this.drones.byId(droneId);
    if (!d) return this.fail('Drone introuvable.');
    const safeSpeed = Math.max(1, Math.min(35, Math.round(speedMs * 10) / 10));
    const kmh = Math.round(safeSpeed * 3.6);
    this.drones.patch(droneId, { speed: safeSpeed, targetSpeed: safeSpeed });
    this.notifications.success(`Vitesse de ${d.name} : ${safeSpeed.toFixed(1)} m/s (${kmh} km/h).`);

    // Persistance en base de données MySQL
    this.backend.setDroneSpeed(droneId, safeSpeed);
    return { ok: true };
  }

  increaseSpeed(droneId: string, delta = 2.5): OpResult {
    const d = this.drones.byId(droneId);
    if (!d) return this.fail('Drone introuvable.');
    const current = d.speed || 8;
    return this.setSpeed(droneId, current + delta);
  }

  decreaseSpeed(droneId: string, delta = 2.5): OpResult {
    const d = this.drones.byId(droneId);
    if (!d) return this.fail('Drone introuvable.');
    const current = d.speed || 8;
    return this.setSpeed(droneId, current - delta);
  }

  land(droneId: string): OpResult {
    const d = this.drones.byId(droneId);
    if (!d) return this.fail('Drone introuvable.');
    if (d.status !== 'in-flight') return this.fail(`${d.name} n'est pas en vol.`);
    this.missions.interruptForDrone(droneId);
    this.drones.patch(droneId, { status: 'available', speed: 0, altitude: 0, currentMissionId: undefined });
    this.notifications.success(`${d.name} atterrit.`);

    // Synchronisation backend Laravel
    this.backend.land(droneId);
    return { ok: true };
  }

  returnToBase(droneId: string): OpResult {
    const d = this.drones.byId(droneId);
    if (!d) return this.fail('Drone introuvable.');
    if (d.status !== 'in-flight') return this.fail(`${d.name} n'est pas en vol.`);

    const flying = this.drones.drones().filter((x) => x.status === 'in-flight');
    const idx = flying.findIndex((x) => x.id === droneId);
    const safeAlt = 110 - Math.max(0, idx) * 30;
    const slot = Math.max(0, idx) + 1;

    this.drones.patch(droneId, { rthActive: true, rthAltitude: safeAlt, rthSlot: slot });
    this.notifications.success(`RTH Anti-Collision pour ${d.name} : Palier ${safeAlt} m · Créneau #${slot}.`);
    return { ok: true };
  }

  planSafeFleetRTH(): OpResult {
    const flying = this.drones.drones().filter((d) => d.status === 'in-flight');
    if (!flying.length) return this.fail('Aucun drone n\'est actuellement en vol.');

    flying.forEach((d, i) => {
      const safeAlt = 110 - (i * 30);
      const slot = i + 1;
      this.drones.patch(d.id, { rthActive: true, rthAltitude: safeAlt, rthSlot: slot });
    });

    this.notifications.success(
      `Plan RTH Anti-Collision actif (${flying.length} drone(s)) : Paliers étagés (110m / 80m / 50m) sans risque de collision.`
    );
    return { ok: true };
  }

  connectStation(droneId: string): OpResult {
    const d = this.drones.byId(droneId);
    if (!d) return this.fail('Drone introuvable.');
    this.notifications.success(`Connexion de « ${d.name} » à la station de base établie.`);

    // Synchronisation backend Laravel
    this.backend.connectStation(droneId);
    return { ok: true };
  }

  setMode(droneId: string, mode: FlightMode): void {
    const d = this.drones.byId(droneId);
    if (!d || d.flightMode === mode) return;
    this.drones.patch(droneId, { flightMode: mode });
    this.notifications.push(`${d.name} : mode ${FLIGHT_MODE[mode].label.toLowerCase()}.`, 'info');
  }

  /** Mode attendu à un instant donné d'après le plan de vol. */
  modeAt(plan: ModePlan, elapsedMin: number): FlightMode {
    let mode = plan.initial;
    for (const s of [...plan.steps].sort((a, b) => a.afterMin - b.afterMin)) if (elapsedMin >= s.afterMin) mode = s.mode;
    return mode;
  }

  private tick(): void {
    const now = Date.now();

    // Départs
    for (const f of this.flights.schedule()) {
      if (f.status !== 'planned') continue;
      const dep = new Date(f.departure).getTime();
      if (dep > now) continue;
      const drone = this.drones.byId(f.droneId);
      const mission = this.missions.byId(f.missionId);
      if (!drone || !mission) { this.flights.setStatus(f.id, 'failed'); continue; }
      const res = this.takeOff(f.droneId, f.modePlan.initial);
      if (!res.ok) {
        this.flights.setStatus(f.id, 'failed');
        this.alerts.raise(f.droneId, 'Départ impossible', 'high', res.error ?? 'Le vol programmé n\'a pas pu démarrer.');
        continue;
      }
      this.missions.start(f.missionId, f.droneId);
      this.flights.setStatus(f.id, 'running', new Date().toISOString());
      this.elapsedMs.set(f.id, 0);
      this.notifications.success(`Vol programmé démarré : ${mission.name}.`);
    }

    // Vols en cours : modes et fin de mission
    for (const f of this.flights.schedule()) {
      if (f.status !== 'running') continue;
      const drone = this.drones.byId(f.droneId);
      const mission = this.missions.byId(f.missionId);
      const started = f.startedAt ? new Date(f.startedAt).getTime() : now;
      const elapsed = (this.elapsedMs.get(f.id) ?? (now - started)) + 1000 * this.timeScale();
      this.elapsedMs.set(f.id, elapsed);
      const elapsedMin = elapsed / 60_000;

      if (!drone || !mission) continue;

      // Mode progressif d'après le plan
      const targetMode = this.modeAt(f.modePlan, elapsedMin);
      if (drone.flightMode !== targetMode) this.setMode(drone.id, targetMode);

      // Fin de mission normale
      if (elapsedMin >= mission.durationMin) {
        this.land(drone.id);
        this.missions.complete(mission.id);
        this.flights.setStatus(f.id, 'completed');
        this.flights.record({ date: new Date().toISOString(), droneId: drone.id, missionName: mission.name, durationMin: Math.round(elapsedMin), status: 'completed' });
        this.elapsedMs.delete(f.id);
        this.notifications.success(`Mission « ${mission.name} » terminée avec succès.`);
      }
    }
  }

  private fail(error: string): OpResult {
    return { ok: false, error };
  }
}
