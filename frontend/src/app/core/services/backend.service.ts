import { Injectable, signal } from '@angular/core';
import { Alert, AlertSeverity, AlertStatus, Drone, DroneInput, DroneStatus, FlightMode, Mission, MissionInput, MissionStatus, OpResult, SurveillanceZone } from '../models/models';

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

  private detectBaseUrl(): string {
    if (typeof window !== 'undefined') {
      const port = window.location.port;
      // If running on Angular dev server port (4200 or 3000) without proxy, direct to Laravel
      if (port === '4200') {
        return 'http://127.0.0.1:8000';
      }
    }
    return '';
  }

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
      return data;
    } catch (err) {
      console.warn('[BackendService] Erreur lors du chargement de /api/dashboard:', err);
      this.isConnected.set(false);
      return null;
    }
  }

  mapDrones(backendDrones: any[]): Drone[] {
    const statusMap: Record<string, DroneStatus> = {
      'en_vol': 'in-flight',
      'disponible': 'available',
      'maintenance': 'maintenance',
      'hors_ligne': 'offline',
    };

    return backendDrones.map((d, index) => {
      const lat = parseFloat(d.latitude_actuelle) || (5.3321 + (index * 0.002));
      const lng = parseFloat(d.longitude_actuelle) || (-4.0217 + (index * 0.003));
      const alt = parseFloat(d.altitude_actuelle) || 0;
      const spd = parseFloat(d.vitesse_actuelle) || 0;
      const batt = Math.round(parseFloat(d.niveau_batterie) || 100);

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
        distanceKm: parseFloat(d.distance_parcourue_km) || (status === 'in-flight' ? 3.4 : 0),
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
    };

    return backendMissions.map((m) => {
      const assignedDrone = m.drones?.[0];
      return {
        id: String(m.id),
        name: m.nom,
        description: m.description || 'Mission de surveillance et détection de pannes agricoles.',
        durationMin: m.duree_estimee_minutes || 60,
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
      'ouvert': 'new',
      'signale': 'new',
      'en_analyse': 'in-progress',
      'en_cours': 'in-progress',
      'resolu': 'resolved',
      'clos': 'resolved',
    };

    return backendAlerts.map((a) => ({
      id: String(a.id),
      timestamp: a.date_incident || a.created_at || new Date().toISOString(),
      droneId: String(a.drone_id || '1'),
      type: a.type_incident || a.type_alerte || 'Alerte DISDP',
      severity: sevMap[a.gravite] || 'medium',
      status: statMap[a.statut] || 'new',
      details: a.titre ? `${a.titre} - ${a.description || ''}` : (a.description || a.message || ''),
    }));
  }

  mapZones(backendZones: any[]): SurveillanceZone[] {
    return backendZones.map((z, idx) => {
      let polygon: [number, number][] = [];
      if (Array.isArray(z.coordonnees_geometrie)) {
        polygon = z.coordonnees_geometrie;
      } else if (typeof z.coordonnees_geometrie === 'string') {
        try {
          polygon = JSON.parse(z.coordonnees_geometrie);
        } catch {}
      }
      if (!polygon.length) {
        const lat = parseFloat(z.latitude_centre) || 5.3321;
        const lng = parseFloat(z.longitude_centre) || -4.0217;
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
        name: z.nom,
        color: z.couleur_affichage || (idx % 2 === 0 ? '#20d6a0' : '#1687ff'),
        polygon,
      };
    });
  }

  // --- Actions opérationnelles vers Laravel ---

  async takeOff(droneId: string): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/drones/${droneId}/demarrer-vol`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      const data = await res.json();
      return { ok: res.ok, error: data.error || data.message };
    } catch (err: any) {
      console.warn('[BackendService] takeOff error:', err);
      return { ok: false, error: err.message };
    }
  }

  async land(droneId: string): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/drones/${droneId}/atterrir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      const data = await res.json();
      return { ok: res.ok, error: data.error || data.message };
    } catch (err: any) {
      console.warn('[BackendService] land error:', err);
      return { ok: false, error: err.message };
    }
  }

  async connectStation(droneId: string): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/drones/${droneId}/connecter-station`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      const data = await res.json();
      return { ok: res.ok, error: data.error || data.message };
    } catch (err: any) {
      console.warn('[BackendService] connectStation error:', err);
      return { ok: false, error: err.message };
    }
  }

  async createDrone(input: DroneInput): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/drones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          nom: input.name,
          code_drone: input.code,
          modele: 'Hexacopter DISDP V3',
          numero_serie: `SN-${input.code}-${Date.now().toString().slice(-4)}`,
          statut: input.status === 'in-flight' ? 'en_vol' : 'disponible',
          niveau_batterie: input.batteryLevel,
          portee_max_km: 16.0,
        }),
      });
      const data = await res.json();
      return { ok: res.ok, error: data.error || data.message };
    } catch (err: any) {
      console.warn('[BackendService] createDrone error:', err);
      return { ok: false, error: err.message };
    }
  }

  async createMission(input: MissionInput): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/missions/creer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          nom: input.name,
          description: input.description,
          type_mission: 'surveillance',
          duree_estimee_minutes: input.durationMin,
        }),
      });
      const data = await res.json();
      return { ok: res.ok, error: data.error || data.message };
    } catch (err: any) {
      console.warn('[BackendService] createMission error:', err);
      return { ok: false, error: err.message };
    }
  }

  async resolveAlert(alertId: string): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/alertes/${alertId}/resoudre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      const data = await res.json();
      return { ok: res.ok, error: data.error || data.message };
    } catch (err: any) {
      console.warn('[BackendService] resolveAlert error:', err);
      return { ok: false, error: err.message };
    }
  }

  async triggerSound(droneId?: string, sonId: number = 1): Promise<OpResult> {
    try {
      const res = await fetch(`${this.baseUrl}/emissions-sonores/declencher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          drone_id: droneId ? parseInt(droneId, 10) : null,
          son_id: sonId,
          volume_pct: 85,
        }),
      });
      const data = await res.json();
      return { ok: res.ok, error: data.error || data.message };
    } catch (err: any) {
      console.warn('[BackendService] triggerSound error:', err);
      return { ok: false, error: err.message };
    }
  }
}

