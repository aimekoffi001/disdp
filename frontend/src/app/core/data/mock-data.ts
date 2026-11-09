import { APP_SETTINGS } from '../config/app-settings';
import {
  Alert, Drone, FlightRecord, Mission, ScheduledFlight, SurveillanceZone,
} from '../models/models';

const { baseLat: LAT, baseLng: LNG } = APP_SETTINGS;

/** Valeurs « de la veille » utilisées uniquement pour afficher les tendances (démo). */
export const MOCK_PREVIOUS_DAY = { battery: 69, distanceKm: 5.1, speed: 7.5 };

export const MOCK_ZONES: SurveillanceZone[] = [
  { id: 'z1', name: 'Champ 1', color: '#20d6a0', polygon: [[LAT + 0.0035, LNG - 0.0075], [LAT + 0.0035, LNG - 0.0005], [LAT - 0.0005, LNG - 0.0005], [LAT - 0.0005, LNG - 0.0075]] },
  { id: 'z2', name: 'Champ 2', color: '#1687ff', polygon: [[LAT + 0.0035, LNG + 0.0005], [LAT + 0.0035, LNG + 0.0075], [LAT - 0.0005, LNG + 0.0075], [LAT - 0.0005, LNG + 0.0005]] },
  { id: 'z3', name: 'Champ 3', color: '#f5bd42', polygon: [[LAT - 0.0015, LNG - 0.0075], [LAT - 0.0015, LNG - 0.0005], [LAT - 0.0055, LNG - 0.0005], [LAT - 0.0055, LNG - 0.0075]] },
  { id: 'z4', name: 'Champ 4', color: '#9a4dff', polygon: [[LAT - 0.0015, LNG + 0.0005], [LAT - 0.0015, LNG + 0.0075], [LAT - 0.0055, LNG + 0.0075], [LAT - 0.0055, LNG + 0.0005]] },
];

export const createMockDrones = (): Drone[] => [
  { id: 'd1', name: 'Drone 1', code: 'DR-001', status: 'in-flight', batteryLevel: 74, currentMissionId: 'm1', latitude: LAT, longitude: LNG, altitude: 120, speed: 8.4, heading: 245, distanceKm: 3.2, maxRangeKm: 16, currentRangeKm: 11.8, flightMode: 'auto' },
  { id: 'd2', name: 'Drone 2', code: 'DR-002', status: 'in-flight', batteryLevel: 92, currentMissionId: 'm2', latitude: LAT + 0.002, longitude: LNG + 0.004, altitude: 95, speed: 8.4, heading: 90, distanceKm: 1.9, flightMode: 'semi-auto' },
  { id: 'd3', name: 'Drone 3', code: 'DR-003', status: 'maintenance', batteryLevel: 45, latitude: LAT - 0.0035, longitude: LNG - 0.0035, altitude: 0, speed: 0, heading: 0, distanceKm: 1.6, flightMode: 'manual' },
  { id: 'd4', name: 'Drone 4', code: 'DR-004', status: 'available', batteryLevel: 88, latitude: LAT - 0.003, longitude: LNG + 0.004, altitude: 0, speed: 0, heading: 0, distanceKm: 0, flightMode: 'manual' },
];

export const createMockMissions = (): Mission[] => [
  { id: 'm1', name: 'Surveillance champ 1', droneId: 'd1', description: 'Ronde de surveillance de la parcelle : détection de stress hydrique et de zones endommagées.', durationMin: 172, status: 'in-progress' },
  { id: 'm2', name: 'Surveillance nord', droneId: 'd2', description: 'Contrôle périmétrique de la zone nord et relevé des clôtures.', durationMin: 92, status: 'in-progress' },
  { id: 'm3', name: 'Inspection drainage', description: 'Inspection visuelle des canaux de drainage après les dernières pluies.', durationMin: 48, status: 'planned' },
  { id: 'm4', name: 'Relevé topographique', description: 'Cartographie photogrammétrique de la parcelle sud.', durationMin: 35, status: 'planned' },
  { id: 'm5', name: 'Contrôle irrigation', description: "Vérification de l'uniformité de l'irrigation par imagerie.", durationMin: 25, status: 'planned' },
];

const at = (iso: string) => new Date(iso).toISOString();

export const createMockAlerts = (): Alert[] => [
  { id: 'a1', timestamp: at('2026-10-27T13:45:00'), droneId: 'd3', type: 'Température élevée', severity: 'high', status: 'new', details: 'La température batterie dépasse le seuil recommandé.' },
  { id: 'a2', timestamp: at('2026-10-27T12:32:00'), droneId: 'd3', type: 'Faible batterie', severity: 'medium', status: 'in-progress', details: 'Niveau de batterie sous 50 % pendant la mission.' },
  { id: 'a3', timestamp: at('2026-10-27T11:20:00'), droneId: 'd2', type: 'Perte de signal', severity: 'high', status: 'resolved', details: 'Liaison radio interrompue 12 secondes, rétablie.' },
  { id: 'a4', timestamp: at('2026-10-27T10:15:00'), droneId: 'd4', type: 'Maintenance moteur', severity: 'medium', status: 'resolved', details: 'Révision du moteur M3 effectuée.' },
  { id: 'a5', timestamp: at('2026-10-26T17:05:00'), droneId: 'd1', type: 'Vent fort', severity: 'low', status: 'new', details: 'Rafales supérieures à 30 km/h signalées sur Champ 1.' },
];

export const createMockFlights = (): FlightRecord[] => [
  { id: 'f1', date: at('2026-10-27T08:10:00'), droneId: 'd1', missionName: 'Champ 1', durationMin: 168, status: 'completed' },
  { id: 'f2', date: at('2026-10-26T14:30:00'), droneId: 'd2', missionName: 'Champ 2', durationMin: 92, status: 'completed' },
  { id: 'f3', date: at('2026-10-25T09:00:00'), droneId: 'd3', missionName: 'Surveillance Sud', durationMin: 112, status: 'completed' },
  { id: 'f4', date: at('2026-10-24T07:45:00'), droneId: 'd4', missionName: 'Champ 4', durationMin: 105, status: 'completed' },
  { id: 'f5', date: at('2026-10-23T15:20:00'), droneId: 'd1', missionName: 'Champ 3', durationMin: 22, status: 'aborted' },
];

export const createMockSchedule = (): ScheduledFlight[] => {
  const inHours = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
  const z = MOCK_ZONES;
  return [
    { id: 's1', droneId: 'd4', missionId: 'm4', departure: inHours(26), modePlan: { initial: 'manual', steps: [{ mode: 'semi-auto', afterMin: 5 }, { mode: 'auto', afterMin: 12 }] }, perimeters: [z[2].polygon], status: 'planned' },
    { id: 's2', droneId: 'd2', missionId: 'm5', departure: inHours(50), modePlan: { initial: 'semi-auto', steps: [{ mode: 'auto', afterMin: 3 }] }, perimeters: [z[1].polygon], status: 'planned' },
  ];
};
