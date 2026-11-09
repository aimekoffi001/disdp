import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { APP_SETTINGS } from '../config/app-settings';
import { AccelData, Drone, DroneTelemetry, GyroData, Motor, SensorReading, WindData } from '../models/models';
import { AlertService } from './alert.service';
import { DroneService } from './drone.service';
import { MissionService } from './mission.service';
import { NotificationService } from './notification.service';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const jitter = (amp: number) => (Math.random() * 2 - 1) * amp;
/** Les déplacements sont accélérés pour être visibles sur la carte (démo uniquement). */
const VISUAL_SPEED_FACTOR = 8;
const MAX_RADIUS_DEG = 0.0085;

interface Env { temperature: number; humidity: number; pressure: number; aqi: number; windSpeedKmh: number; windDirectionDeg: number; windGustKmh: number; }

/** Simulation de télémétrie. Aucune donnée ici ne provient d'un vrai capteur. */
@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private readonly droneService = inject(DroneService);
  private readonly alerts = inject(AlertService);
  private readonly missions = inject(MissionService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly demoMode = APP_SETTINGS.demoMode;
  readonly running = signal(false);
  private sub?: Subscription;
  private ticks = 0;

  private readonly motorLoads = new Map<string, number[]>();
  private readonly extras = new Map<string, { roll: number; pitch: number; sats: number; rssi: number; storage: number }>();
  private readonly telemetryMap = signal<Record<string, DroneTelemetry>>({});
  private readonly env = signal<Env>({ temperature: 34, humidity: 68, pressure: 1012, aqi: 42, windSpeedKmh: 14.8, windDirectionDeg: 65, windGustKmh: 20.4 });

  readonly selectedTelemetry = computed<DroneTelemetry>(() => {
    const d = this.droneService.selected();
    return (d && this.telemetryMap()[d.id]) ?? this.compute(d);
  });

  /** Capteurs environnementaux du drone sélectionné (valeurs simulées, signalées comme telles dans l'UI). */
  readonly selectedSensors = computed<SensorReading[]>(() => {
    const d = this.droneService.selected();
    const live = d?.status === 'in-flight';
    const e = this.env();
    const dash = '—';
    return [
      { key: 'temp', label: 'Température Ambiante', value: live ? e.temperature.toFixed(0) : '28', unit: '°C', status: live ? 'Optimale · Pas de surchauffe' : 'Stationnaire' },
      { key: 'hum', label: 'Humidité de l\'air', value: live ? e.humidity.toFixed(0) : '65', unit: '%', status: live ? 'Air sec · Visibilité nette' : 'Stationnaire' },




    ];
  });

  constructor() {
    this.telemetryMap.set(Object.fromEntries(this.droneService.drones().map((d) => [d.id, this.compute(d)])));
    this.destroyRef.onDestroy(() => this.pause());
    if (APP_SETTINGS.demoMode) this.start();
  }

  start(): void {
    if (this.sub && !this.sub.closed) return;
    this.running.set(true);
    this.sub = interval(APP_SETTINGS.telemetryIntervalMs).subscribe(() => this.tick());
  }

  pause(): void {
    this.sub?.unsubscribe();
    this.running.set(false);
    this.droneService.persist();
  }

  toggle(): void {
    this.running() ? this.pause() : this.start();
  }

  private tick(): void {
    const dt = APP_SETTINGS.telemetryIntervalMs / 1000;
    const next = this.droneService.drones().map((d) => this.step(d, dt));
    this.droneService.applyTelemetry(next);
    this.telemetryMap.set(Object.fromEntries(next.map((d) => [d.id, this.compute(d)])));
    this.env.update((e) => ({
      temperature: clamp(e.temperature + jitter(0.15), 28, 38),
      humidity: clamp(e.humidity + jitter(0.4), 40, 90),
      pressure: clamp(e.pressure + jitter(0.2), 1005, 1020),
      aqi: clamp(e.aqi + jitter(1.2), 15, 80),
      windSpeedKmh: clamp(e.windSpeedKmh + jitter(0.35), 8, 32),
      windDirectionDeg: (e.windDirectionDeg + jitter(1.8) + 360) % 360,
      windGustKmh: clamp(e.windSpeedKmh * 1.35 + jitter(0.6), 12, 42),
    }));
    if (++this.ticks % 15 === 0) this.droneService.persist();
  }

  /** Évolution cohérente : seul un drone en vol bouge et consomme sa batterie. */
  private step(d: Drone, dt: number): Drone {
    if (d.status !== 'in-flight') return d;

    const wobble = d.flightMode === 'manual' ? 1.6 : d.flightMode === 'semi-auto' ? 1 : 0.5;
    const speed = clamp(d.speed + jitter(0.3 * wobble), 5, 12);
    let heading = (d.heading + jitter(7 * wobble) + 360) % 360;

    const base = APP_SETTINGS;
    const dLatBase = base.baseLat - d.latitude;
    const dLngBase = base.baseLng - d.longitude;
    const distBase = Math.hypot(dLatBase, dLngBase);
    let altitude = d.altitude;
    if (d.rthActive) {
      heading = ((Math.atan2(dLngBase, dLatBase) * 180) / Math.PI + 360) % 360;
      const safeAlt = d.rthAltitude ?? 80;
      if (Math.abs(altitude - safeAlt) > 2) altitude += safeAlt > altitude ? 3 : -3;
      if (distBase < 0.0004) {
        if (altitude > 2) {
          altitude = Math.max(0, altitude - 6);
        } else {
          this.notifications.success(`${d.name} a atterri sur la base (Palier ${safeAlt} m · Créneau #${d.rthSlot ?? 1}).`);
          return { ...d, status: 'available', speed: 0, altitude: 0, rthActive: false, currentMissionId: undefined };
        }
      }
    } else if (d.assignedPerimeter && d.assignedPerimeter.length >= 3) {
      const cLat = d.assignedPerimeter.reduce((s, p) => s + p[0], 0) / d.assignedPerimeter.length;
      const cLng = d.assignedPerimeter.reduce((s, p) => s + p[1], 0) / d.assignedPerimeter.length;
      const dLatZone = cLat - d.latitude;
      const dLngZone = cLng - d.longitude;
      const distZone = Math.hypot(dLatZone, dLngZone);
      if (distZone > 0.0016) {
        heading = ((Math.atan2(dLngZone, dLatZone) * 180) / Math.PI + 360) % 360;
      } else {
        const wpIdx = Math.floor((this.ticks / 6) % d.assignedPerimeter.length);
        const targetWp = d.assignedPerimeter[wpIdx];
        heading = ((Math.atan2(targetWp[1] - d.longitude, targetWp[0] - d.latitude) * 180) / Math.PI + 360) % 360;
      }
    } else if (distBase > MAX_RADIUS_DEG) {
      // retour vers la base quand le drone s'éloigne trop
      heading = ((Math.atan2(dLngBase, dLatBase) * 180) / Math.PI + 360) % 360;
    }

    const meters = speed * dt * VISUAL_SPEED_FACTOR;
    const rad = (heading * Math.PI) / 180;
    const latitude = d.latitude + (meters * Math.cos(rad)) / 111320;
    const longitude = d.longitude + (meters * Math.sin(rad)) / (111320 * Math.cos((d.latitude * Math.PI) / 180));

    const batteryDrain = (0.045 + (speed / 10) * 0.015) * dt;
    const batteryLevel = Math.max(0, Math.round((d.batteryLevel - batteryDrain) * 100) / 100);
    if (!d.rthActive) { altitude = d.altitude < 60 ? d.altitude + 8 : clamp(d.altitude + jitter(1.5), 60, 130); }
    const addedKm = (speed * dt * 1.8) / 1000;
    const distanceKm = Math.round((d.distanceKm + addedKm) * 1000) / 1000;
    const nominalRange = d.maxRangeKm ?? APP_SETTINGS.maxRangeKm;
    const currentRangeKm = Math.max(0.5, Math.round(((nominalRange * (batteryLevel / 100)) + jitter(0.08)) * 10) / 10);

    const flying: Drone = { ...d, speed: Math.round(speed * 10) / 10, heading, latitude, longitude, batteryLevel, altitude, distanceKm, currentRangeKm };

    if (batteryLevel <= 20) {
      this.alerts.raise(d.id, 'Faible batterie', 'medium', `${d.name} : batterie sous 20 %.`);
    }
    if (batteryLevel <= 10) {
      this.missions.interruptForDrone(d.id);
      this.notifications.warning(`${d.name} atterrit automatiquement (batterie critique).`);
      this.alerts.raise(d.id, 'Atterrissage d\'urgence', 'high', `${d.name} a atterri automatiquement (batterie critique).`);
      return { ...flying, status: 'available', speed: 0, altitude: 0, currentMissionId: undefined };
    }
    return flying;
  }

  private compute(d: Drone | undefined): DroneTelemetry {
    const pressureHpa = Math.round(this.env().pressure);
    if (!d) {
      const defaultWind: WindData = { speedKmh: 14.8, speedMs: 4.1, directionDeg: 65, cardinal: 'ENE', gustKmh: 20.4, status: 'Modéré', driftEffect: '—' };
      const defaultGyro: GyroData = { rateRoll: 0, ratePitch: 0, rateYaw: 0, stabilityPct: 100, status: 'Inactif' };
      const defaultAccel: AccelData = { ax: 0, ay: 0, az: 9.81, instantAccel: 0, gForce: 1.0 };
      return { voltage: 0, batteryTemp: 0, autonomyMin: 0, motors: [], satellites: null, roll: null, pitch: null, yaw: null, lidarM: null, rssiDbm: null, storageFreePct: null, storageTotalGb: APP_SETTINGS.storageTotalGb, pressureHpa, gyro: defaultGyro, accel: defaultAccel, wind: defaultWind };
    }
    const flying = d.status === 'in-flight';
    const online = d.status !== 'offline';

    // Diagonales asynchrones (AVG=ARD et AVD=ARG)
    const prevLoads = this.motorLoads.get(d.id) ?? [56, 50, 56, 50];
    const d1 = clamp(prevLoads[0] + jitter(1.6), 44, 86);
    const d2 = clamp(prevLoads[1] + jitter(1.6), 44, 86);
    const nextLoads = flying ? [d1, d2, d1, d2] : [0, 0, 0, 0];
    this.motorLoads.set(d.id, flying ? [d1, d2, d1, d2] : [56, 50, 56, 50]);

    const motors: Motor[] = nextLoads.map((load, i) => ({
      id: `M${i + 1}`,
      load: Math.round(load),
      rpm: Math.round(load * 100),
      pwm: flying ? Math.round(1000 + load * 10) : 1000,
      state: !flying ? 'off' : load > 85 ? 'warning' : 'ok',
    }));

    // Données de vol étendues (IMU, GPS, liaison, stockage) : simulées, évoluent doucement tant que le drone vole
    const x = this.extras.get(d.id) ?? { roll: 2.7, pitch: 0.3, sats: 9, rssi: -64, storage: 71 };
    const prevRoll = x.roll;
    const prevPitch = x.pitch;
    if (flying) {
      x.roll = clamp(x.roll + jitter(0.5), -6, 6);
      x.pitch = clamp(x.pitch + jitter(0.4), -5, 5);
      x.sats = clamp(x.sats + jitter(0.5), 7, 12);
      x.rssi = clamp(x.rssi + jitter(1.5), -85, -50);
      x.storage = Math.max(5, x.storage - 0.01);
    }
    this.extras.set(d.id, x);

    // Gyroscope 3-axes pour la stabilité active (°/s)
    const rateRoll = flying ? Math.round((x.roll - prevRoll) * 10) / 10 : 0;
    const ratePitch = flying ? Math.round((x.pitch - prevPitch) * 10) / 10 : 0;
    const rateYaw = flying ? Math.round(jitter(1.2) * 10) / 10 : 0;
    const stabilityPct = flying ? Math.round((99.5 - Math.abs(x.roll * 0.12) - Math.abs(x.pitch * 0.12)) * 10) / 10 : 100;
    const gyro: GyroData = {
      rateRoll,
      ratePitch,
      rateYaw,
      stabilityPct,
      status: !flying ? 'Inactif (au sol)' : stabilityPct >= 98.5 ? 'Verrouillé · Stabilité optimale' : 'Compensation active',
    };

    // Accélération 3-axes pour la vitesse (m/s² et G)
    const instantAccel = flying ? Math.round(jitter(0.35) * 10) / 10 : 0;
    const ax = flying ? Math.round((instantAccel + 0.15) * 10) / 10 : 0;
    const ay = flying ? Math.round(jitter(0.25) * 10) / 10 : 0;
    const az = flying ? Math.round((9.81 + (d.altitude > 0 ? 0.35 + jitter(0.1) : 0)) * 10) / 10 : 9.81;
    const gForce = Math.round((Math.hypot(ax, ay, az) / 9.81) * 100) / 100;
    const accel: AccelData = { ax, ay, az, instantAccel, gForce };

    // Direction et vitesse du vent en temps réel
    const envData = this.env();
    const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const cardIdx = Math.round(envData.windDirectionDeg / 45) % 8;
    const cardinal = CARDINALS[cardIdx];
    const diff = (envData.windDirectionDeg - d.heading + 360) % 360;
    const driftEffect = !flying
      ? 'Au sol (calme)'
      : (diff < 45 || diff > 315)
        ? 'Vent de face (compensation)'
        : (diff > 135 && diff < 225)
          ? 'Vent arrière (portée accrue)'
          : 'Vent traversier (compensé par gyro)';
    const wind: WindData = {
      speedKmh: Math.round(envData.windSpeedKmh * 10) / 10,
      speedMs: Math.round((envData.windSpeedKmh / 3.6) * 10) / 10,
      directionDeg: Math.round(envData.windDirectionDeg),
      cardinal,
      gustKmh: Math.round(envData.windGustKmh * 10) / 10,
      status: envData.windSpeedKmh < 12 ? 'Calme' : envData.windSpeedKmh < 24 ? 'Modéré' : 'Rafales',
      driftEffect,
    };

    return {
      voltage: Math.round((20.4 + 0.0459 * d.batteryLevel) * 10) / 10,
      batteryTemp: flying ? Math.round(34 + (100 - d.batteryLevel) * 0.04 + jitter(0.2)) : 28,
      autonomyMin: Math.round(d.batteryLevel * 0.43),
      motors,
      satellites: online ? Math.round(x.sats) : null,
      roll: online ? (flying ? Math.round(x.roll * 10) / 10 : 0) : null,
      pitch: online ? (flying ? Math.round(x.pitch * 10) / 10 : 0) : null,
      yaw: online ? Math.round(d.heading) : null,
      lidarM: flying ? Math.max(0, Math.round((d.altitude - 0.8 + jitter(0.3)) * 10) / 10) : null,
      rssiDbm: online ? (flying ? Math.round(x.rssi) : -48) : null,
      storageFreePct: online ? Math.round(x.storage) : null,
      storageTotalGb: APP_SETTINGS.storageTotalGb,
      pressureHpa,
      gyro,
      accel,
      wind,
    };
  }
}
