import { Injectable, signal } from '@angular/core';
import {
  Alert, AlertSeverity, AlertStatus, Drone, DroneInput, DroneStatus,
  FlightMode, FlightRecord, Mission, MissionInput, MissionStatus,
  OpResult, ScheduledFlight, SurveillanceZone
} from '../models/models';

export interface LaravelDashboardResponse {
  user?: any;
  drones?: any[];
  selected_drone?: any;
  latest_telemetry?: any;
  current_mission?: any;
  primary_camera?: any;
  capteurs_values?: Record<string, any>;
  kpi?: any;
  missions?: any[];
  alertes?: any[];
  incidents?: any[];
  detections?: any[];
  active_detection?: any;
  zones?: any[];
  sons?: any[];
  inspections?: any[];
  historiques?: any[];
}

@Injectable({ providedIn: 'root' })
export class BackendService {
  /** Base URL for API requests: defaults to relative, falls back to port 8000 if running on dev port */
  readonly baseUrl: string = this.detectBaseUrl();
  readonly isConnected = signal<boolean>(false);
  readonly lastSync = signal<Date | null>(null);
  readonly lastError = signal<string | null>(null);

  private detectBaseUrl(): string {
    if (typeof window !== 'undefined') {
      const port = window.location.port;
      if (port === '4200' || port === '3000') {
        return 'http://127.0.0.1:8000';
      }
    }
    return '';
  }

  private extractErrorMessage(data: any, fallback: string): string {
    if (data?.errors && typeof data.errors === 'object') {
      const messages = Object.values(data.errors).flat();
      if (messages.length > 0) return messages.join(' ');
    }
    return data?.message || data?.error || fallback;
  }

  // ==========================================
  // DASHBOARD GLOBAL
  // ==========================================

  async fetchDashboard(): Promise<LaravelDashboardResponse | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/dashboard`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data: LaravelDashboardResponse = await res.json();
      this.isConnected.set(true);
      this.lastSync.set(new Date());
      this.lastError.set(null);
      return data;
    } catch (err: any) {
      this.isConnected.set(false);
      this.lastError.set(err.message);
      return null;
    }
  }

  // ==========================================
  // DRONES (CRUD 100% MySQL)
  // ==========================================

  async getDrones(): Promise<Drone[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/drones`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const raw = await res.json();
      this.isConnected.set(true);
      return this.mapDrones(Array.isArray(raw) ? raw : []);
    } catch (err: any) {
      this.lastError.set(err.message);
      return [];
    }
  }

  async createDrone(input: DroneInput): Promise<OpResult> {
    try {
      const payload: Record<string, any> = {
        nom: input.name,
        statut: input.status === 'in-flight' ? 'en_vol' : (input.status === 'maintenance' ? 'en_maintenance' : (input.status === 'offline' ? 'hors_ligne' : 'disponible')),
        niveau_batterie: Number(input.batteryLevel),
      };
      if (input.code) {
        payload['code_drone'] = input.code;
      }

      const res = await fetch(`${this.baseUrl}/api/drones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = this.extractErrorMessage(data, `Erreur ${res.status} lors de l'enregistrement du drone.`);
        return { ok: false, error: errorMsg };
      }

      return { ok: true, data: data.drone };
    } catch (err: any) {
      return { ok: false, error: `Impossible de contacter le serveur : ${err.message}` };
    }
  }

  async updateDrone(id: string, input: Partial<DroneInput>): Promise<OpResult> {
    try {
      const payload: Record<string, any> = {};
      if (input.name !== undefined) payload['nom'] = input.name;
      if (input.code !== undefined) payload['code_drone'] = input.code;
      if (input.batteryLevel !== undefined) payload['niveau_batterie'] = Number(input.batteryLevel);
      if (input.status !== undefined) {
        payload['statut'] = input.status === 'in-flight' ? 'en_vol' : (input.status === 'maintenance' ? 'en_maintenance' : (input.status === 'offline' ? 'hors_ligne' : 'disponible'));
      }

      const res = await fetch(`${this.baseUrl}/api/drones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = this.extractErrorMessage(data, `Erreur ${res.status} lors de la modification du drone.`);
        return { ok: false, error: errorMsg };
      }

      return { ok: true, data: data.drone };
    } catch (err: any) {
      return { ok: false, error: `Impossible de contacter le serveur : ${err.message}` };
    }
  }

  async setDroneSpeed(id: string, speed: number): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/drones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ vitesse_actuelle: Number(speed.toFixed(1)) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: this.extractErrorMessage(data, `Erreur ${res.status}`) };
      return { ok: true, data: data.drone };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  /** Synchronisation périodique de la télémétrie du drone en vol avec MySQL */
  async syncTelemetry(id: string, telemetry: {
    speed?: number;
    altitude?: number;
    latitude?: number;
    longitude?: number;
    batteryLevel?: number;
  }): Promise<void> {
    try {
      const payload: Record<string, any> = {};
      if (telemetry.speed !== undefined) payload['vitesse_actuelle'] = Number(telemetry.speed.toFixed(1));
      if (telemetry.altitude !== undefined) payload['altitude_actuelle'] = Number(telemetry.altitude.toFixed(1));
      if (telemetry.latitude !== undefined) payload['latitude_actuelle'] = Number(telemetry.latitude.toFixed(6));
      if (telemetry.longitude !== undefined) payload['longitude_actuelle'] = Number(telemetry.longitude.toFixed(6));
      if (telemetry.batteryLevel !== undefined) payload['niveau_batterie'] = Number(telemetry.batteryLevel.toFixed(1));

      await fetch(`${this.baseUrl}/api/drones/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Synchronisation en arrière-plan sans blocage UI
    }
  }

  /** Synchronisation de la dernière valeur d'un capteur avec MySQL */
  async syncCapteurValue(capteurId: number | string, valeur: number): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/capteurs/${capteurId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ derniere_valeur: Number(valeur.toFixed(2)) }),
      });
    } catch {
      // Synchronisation en arrière-plan
    }
  }

  async deleteDrone(id: string): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/drones/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = this.extractErrorMessage(data, `Erreur ${res.status} lors de la suppression du drone.`);
        return { ok: false, error: errorMsg };
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: `Impossible de contacter le serveur : ${err.message}` };
    }
  }

  // ==========================================
  // MISSIONS (CRUD 100% MySQL)
  // ==========================================

  async getMissions(): Promise<Mission[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/missions`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const raw = await res.json();
      return this.mapMissions(Array.isArray(raw) ? raw : []);
    } catch (err: any) {
      this.lastError.set(err.message);
      return [];
    }
  }

  async createMission(input: MissionInput): Promise<OpResult> {
    try {
      const payload: Record<string, any> = {
        nom: input.name,
        description: input.description,
        statut: 'planifiee',
        type_mission: 'surveillance',
        durationMin: Number(input.durationMin) || 60,
      };
      if (input.droneId) payload['drone_id'] = Number(input.droneId);

      const res = await fetch(`${this.baseUrl}/api/missions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return { ok: false, error: this.extractErrorMessage(data, `Erreur ${res.status} lors de la création de la mission.`) };
      }

      return { ok: true, data: data.mission };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  async updateMission(id: string, input: Partial<MissionInput> & { status?: MissionStatus }): Promise<OpResult> {
    try {
      const payload: Record<string, any> = {};
      if (input.name !== undefined) payload['nom'] = input.name;
      if (input.description !== undefined) payload['description'] = input.description;
      if (input.droneId !== undefined) {
        payload['drone_id'] = input.droneId ? Number(input.droneId) : null;
      }
      if (input.durationMin !== undefined) {
        payload['durationMin'] = Number(input.durationMin) || 60;
      }
      if (input.status !== undefined) {
        const reverseStatus: Record<MissionStatus, string> = {
          'planned': 'planifiee',
          'in-progress': 'en_cours',
          'completed': 'terminee',
          'cancelled': 'annulee',
        };
        payload['statut'] = reverseStatus[input.status] || input.status;
      }

      const res = await fetch(`${this.baseUrl}/api/missions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: this.extractErrorMessage(data, `Erreur ${res.status}`) };
      return { ok: true, data: data.mission };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  async deleteMission(id: string): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/missions/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: this.extractErrorMessage(data, `Erreur ${res.status}`) };
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  // ==========================================
  // ALERTES / INCIDENTS (100% MySQL)
  // ==========================================

  async getAlerts(): Promise<Alert[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/incidents`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      return this.mapAlerts(Array.isArray(raw) ? raw : []);
    } catch {
      return [];
    }
  }

  async deleteAlert(id: string): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/incidents/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      return { ok: res.ok };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  async resolveAlert(id: string): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ statut: 'resolu' }),
      });
      return { ok: res.ok };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  // ==========================================
  // PLANIFICATIONS DE VOL (100% MySQL)
  // ==========================================

  async getFlights(): Promise<FlightRecord[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/planifications-vol`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      return (Array.isArray(raw) ? raw : []).map((f: any) => ({
        id: String(f.id),
        date: f.date_heure_depart_prevue || f.created_at || new Date().toISOString(),
        droneId: String(f.drone_id || '1'),
        missionName: f.mission?.nom || 'Vol planifié',
        durationMin: 60,
        status: f.statut === 'termine' ? 'completed' : (f.statut === 'annule' ? 'aborted' : 'completed'),
      }));
    } catch {
      return [];
    }
  }

  async getSchedule(): Promise<ScheduledFlight[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/planifications-vol`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      return (Array.isArray(raw) ? raw : []).map((f: any) => ({
        id: String(f.id),
        droneId: String(f.drone_id || ''),
        missionId: String(f.mission_id || ''),
        departure: f.date_heure_depart_prevue || f.created_at || new Date().toISOString(),
        modePlan: { initial: 'auto' as const, steps: [] },
        perimeters: [],
        status: f.statut === 'en_cours' ? 'running' as const : (f.statut === 'termine' ? 'completed' as const : (f.statut === 'annule' ? 'cancelled' as const : 'planned' as const)),
      }));
    } catch {
      return [];
    }
  }

  async createFlight(input: any): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/planifications-vol`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { ok: false, error: this.extractErrorMessage(data, `Erreur ${res.status}`) };
      return { ok: true, data };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  async deleteFlight(id: string): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/planifications-vol/${id}`, {
        method: 'DELETE',
        headers: { 'Accept': 'application/json' },
      });
      return { ok: res.ok };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  // ==========================================
  // ZONES STATIQUES (100% MySQL)
  // ==========================================

  async getZones(): Promise<SurveillanceZone[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/zones-statiques`, {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      return this.mapZones(Array.isArray(raw) ? raw : []);
    } catch {
      return [];
    }
  }

  // ==========================================
  // COMMANDES OPÉRATIONNELLES DRONES
  // ==========================================

  async takeOff(droneId: string): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/drones/${droneId}/demarrer-vol`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, error: data.error || data.message };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  async land(droneId: string): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/drones/${droneId}/atterrir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, error: data.error || data.message };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  async connectStation(droneId: string): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/drones/${droneId}/connecter-station`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, error: data.error || data.message };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }

  // ==========================================
  // MAPPERS
  // ==========================================

  mapDrones(backendDrones: any[]): Drone[] {
    const statusMap: Record<string, DroneStatus> = {
      'en_vol': 'in-flight',
      'en_mission': 'in-flight',
      'disponible': 'available',
      'en_charge': 'available',
      'en_maintenance': 'maintenance',
      'maintenance': 'maintenance',
      'hors_ligne': 'offline',
    };

    return backendDrones.map((d, index) => {
      const lat = parseFloat(d.latitude_actuelle) || (5.3321 + (index * 0.002));
      const lng = parseFloat(d.longitude_actuelle) || (-4.0217 + (index * 0.003));
      const alt = parseFloat(d.altitude_actuelle) || 0;
      const spd = parseFloat(d.vitesse_actuelle) || 0;
      const batt = Math.round(parseFloat(d.niveau_batterie) || 0);

      const status = statusMap[d.statut] || (alt > 0 ? 'in-flight' : 'available');
      const activeMission = d.missions?.[0];

      return {
        id: String(d.id),
        name: d.nom,
        code: d.code_drone,
        status,
        batteryLevel: batt,
        currentMissionId: activeMission ? String(activeMission.id) : undefined,
        latitude: lat,
        longitude: lng,
        altitude: alt,
        speed: spd,
        heading: 45,
        distanceKm: parseFloat(d.distance_parcourue_km) || 0,
        maxRangeKm: parseFloat(d.portee_max_km) || 16,
        currentRangeKm: Math.round(((parseFloat(d.portee_max_km) || 16) * (batt / 100)) * 10) / 10,
        flightMode: (status === 'in-flight' ? 'auto' : 'manual') as FlightMode,
      };
    });
  }

  mapMissions(backendMissions: any[]): Mission[] {
    const statusMap: Record<string, MissionStatus> = {
      'en_cours': 'in-progress',
      'planifiee': 'planned',
      'terminee': 'completed',
      'annulee': 'cancelled',
      'suspendue': 'cancelled',
    };

    return backendMissions.map((m) => {
      const assignedDrone = m.drones?.[0];
      let durationMin = m.duree_estimee_minutes || 60;
      if (m.date_debut_prevue && m.date_fin_prevue) {
        const diffMs = new Date(m.date_fin_prevue).getTime() - new Date(m.date_debut_prevue).getTime();
        const diffMins = Math.round(diffMs / 60000);
        if (diffMins > 0) durationMin = diffMins;
      }
      return {
        id: String(m.id),
        name: m.nom,
        description: m.description || '',
        durationMin,
        status: statusMap[m.statut] || 'planned',
        droneId: assignedDrone ? String(assignedDrone.id) : undefined,
      };
    });
  }

  mapAlerts(backendAlerts: any[]): Alert[] {
    const sevMap: Record<string, AlertSeverity> = {
      'critique': 'high',
      'haute': 'high',
      'moyenne': 'medium',
      'faible': 'low',
    };
    const statMap: Record<string, AlertStatus> = {
      'signale': 'new',
      'en_cours': 'in-progress',
      'resolu': 'resolved',
      'clos': 'resolved',
    };

    return backendAlerts.map((a) => ({
      id: String(a.id),
      timestamp: a.date_incident || a.created_at || new Date().toISOString(),
      droneId: String(a.drone_id || '1'),
      type: a.type_incident || 'Alerte DISDP',
      severity: sevMap[a.gravite] || 'medium',
      status: statMap[a.statut] || 'new',
      details: a.titre ? `${a.titre} - ${a.description || ''}` : (a.description || ''),
    }));
  }

  mapZones(backendZones: any[]): SurveillanceZone[] {
    return backendZones.map((z, idx) => {
      let polygon: [number, number][] = [];
      const rawGps = z.limites_gps;
      let coordsObj = rawGps;
      if (typeof rawGps === 'string') {
        try { coordsObj = JSON.parse(rawGps); } catch {}
      }

      if (coordsObj && typeof coordsObj === 'object') {
        if (Array.isArray(coordsObj.coordinates) && Array.isArray(coordsObj.coordinates[0])) {
          polygon = coordsObj.coordinates[0].map((pt: any) => [Number(pt[1]), Number(pt[0])] as [number, number]);
        } else if (Array.isArray(coordsObj)) {
          polygon = coordsObj;
        }
      }

      if (!polygon.length) {
        const lat = parseFloat(z.latitude_centre) || 5.3551;
        const lng = parseFloat(z.longitude_centre) || -3.8942;
        const offset = 0.0025 * (idx + 1);
        polygon = [
          [lat + offset, lng - offset],
          [lat + offset, lng + offset],
          [lat - offset, lng + offset],
          [lat - offset, lng - offset],
        ];
      }
      return {
        id: String(z.id),
        name: z.nom_zone || z.nom,
        color: idx % 2 === 0 ? '#20d6a0' : '#1687ff',
        polygon,
      };
    });
  }
}

