export type DroneStatus = 'in-flight' | 'available' | 'maintenance' | 'offline';
export type FlightMode = 'manual' | 'semi-auto' | 'auto';
export type LatLng = [number, number];

export interface Drone {
  id: string;
  name: string;
  code: string;
  status: DroneStatus;
  batteryLevel: number; // 0-100
  currentMissionId?: string;
  latitude: number;
  longitude: number;
  altitude: number; // m
  speed: number; // m/s
  heading: number; // degrés 0-359
  distanceKm: number; // distance parcourue (jour)
  maxRangeKm?: number;
  currentRangeKm?: number;
  rthActive?: boolean;
  rthAltitude?: number;
  rthSlot?: number;
  assignedPerimeter?: LatLng[];
  assignedZoneName?: string;
  flightMode: FlightMode;
}

/** Champs saisis dans le formulaire (le reste est dérivé / simulé). */
export interface DroneInput {
  name: string;
  code: string;
  status: DroneStatus;
  batteryLevel: number;
}

export type MissionStatus = 'in-progress' | 'planned' | 'completed' | 'cancelled';

export interface Mission {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  status: MissionStatus;
  /** Drone affecté : renseigné au démarrage du vol (planification), pas à la création. */
  droneId?: string;
}
export interface MissionInput {
  name: string;
  description: string;
  durationMin: number;
}

export interface SurveillanceZone {
  id: string;
  name: string;
  color: string;
  polygon: [number, number][];
}

export type AlertSeverity = 'high' | 'medium' | 'low';
export type AlertStatus = 'new' | 'in-progress' | 'resolved';

export interface Alert {
  id: string;
  timestamp: string; // ISO
  droneId: string;
  type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  details: string;
}

export interface FlightRecord {
  id: string;
  date: string; // ISO
  droneId: string;
  missionName: string;
  durationMin: number;
  status: 'completed' | 'aborted';
}

export type ScheduleStatus = 'planned' | 'running' | 'completed' | 'cancelled' | 'failed';

export interface ModeStep {
  mode: FlightMode;
  /** Minutes écoulées depuis le décollage avant de passer dans ce mode. */
  afterMin: number;
}
export interface ModePlan {
  initial: FlightMode;
  steps: ModeStep[];
}

export interface ScheduledFlight {
  id: string;
  droneId: string;
  missionId: string;
  departure: string; // ISO
  modePlan: ModePlan;
  perimeters: LatLng[][];
  status: ScheduleStatus;
  startedAt?: string;
}
export interface ScheduledFlightInput {
  droneId: string;
  missionId: string;
  departure: string;
  modePlan: ModePlan;
  perimeters: LatLng[][];
}

export type MotorState = 'ok' | 'warning' | 'off';
export interface Motor {
  id: string; // M1..M4
  load: number; // % du régime max
  rpm: number;
  pwm: number; // commande en µs (1000 = arrêt, 2000 = plein gaz)
  state: MotorState;
}

export interface WindData {
  speedKmh: number;
  speedMs: number;
  directionDeg: number;
  cardinal: string;
  gustKmh: number;
  status: string;
  driftEffect: string;
}

export interface GyroData {
  rateRoll: number;
  ratePitch: number;
  rateYaw: number;
  stabilityPct: number;
  status: string;
}

export interface AccelData {
  ax: number;
  ay: number;
  az: number;
  instantAccel: number;
  gForce: number;
}

export interface RthSlot {
  droneId: string;
  droneName: string;
  assignedAltitude: number;
  slotIndex: number;
  etaSeconds: number;
  status: 'en_approche' | 'palier_securite' | 'atterrissage_autorise' | 'au_sol';
}

export interface DroneTelemetry {
  voltage: number; // V
  batteryTemp: number; // °C
  autonomyMin: number;
  motors: Motor[];
  satellites: number | null;
  roll: number | null; // °
  pitch: number | null; // °
  yaw: number | null; // °
  lidarM: number | null; // m
  rssiDbm: number | null;
  storageFreePct: number | null;
  storageTotalGb: number;
  pressureHpa: number;
  gyro: GyroData;
  accel: AccelData;
  wind: WindData;
}

export interface SensorReading {
  key: string;
  label: string;
  value: number | string;
  unit: string;
  status?: string;
}

export type NotificationType = 'success' | 'error' | 'info' | 'warning';
export interface AppNotification {
  id: number;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
}

export interface OpResult {
  ok: boolean;
  error?: string;
}
