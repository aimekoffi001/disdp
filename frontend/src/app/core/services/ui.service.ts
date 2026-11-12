import { Injectable, computed, inject, signal } from '@angular/core';
import { Drone, Mission, ScheduledFlight } from '../models/models';
import { DroneService } from './drone.service';
import { MissionService } from './mission.service';
import { Tone } from '../../shared/utils/labels';

export interface DetailRow { label: string; value: string; tone?: Tone }
export interface DetailView { title: string; rows: DetailRow[]; actions?: { label: string; run: () => void }[] }
export interface ConfirmRequest { message: string; confirmLabel: string; onConfirm: () => void }
export interface SearchHit { kind: 'drone' | 'mission'; id: string; label: string; sub: string }

/** État d'interface partagé : modales, recherche, menu mobile. */
@Injectable({ providedIn: 'root' })
export class UiService {
  private readonly drones = inject(DroneService);
  private readonly missions = inject(MissionService);

  readonly menuOpen = signal(false);
  readonly dashboardTab = signal<'live' | 'pilotage' | 'telemetry' | 'map' | 'activity'>('live');
  readonly detail = signal<DetailView | null>(null);
  readonly confirmRequest = signal<ConfirmRequest | null>(null);
  readonly droneForm = signal<{ drone?: Drone } | null>(null);
  readonly missionForm = signal<{ mission?: Mission } | null>(null);
  readonly scheduleForm = signal<{ flight?: ScheduledFlight } | null>(null);
  readonly floatingCameraOpen = signal<boolean>(true);

  readonly searchTerm = signal('');
  readonly searchResults = computed<SearchHit[]>(() => {
    const q = this.searchTerm().trim().toLowerCase();
    if (q.length < 1) return [];
    const d: SearchHit[] = this.drones.drones()
      .filter((x) => `${x.name} ${x.code}`.toLowerCase().includes(q))
      .map((x) => ({ kind: 'drone' as const, id: x.id, label: x.name, sub: x.code }));
    const m: SearchHit[] = this.missions.missions()
      .filter((x) => `${x.name} ${x.description}`.toLowerCase().includes(q))
      .map((x) => ({ kind: 'mission' as const, id: x.id, label: x.name, sub: `${x.durationMin} min` }));
    return [...d, ...m].slice(0, 8);
  });

  openDroneForm(drone?: Drone) { this.droneForm.set({ drone }); }
  openMissionForm(mission?: Mission) { this.missionForm.set({ mission }); }
  openScheduleForm(flight?: ScheduledFlight) { this.scheduleForm.set({ flight }); }
  toggleFloatingCamera() { this.floatingCameraOpen.update((v) => !v); }
  openFloatingCamera() { this.floatingCameraOpen.set(true); }
  closeFloatingCamera() { this.floatingCameraOpen.set(false); }
  askConfirm(req: ConfirmRequest) { this.confirmRequest.set(req); }
  showDetail(view: DetailView) { this.detail.set(view); }
}
