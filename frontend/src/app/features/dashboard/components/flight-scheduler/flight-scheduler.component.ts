import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScheduledFlight, ScheduleStatus } from '../../../../core/models/models';
import { DetailService } from '../../../../core/services/detail.service';
import { DroneService } from '../../../../core/services/drone.service';
import { FlightService } from '../../../../core/services/flight.service';
import { UiService } from '../../../../core/services/ui.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { SCHEDULE_STATUS, describeModePlan, fmtDateTime } from '../../../../shared/utils/labels';
import { MissionService } from '../../../../core/services/mission.service';

@Component({
  selector: 'app-flight-scheduler',
  imports: [IconComponent, StatusBadgeComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel h-full">
      <div class="panel-title flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="flex size-6 items-center justify-center rounded-md border border-[#1E3A5F] bg-[#112240] text-[#38BDF8]"><app-icon name="schedule" [size]="13" /></span>
          <span class="text-[#F8FAFC] font-semibold">Programmation des vols</span>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="btn-ghost" (click)="ui.openScheduleForm()">+ Programmer</button>
          @if (!full()) { <a routerLink="/flight-planning" class="btn-pill">Voir tout</a> }
        </div>
      </div>
      <p class="mb-2 text-[10px] text-[#94A3B8]">Démo : les programmations sont exécutées par la simulation, aucun ordre n'est envoyé aux drones.</p>

      @if (full()) {
        <div class="mb-2.5">
          <select class="field w-full sm:!w-40" aria-label="Filtrer par statut" (change)="status.set($any($event.target).value)">
            <option value="">Tous les statuts</option>
            <option value="planned">Planifié</option>
            <option value="running">En vol</option>
            <option value="completed">Terminé</option>
            <option value="failed">Interrompu</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
      }

      <div class="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
        <table class="tbl">
          <thead><tr><th>Drone</th><th>Mission</th><th>Départ</th><th>Modes de vol</th><th>Périmètre</th><th>Statut</th><th><span class="sr-only">Actions</span></th></tr></thead>
          <tbody>
            @for (s of rows(); track s.id) {
              <tr>
                <td class="font-bold text-[#F8FAFC]">{{ drones.nameOf(s.droneId) }}</td>
                <td class="text-[#94A3B8] font-medium">{{ missionName(s) }}</td>
                <td class="text-[#94A3B8]">{{ fmt(s.departure) }}</td>
                <td class="text-[#94A3B8]">{{ describe(s.modePlan) }}</td>
                <td class="text-[#94A3B8]">{{ s.perimeters.length ? (s.perimeters.length + ' périmètre(s)') : '—' }}</td>
                <td><app-status-badge [tone]="st[s.status].tone">{{ st[s.status].label }}</app-status-badge></td>
                <td class="text-right">
                  <button type="button" class="icon-btn" aria-label="Détails" (click)="details.schedule(s)"><app-icon name="eye" [size]="13" /></button>
                  <button type="button" class="icon-btn hover:!text-[#F87171]" aria-label="Annuler" (click)="remove(s.id)"><app-icon name="trash" [size]="13" /></button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="py-4 text-center text-[#94A3B8]">Aucun vol programmé.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class FlightSchedulerComponent {
  private readonly flights = inject(FlightService);
  protected readonly drones = inject(DroneService);
  private readonly missions = inject(MissionService);
  protected readonly details = inject(DetailService);
  protected readonly ui = inject(UiService);

  readonly full = input(false);
  protected readonly status = signal<ScheduleStatus | ''>('');
  protected readonly st = SCHEDULE_STATUS;
  protected readonly fmt = fmtDateTime;
  protected readonly describe = describeModePlan;

  protected readonly rows = computed(() => {
    const st = this.status();
    const all = this.flights.schedule();
    const filtered = st ? all.filter((s: ScheduledFlight) => s.status === st) : all;
    return this.full() ? filtered : filtered.slice(0, 5);
  });

  protected missionName(s: ScheduledFlight): string {
    return this.missions.byId(s.missionId)?.name ?? 'Mission inconnue';
  }

  protected remove(id: string): void {
    this.ui.askConfirm({
      message: 'Annuler ce vol programmé ?',
      confirmLabel: 'Annuler le vol',
      onConfirm: () => this.flights.cancel(id),
    });
  }
}
