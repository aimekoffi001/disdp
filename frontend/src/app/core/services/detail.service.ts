import { Injectable, inject } from '@angular/core';
import { Alert, Drone, FlightRecord, Mission, ScheduledFlight } from '../models/models';
import {
  ALERT_SEVERITY, ALERT_STATUS, DRONE_STATUS, MISSION_STATUS, SCHEDULE_STATUS, describeModePlan,
  batteryTone, fmtDateTime, fmtDuration,
} from '../../shared/utils/labels';
import { AlertService } from './alert.service';
import { DroneService } from './drone.service';
import { FlightService } from './flight.service';
import { MissionService } from './mission.service';
import { UiService } from './ui.service';

/** Construit les fiches de consultation (modale de détail). */
@Injectable({ providedIn: 'root' })
export class DetailService {
  private readonly ui = inject(UiService);
  private readonly drones = inject(DroneService);
  private readonly missions = inject(MissionService);
  private readonly alerts = inject(AlertService);
  private readonly flights = inject(FlightService);

  drone(d: Drone): void {
    const mission = this.missions.byId(d.currentMissionId);
    this.ui.showDetail({
      title: `${d.name} — fiche drone`,
      rows: [
        { label: 'Code', value: d.code },
        { label: 'Statut', value: DRONE_STATUS[d.status].label, tone: DRONE_STATUS[d.status].tone },
        { label: 'Batterie', value: `${Math.round(d.batteryLevel)} %`, tone: batteryTone(d.batteryLevel) },
        { label: 'Mission', value: mission?.name ?? '—' },
        { label: 'Position', value: `${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}` },
        { label: 'Altitude', value: `${Math.round(d.altitude)} m` },
        { label: 'Vitesse', value: `${d.speed.toFixed(1)} m/s` },
        { label: 'Distance (jour)', value: `${d.distanceKm.toFixed(1)} km` },
      ],
      actions: [
        { label: 'Modifier', run: () => { this.ui.detail.set(null); this.ui.openDroneForm(d); } },
        { label: 'Afficher en direct', run: () => { this.drones.select(d.id); this.ui.detail.set(null); } },
      ],
    });
  }

  mission(m: Mission): void {
    this.ui.showDetail({
      title: m.name,
      rows: [
        { label: 'Durée', value: fmtDuration(m.durationMin) },
        { label: 'Statut', value: MISSION_STATUS[m.status].label, tone: MISSION_STATUS[m.status].tone },
        { label: 'Drone affecté', value: m.droneId ? this.drones.nameOf(m.droneId) : 'Défini à la planification' },
        { label: 'Description', value: m.description || '—' },
      ],
      actions: [{ label: 'Modifier', run: () => { this.ui.detail.set(null); this.ui.openMissionForm(m); } }],
    });
  }

  alert(a: Alert): void {
    const actions = a.status === 'resolved' ? [] : [{
      label: 'Marquer comme traitée',
      run: () => { this.alerts.setStatus(a.id, 'resolved'); this.ui.detail.set(null); },
    }];
    this.ui.showDetail({
      title: a.type,
      rows: [
        { label: 'Date', value: fmtDateTime(a.timestamp) },
        { label: 'Drone', value: this.drones.nameOf(a.droneId) },
        { label: 'Gravité', value: ALERT_SEVERITY[a.severity].label, tone: ALERT_SEVERITY[a.severity].tone },
        { label: 'Statut', value: ALERT_STATUS[a.status].label, tone: ALERT_STATUS[a.status].tone },
        { label: 'Détails', value: a.details },
      ],
      actions,
    });
  }

  flight(f: FlightRecord): void {
    this.ui.showDetail({
      title: `Vol du ${fmtDateTime(f.date)}`,
      rows: [
        { label: 'Drone', value: this.drones.nameOf(f.droneId) },
        { label: 'Mission', value: f.missionName },
        { label: 'Durée', value: fmtDuration(f.durationMin) },
        { label: 'Statut', value: f.status === 'completed' ? 'Terminée' : 'Interrompue', tone: f.status === 'completed' ? 'green' : 'amber' },
      ],
    });
  }

  schedule(s: ScheduledFlight): void {
    this.ui.showDetail({
      title: 'Vol programmé',
      rows: [
        { label: 'Drone', value: this.drones.nameOf(s.droneId) },
        { label: 'Mission', value: this.missions.byId(s.missionId)?.name ?? '—' },
        { label: 'Départ', value: fmtDateTime(s.departure) },
        { label: 'Modes de vol', value: describeModePlan(s.modePlan) },
        { label: 'Périmètres', value: s.perimeters.length ? `${s.perimeters.length} zone(s) tracée(s)` : 'Aucun' },
        { label: 'Statut', value: SCHEDULE_STATUS[s.status].label, tone: SCHEDULE_STATUS[s.status].tone },
      ],
    });
  }
}
