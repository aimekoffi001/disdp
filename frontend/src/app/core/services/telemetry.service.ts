import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { APP_SETTINGS } from '../config/app-settings';
import { AccelData, Drone, DroneTelemetry, GyroData, Motor, SensorReading, WindData } from '../models/models';
import { AlertService } from './alert.service';
import { BackendService } from './backend.service';
import { DroneService } from './drone.service';
import { MissionService } from './mission.service';
import { NotificationService } from './notification.service';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const jitter = (amp: number) => (Math.random() * 2 - 1) * amp;
/** Facteur d'affichage sur la carte tactique */
const VISUAL_SPEED_FACTOR = 8;
const MAX_RADIUS_DEG = 0.0085;

interface Env {
  temperature: number;
  humidity: number;
  pressure: number;
  aqi: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  windGustKmh: number;
}

/**
 * Télémétrie et capteurs météo en temps réel (1 Hz).
 * Réagit instantanément à la mise en marche du drone, à l'altitude et à la vitesse.
 */
@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private readonly droneService = inject(DroneService);
  private readonly alerts = inject(AlertService);
  private readonly missions = inject(MissionService);
  private readonly notifications = inject(NotificationService);
  private readonly backend = inject(BackendService);
  private readonly destroyRef = inject(DestroyRef);

  readonly demoMode = APP_SETTINGS.demoMode;
  readonly running = signal(false);
  private sub?: Subscription;
  private ticks = 0;

  private readonly motorLoads = new Map<string, number[]>();
  private readonly extras = new Map<string, { roll: number; pitch: number; prevRoll: number; prevPitch: number; prevHeading: number; sats: number; rssi: number; storage: number }>();
  private readonly telemetryMap = signal<Record<string, DroneTelemetry>>({});
  private readonly env = signal<Env>({
    temperature: 31.4,
    humidity: 68,
    pressure: 1013.2,
    aqi: 34,
    windSpeedKmh: 14.5,
    windDirectionDeg: 65,
    windGustKmh: 19.8,
  });

  readonly selectedTelemetry = computed<DroneTelemetry>(() => {
    const d = this.droneService.selected();
    return (d && this.telemetryMap()[d.id]) ?? this.compute(d);
  });

  /** Capteurs météo et environnementaux réagissant en temps réel à l'état de vol */
  readonly selectedSensors = computed<SensorReading[]>(() => {
    const d = this.droneService.selected();
    const live = d?.status === 'in-flight';
    const alt = d ? d.altitude : 0;
    const speed = d ? d.speed : 0;
    const e = this.env();

    // 1. Température Ambiante : refroidissement adiabatique altimétrique (-0.65°C / 100m) et flux d'air en vol
    const liveTemp = live
      ? clamp(e.temperature - (alt * 0.0065) - (speed * 0.04), 18, 45)
      : e.temperature;

    // 2. Humidité Relative : hygrométrie dynamique des couches atmosphériques
    const liveHum = live
      ? clamp(e.humidity + (alt * 0.03), 40, 95)
      : e.humidity;

    // 3. Pression Barométrique : Formule barométrique internationale exacte P = P0 * (1 - 2.25577e-5 * h)^5.25588
    const livePress = live
      ? 1013.25 * Math.pow(1 - 2.25577e-5 * Math.max(0, alt), 5.25588)
      : 1013.2;

    // 4. Qualité de l'air & Détection gaz (Sonde MQ-2) : pureté d'air en altitude
    const liveAqi = live
      ? clamp(e.aqi - (alt * 0.12), 12, 60)
      : e.aqi;

    return [
      {
        key: 'temp',
        label: 'Température Ambiante',
        value: liveTemp.toFixed(1),
        unit: '°C',
        status: live ? 'Flux dynamique · Refroidissement' : 'Stationnaire (au sol)',
      },
      {
        key: 'hum',
        label: 'Humidité de l\'air',
        value: Math.round(liveHum).toString(),
        unit: '%',
        status: live ? 'Optimal · Air sec sans brume' : 'Hygrométrie nominale',
      },
      {
        key: 'press',
        label: 'Pression Barométrique',
        value: livePress.toFixed(0),
        unit: 'hPa',
        status: live ? `Altimétrie baro (${alt.toFixed(0)} m)` : 'Pression standard niveau mer',
      },
      {
        key: 'air',
        label: 'Qualité Air / Gaz (MQ-2)',
        value: Math.round(liveAqi).toString(),
        unit: 'ppm',
        status: live ? 'Air pur en altitude · Conforme' : 'Sonde calibrée (nominal)',
      },
    ];
  });

  constructor() {
    this.telemetryMap.set(Object.fromEntries(this.droneService.drones().map((d) => [d.id, this.compute(d)])));
    this.destroyRef.onDestroy(() => this.pause());
    // Démarrage permanent du moteur de télémétrie temps réel
    this.start();
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
    const currentDrones = this.droneService.drones();
    const next = currentDrones.map((d) => this.step(d, dt));
    this.droneService.applyTelemetry(next);
    this.telemetryMap.set(Object.fromEntries(next.map((d) => [d.id, this.compute(d)])));

    // Évolution aérologique et atmosphérique naturelle en temps réel
    this.env.update((e) => ({
      temperature: clamp(e.temperature + jitter(0.12), 27, 36),
      humidity: clamp(e.humidity + jitter(0.35), 45, 85),
      pressure: clamp(e.pressure + jitter(0.1), 1008, 1018),
      aqi: clamp(e.aqi + jitter(0.8), 20, 55),
      windSpeedKmh: clamp(e.windSpeedKmh + jitter(0.4), 8, 30),
      windDirectionDeg: (e.windDirectionDeg + jitter(1.5) + 360) % 360,
      windGustKmh: clamp(e.windSpeedKmh * 1.35 + jitter(0.5), 12, 40),
    }));

    // Synchronisation périodique avec MySQL (toutes les 10 secondes pour les drones en vol)
    if (++this.ticks % 10 === 0) {
      this.syncActiveDronesToBackend(next);
    }
  }

  /** Met à jour la télémétrie des drones en vol en BDD MySQL */
  private syncActiveDronesToBackend(drones: Drone[]): void {
    const active = drones.filter((d) => d.status === 'in-flight');
    for (const d of active) {
      this.backend.syncTelemetry(d.id, {
        speed: d.speed,
        altitude: d.altitude,
        latitude: d.latitude,
        longitude: d.longitude,
        batteryLevel: d.batteryLevel,
      });

      // Synchronisation de la sonde météo température (capteur 1) et du lidar (capteur 2)
      const e = this.env();
      const tempVal = clamp(e.temperature - (d.altitude * 0.0065) - (d.speed * 0.04), 18, 45);
      this.backend.syncCapteurValue(1, tempVal);
      if (d.altitude > 0) {
        this.backend.syncCapteurValue(2, d.altitude);
      }
    }
  }

  /** Évolution dynamique : le drone décolle, accélère, monte en altitude et navigue en temps réel */
  private step(d: Drone, dt: number): Drone {
    if (d.status !== 'in-flight') return d;

    const wobble = d.flightMode === 'manual' ? 1.4 : d.flightMode === 'semi-auto' ? 0.9 : 0.4;
    const target = d.targetSpeed ?? d.speed ?? 12;
    // Vitesse dynamique approchant la consigne
    const speed = clamp(target + jitter(0.2 * wobble), 1, 35);
    let heading = (d.heading + jitter(5 * wobble) + 360) % 360;

    const base = APP_SETTINGS;
    const dLatBase = base.baseLat - d.latitude;
    const dLngBase = base.baseLng - d.longitude;
    const distBase = Math.hypot(dLatBase, dLngBase);
    let altitude = d.altitude;

    // Montée en altitude progressive et maintien de palier en vol
    if (d.rthActive) {
      heading = ((Math.atan2(dLngBase, dLatBase) * 180) / Math.PI + 360) % 360;
      const safeAlt = d.rthAltitude ?? 80;
      if (Math.abs(altitude - safeAlt) > 2) altitude += safeAlt > altitude ? 3 : -3;
      if (distBase < 0.0004) {
        if (altitude > 2) {
          altitude = Math.max(0, altitude - 5);
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
      // Altitude de patrouille entre 60m et 90m
      if (altitude < 65) altitude = Math.min(65, altitude + 4 * dt);
    } else if (distBase > MAX_RADIUS_DEG) {
      // Retour vers la base quand le drone s'éloigne trop
      heading = ((Math.atan2(dLngBase, dLatBase) * 180) / Math.PI + 360) % 360;
    } else {
      // Montée en altitude automatique vers l'altitude de croisière (60m)
      if (altitude < 60) {
        altitude = Math.min(60, altitude + 6 * dt);
      } else {
        altitude = clamp(altitude + jitter(0.8), 58, 85);
      }
    }

    const meters = speed * dt * VISUAL_SPEED_FACTOR;
    const rad = (heading * Math.PI) / 180;
    const latitude = d.latitude + (meters * Math.cos(rad)) / 111320;
    const longitude = d.longitude + (meters * Math.sin(rad)) / (111320 * Math.cos((d.latitude * Math.PI) / 180));

    // Consommation énergétique réaliste en vol selon l'effort moteur et la vitesse
    const batteryDrain = (0.035 + (speed / 20) * 0.02) * dt;
    const batteryLevel = Math.max(0, Math.round((d.batteryLevel - batteryDrain) * 100) / 100);
    const addedKm = (speed * dt * 1.8) / 1000;
    const distanceKm = Math.round((d.distanceKm + addedKm) * 1000) / 1000;
    const nominalRange = d.maxRangeKm ?? APP_SETTINGS.maxRangeKm;
    const currentRangeKm = Math.max(0.5, Math.round(((nominalRange * (batteryLevel / 100)) + jitter(0.08)) * 10) / 10);

    const flying: Drone = {
      ...d,
      speed: Math.round(speed * 10) / 10,
      heading,
      latitude,
      longitude,
      batteryLevel,
      altitude: Math.round(altitude * 10) / 10,
      distanceKm,
      currentRangeKm,
    };

    if (batteryLevel <= 20 && batteryLevel > 19.8) {
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
    const envData = this.env();
    const altitude = d ? d.altitude : 0;
    const speed = d ? d.speed : 0;
    const flying = d?.status === 'in-flight';
    const online = d?.status !== 'offline';

    // 1. Pression barométrique altimétrique exacte (hPa)
    const pressureHpa = Math.round(
      1013.25 * Math.pow(1 - 2.25577e-5 * Math.max(0, altitude), 5.25588)
    );

    if (!d) {
      const defaultWind: WindData = {
        speedKmh: 14.5,
        speedMs: 4.0,
        directionDeg: 65,
        cardinal: 'ENE',
        gustKmh: 19.8,
        status: 'Modéré',
        driftEffect: '—',
      };
      const defaultGyro: GyroData = { rateRoll: 0, ratePitch: 0, rateYaw: 0, stabilityPct: 100, status: 'Inactif' };
      const defaultAccel: AccelData = { ax: 0, ay: 0, az: 9.81, instantAccel: 0, gForce: 1.0 };
      return {
        voltage: 0,
        batteryTemp: 0,
        autonomyMin: 0,
        motors: [],
        satellites: null,
        roll: null,
        pitch: null,
        yaw: null,
        lidarM: null,
        rssiDbm: null,
        storageFreePct: null,
        storageTotalGb: APP_SETTINGS.storageTotalGb,
        pressureHpa,
        gyro: defaultGyro,
        accel: defaultAccel,
        wind: defaultWind,
      };
    }

    // 2. Moteurs & Rotors 4 axes : PWM dynamique réactif à la vitesse et à la charge
    // En vol : PWM 1420 - 1920 µs (régime 50% - 92%, 4800 à 8000 RPM)
    // Au sol : PWM 1000 µs (arrêt)
    const basePwm = flying ? clamp(1420 + (speed / 35) * 460, 1400, 1950) : 1000;
    const pwm1 = flying ? clamp(basePwm + jitter(12), 1380, 1980) : 1000;
    const pwm2 = flying ? clamp(basePwm - 20 + jitter(12), 1380, 1980) : 1000;

    const loads = flying
      ? [
          ((pwm1 - 1000) / 1000) * 100,
          ((pwm2 - 1000) / 1000) * 100,
          ((pwm1 - 1000) / 1000) * 100,
          ((pwm2 - 1000) / 1000) * 100,
        ]
      : [0, 0, 0, 0];
    this.motorLoads.set(d.id, loads);

    const motors: Motor[] = loads.map((load, i) => {
      const isDiag1 = i === 0 || i === 2;
      const pwm = Math.round(isDiag1 ? pwm1 : pwm2);
      return {
        id: `M${i + 1}`,
        load: Math.round(load),
        rpm: flying ? Math.round(3200 + load * 52) : 0,
        pwm,
        state: !flying ? 'off' : load > 88 ? 'warning' : 'ok',
      };
    });

    // 3. IMU, Horizon Artificiel (Assiette) et dynamique de vol
    const x = this.extras.get(d.id) ?? {
      roll: 0,
      pitch: 0,
      prevRoll: 0,
      prevPitch: 0,
      prevHeading: d.heading,
      sats: 12,
      rssi: -58,
      storage: 72,
    };
    const prevRoll = x.roll;
    const prevPitch = x.pitch;
    const headingDelta = (d.heading - x.prevHeading + 540) % 360 - 180;
    x.prevHeading = d.heading;

    if (flying) {
      // Tangage : inclinaison vers l'avant selon la vitesse (-2° à -8°) et cabré lors des montées
      const climbFactor = altitude < 50 ? 2.5 : 0;
      const targetPitch = -Math.min(9, Math.max(1.5, (speed / 25) * 5.5)) + climbFactor;
      x.pitch = clamp(targetPitch + jitter(0.35), -12, 6);

      // Roulis : inclinaison en virage et compensation des rafales
      const targetRoll = clamp((headingDelta * 1.2) + jitter(0.6), -7, 7);
      x.roll = targetRoll;

      x.sats = clamp(11 + Math.round(jitter(1.2)), 9, 16);

      // Signal RSSI s'atténuant avec l'éloignement
      const dLatBase = APP_SETTINGS.baseLat - d.latitude;
      const dLngBase = APP_SETTINGS.baseLng - d.longitude;
      const distKm = Math.hypot(dLatBase, dLngBase) * 111.32;
      x.rssi = clamp(-50 - (distKm * 2.8) + jitter(1.5), -88, -48);
      x.storage = Math.max(5, x.storage - 0.01);
    } else {
      x.roll = 0;
      x.pitch = 0;
      x.sats = 10;
      x.rssi = -48;
    }
    this.extras.set(d.id, x);

    // Gyroscope 3-axes (°/s) et stabilité active
    const rateRoll = flying ? Math.round((x.roll - prevRoll) * 10) / 10 : 0;
    const ratePitch = flying ? Math.round((x.pitch - prevPitch) * 10) / 10 : 0;
    const rateYaw = flying ? Math.round(jitter(1.2) * 10) / 10 : 0;
    const stabilityPct = flying
      ? clamp(99.6 - Math.abs(x.roll * 0.12) - Math.abs(x.pitch * 0.12) - (envData.windSpeedKmh * 0.02), 97, 100)
      : 100;
    const gyro: GyroData = {
      rateRoll,
      ratePitch,
      rateYaw,
      stabilityPct: Math.round(stabilityPct * 10) / 10,
      status: !flying
        ? 'Inactif (au sol)'
        : stabilityPct >= 98.5
          ? 'Verrouillé · Stabilité optimale'
          : 'Compensation active',
    };

    // Accéléromètre 3-axes et dynamique (m/s² et G)
    const instantAccel = flying ? Math.round(clamp(0.4 + (speed / 20) * 1.2 + jitter(0.2), 0.2, 3.5) * 10) / 10 : 0;
    const ax = flying ? Math.round((instantAccel + 0.1) * 10) / 10 : 0;
    const ay = flying ? Math.round(jitter(0.2) * 10) / 10 : 0;
    const az = flying ? Math.round((9.81 + (altitude > 0 ? 0.35 + jitter(0.1) : 0)) * 10) / 10 : 9.81;
    const gForce = Math.round((Math.hypot(ax, ay, az) / 9.81) * 100) / 100;
    const accel: AccelData = { ax, ay, az, instantAccel, gForce };

    // 4. Vent & Aérologie : anémomètre, girouette et rose des vents réactifs
    const CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const cardIdx = Math.round(envData.windDirectionDeg / 45) % 8;
    const cardinal = CARDINALS[cardIdx];

    // Effet aérodynamique selon l'angle relatif du vent face au cap du drone
    const diff = (envData.windDirectionDeg - d.heading + 360) % 360;
    const driftEffect = !flying
      ? 'Drone au sol (calme)'
      : (diff < 45 || diff > 315)
        ? 'Vent de face (effort moteur +15%, assiette compensée)'
        : (diff > 135 && diff < 225)
          ? 'Vent arrière (portée accrue, poussée favorable)'
          : 'Vent traversier (correction dérive par gyroscope active)';

    // Gradient altimétrique : le vent est plus fort en altitude
    const altWindBonus = flying ? Math.min(8, (altitude / 70) * 3.5) : 0;
    const effectiveWindKmh = Math.round((envData.windSpeedKmh + altWindBonus) * 10) / 10;
    const effectiveGustKmh = Math.round((envData.windGustKmh + altWindBonus * 1.2) * 10) / 10;

    const wind: WindData = {
      speedKmh: effectiveWindKmh,
      speedMs: Math.round((effectiveWindKmh / 3.6) * 10) / 10,
      directionDeg: Math.round(envData.windDirectionDeg),
      cardinal,
      gustKmh: effectiveGustKmh,
      status: effectiveWindKmh < 15 ? 'Calme · Optimal' : effectiveWindKmh < 26 ? 'Modéré · Vol stable' : 'Rafales soutenues',
      driftEffect,
    };

    return {
      voltage: Math.round((20.6 + 0.042 * d.batteryLevel - (flying ? 0.3 : 0)) * 10) / 10,
      batteryTemp: flying ? Math.round(31 + (100 - d.batteryLevel) * 0.05 + (speed / 20) * 2 + jitter(0.2)) : 28,
      autonomyMin: Math.round(d.batteryLevel * 0.42),
      motors,
      satellites: online ? Math.round(x.sats) : null,
      roll: online ? (flying ? Math.round(x.roll * 10) / 10 : 0) : null,
      pitch: online ? (flying ? Math.round(x.pitch * 10) / 10 : 0) : null,
      yaw: online ? Math.round(d.heading) : null,
      lidarM: flying ? Math.max(0.4, Math.round((d.altitude - 0.6 + jitter(0.2)) * 10) / 10) : null,
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
