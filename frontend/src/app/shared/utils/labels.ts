import { AlertSeverity, AlertStatus, DroneStatus, MissionStatus, ScheduleStatus } from '../../core/models/models';

export type Tone = 'green' | 'blue' | 'red' | 'amber' | 'gray' | 'violet';

export const DRONE_STATUS: Record<DroneStatus, { label: string; tone: Tone }> = {
  'in-flight': { label: 'En vol', tone: 'green' },
  available: { label: 'Disponible', tone: 'green' },
  maintenance: { label: 'En maintenance', tone: 'red' },
  offline: { label: 'Hors ligne', tone: 'gray' },
};
export const MISSION_STATUS: Record<MissionStatus, { label: string; tone: Tone }> = {
  'in-progress': { label: 'En cours', tone: 'blue' },
  planned: { label: 'Planifiée', tone: 'violet' },
  completed: { label: 'Terminée', tone: 'green' },
  cancelled: { label: 'Annulée', tone: 'gray' },
};
export const ALERT_SEVERITY: Record<AlertSeverity, { label: string; tone: Tone }> = {
  high: { label: 'Élevé', tone: 'red' },
  medium: { label: 'Moyen', tone: 'amber' },
  low: { label: 'Faible', tone: 'blue' },
};
export const ALERT_STATUS: Record<AlertStatus, { label: string; tone: Tone }> = {
  new: { label: 'Nouvelle', tone: 'red' },
  'in-progress': { label: 'En cours', tone: 'blue' },
  resolved: { label: 'Résolue', tone: 'green' },
};
export const SCHEDULE_STATUS: Record<ScheduleStatus, { label: string; tone: Tone }> = {
  planned: { label: 'Planifié', tone: 'blue' },
  running: { label: 'En vol', tone: 'green' },
  completed: { label: 'Terminé', tone: 'green' },
  failed: { label: 'Interrompu', tone: 'red' },
  cancelled: { label: 'Annulé', tone: 'gray' },
};

export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
export function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function fmtDateTime(iso: string): string {
  return `${fmtDate(iso)} ${fmtTime(iso)}`;
}
/** Valeur pour <input type="datetime-local"> (heure locale). */
export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function batteryTone(level: number): Tone {
  return level >= 50 ? 'green' : level >= 25 ? 'amber' : 'red';
}

import { FlightMode, ModePlan } from '../../core/models/models';
export const FLIGHT_MODE: Record<FlightMode, { label: string; tone: Tone }> = {
  manual: { label: 'Manuel', tone: 'amber' },
  'semi-auto': { label: 'Semi-automatique', tone: 'blue' },
  auto: { label: 'Automatique', tone: 'green' },
};
export function describeModePlan(plan: ModePlan): string {
  return [FLIGHT_MODE[plan.initial].label, ...plan.steps.map((s) => `${FLIGHT_MODE[s.mode].label} (${s.afterMin} min)`)].join(' → ');
}
