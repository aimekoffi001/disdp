import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MissionStatus } from '../../../../core/models/models';
import { DetailService } from '../../../../core/services/detail.service';
import { DroneService } from '../../../../core/services/drone.service';
import { MissionService } from '../../../../core/services/mission.service';
import { UiService } from '../../../../core/services/ui.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { MISSION_STATUS, fmtDuration } from '../../../../shared/utils/labels';

@Component({
  selector: 'app-missions-table',
  imports: [IconComponent, StatusBadgeComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel h-full">
      <div class="panel-title flex items-center justify-between">
        <div class="flex items-center gap-2">
          <app-icon name="missions" [size]="15" class="text-[#38BDF8]" />
          <span class="text-[#F8FAFC] font-semibold">{{ full() ? 'Missions' : 'Missions en cours' }}</span>
        </div>
        <div class="flex items-center gap-2">
          @if (full()) { <button type="button" class="btn-pill" (click)="ui.openMissionForm()">+ Créer une mission</button> }
          @else {
            <button type="button" class="btn-ghost hidden sm:inline-flex" (click)="ui.openMissionForm()">+ Mission</button>
            <a routerLink="/missions" class="btn-pill">Voir toutes</a>
          }
        </div>
      </div>

      @if (full()) {
        <div class="mb-2.5">
          <select class="field w-full sm:!w-44" aria-label="Filtrer par statut" (change)="status.set($any($event.target).value)">
            <option value="">Tous les statuts</option>
            @for (s of statuses; track s.value) { <option [value]="s.value">{{ s.label }}</option> }
          </select>
        </div>
      }

      <div class="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
        <table class="tbl">
          <thead><tr><th>Mission</th><th>Drone</th><th>Durée</th><th>Statut</th><th><span class="sr-only">Actions</span></th></tr></thead>
          <tbody>
            @for (m of rows(); track m.id) {
              <tr>
                <td class="font-bold text-[#F8FAFC]" [attr.title]="m.description">{{ m.name }}</td>
                <td class="text-[#94A3B8] font-medium">{{ drones.nameOf(m.droneId) }}</td>
                <td class="text-[#94A3B8] tabular-nums">{{ fmt(m.durationMin) }}</td>
                <td><app-status-badge [tone]="meta[m.status].tone">{{ meta[m.status].label }}</app-status-badge></td>
                <td class="text-right">
                  <button type="button" class="icon-btn" aria-label="Voir la fiche" (click)="details.mission(m)"><app-icon name="eye" [size]="13" /></button>
                  <button type="button" class="icon-btn" aria-label="Modifier" (click)="ui.openMissionForm(m)"><app-icon name="pencil" [size]="13" /></button>
                  <button type="button" class="icon-btn hover:!text-[#F87171]" aria-label="Supprimer" (click)="remove(m.id)"><app-icon name="trash" [size]="13" /></button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="py-4 text-center text-[#94A3B8]">Aucune mission.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class MissionsTableComponent {
  protected readonly missions = inject(MissionService);
  protected readonly drones = inject(DroneService);
  protected readonly details = inject(DetailService);
  protected readonly ui = inject(UiService);

  readonly full = input(false);
  protected readonly status = signal<MissionStatus | ''>('');
  protected readonly meta = MISSION_STATUS;
  protected readonly fmt = fmtDuration;

  protected readonly statuses = (Object.keys(MISSION_STATUS) as MissionStatus[]).map((value) => ({
    value,
    label: MISSION_STATUS[value].label,
  }));

  protected readonly rows = computed(() => {
    const st = this.status();
    const all = this.missions.missions();
    const filtered = st ? all.filter((m) => m.status === st) : all;
    return this.full() ? filtered : filtered.slice(0, 5);
  });

  protected remove(id: string): void {
    this.ui.askConfirm({
      message: 'Annuler cette mission ? Les programmations associées seront annulées.',
      confirmLabel: 'Annuler la mission',
      onConfirm: () => this.missions.cancel(id),
    });
  }
}
