import {
  Alert, Drone, FlightRecord, Mission, ScheduledFlight, SurveillanceZone,
} from '../models/models';

/** Zéro données fictives : initialisation vide pour conformité 100% BDD MySQL */
export const MOCK_PREVIOUS_DAY = { battery: 0, distanceKm: 0, speed: 0 };

export const MOCK_ZONES: SurveillanceZone[] = [];

export const createMockDrones = (): Drone[] => [];

export const createMockMissions = (): Mission[] => [];

export const createMockAlerts = (): Alert[] => [];

export const createMockFlights = (): FlightRecord[] => [];

export const createMockSchedule = (): ScheduledFlight[] => [];
