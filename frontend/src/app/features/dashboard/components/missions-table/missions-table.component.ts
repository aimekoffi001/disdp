import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Mission, MissionStatus } from '../../../../core/models/models';
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
          <span class="text-[#F8FAFC] font-semibold">{{ full() ? 'Missions' : 'Missions actives & récentes' }}</span>
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

      @if (missions.loading()) {
        <div class="py-8 text-center text-sm text-[#38BDF8] flex items-center justify-center gap-2">
          <span class="inline-block size-4 animate-spin rounded-full border-2 border-[#38BDF8] border-t-transparent"></span>
          <span>Chargement...</span>
        </div>
      } @else {
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
                    <button type="button" class="icon-btn hover:!text-[#F87171]" aria-label="Supprimer" (click)="remove(m)"><app-icon name="trash" [size]="13" /></button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="py-8 text-center text-[#94A3B8]">
                    Aucune mission. Ajoutez votre première mission.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
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
    const list = this.missions.missions();
    const st = this.status();
    const filtered = st ? list.filter((m) => m.status === st) : list;
    return this.full() ? filtered : filtered.filter((m) => m.status === 'in-progress' || m.status === 'planned');
  });

  protected remove(m: Mission): void {
    this.ui.askConfirm({
      message: `Voulez-vous vraiment supprimer la mission « ${m.name} » ?`,
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        await this.missions.remove(m.id);
      },
    });
  }
}
