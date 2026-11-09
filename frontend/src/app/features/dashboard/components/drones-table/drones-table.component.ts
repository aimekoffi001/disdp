import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Drone, DroneStatus } from '../../../../core/models/models';
import { DetailService } from '../../../../core/services/detail.service';
import { DroneService } from '../../../../core/services/drone.service';
import { MissionService } from '../../../../core/services/mission.service';
import { UiService } from '../../../../core/services/ui.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { DRONE_STATUS, fmtDistance } from '../../../../shared/utils/labels';

@Component({
  selector: 'app-drones-table',
  imports: [IconComponent, StatusBadgeComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel h-full">
      <div class="panel-title flex items-center justify-between">
        <div class="flex items-center gap-2">
          <app-icon name="drone" [size]="15" class="text-[#38BDF8]" />
          <span class="text-[#F8FAFC] font-semibold">Drones</span>
        </div>
        <div>
          @if (full()) {
            <button type="button" class="btn-pill" (click)="ui.openDroneForm()">+ Drone</button>
          } @else {
            <a routerLink="/drones" class="btn-pill">Voir tout</a>
          }
        </div>
      </div>

      @if (full()) {
        <div class="mb-2.5 flex flex-col sm:flex-row flex-wrap gap-2">
          <input type="search" class="field w-full sm:!w-48" placeholder="Filtrer par nom ou code" aria-label="Filtrer les drones" (input)="term.set($any($event.target).value)" />
          <select class="field w-full sm:!w-40" aria-label="Filtrer par statut" (change)="status.set($any($event.target).value)">
            <option value="">Tous les statuts</option>
            @for (s of statuses; track s.value) { <option [value]="s.value">{{ s.label }}</option> }
          </select>
        </div>
      }

      @if (drones.loading()) {
        <div class="py-8 text-center text-sm text-[#38BDF8] flex items-center justify-center gap-2">
          <span class="inline-block size-4 animate-spin rounded-full border-2 border-[#38BDF8] border-t-transparent"></span>
          <span>Chargement...</span>
        </div>
      } @else if (drones.error()) {
        <div class="my-3 rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/15 p-3 text-xs text-[#F87171] text-center">
          Erreur de connexion à l'API : {{ drones.error() }}
        </div>
      } @else {
        <div class="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
          <table class="tbl">
            <thead><tr><th>Nom</th><th>Code</th><th>Statut</th><th>Batterie</th><th>Vitesse & Distance</th><th>Mission</th><th><span class="sr-only">Actions</span></th></tr></thead>
            <tbody>
              @for (d of rows(); track d.id) {
                <tr class="cursor-pointer" [class]="d.id === drones.selectedId() ? 'bg-[#172A4D]' : ''" (click)="drones.select(d.id)">
                  <td class="font-bold text-[#F8FAFC]">{{ d.name }}</td>
                  <td class="text-[#94A3B8] font-medium">{{ d.code }}</td>
                  <td><app-status-badge [tone]="meta[d.status].tone">{{ meta[d.status].label }}</app-status-badge></td>
                  <td>
                    <span class="inline-flex items-center rounded-full border border-[#10B981]/30 bg-[#10B981]/15 px-2 py-0.5 text-[11px] font-bold text-[#34D399] tabular-nums">
                      {{ round(d.batteryLevel) }}%
                    </span>
                  </td>
                  <td>
                    @if (d.status === 'in-flight') {
                      <div class="leading-tight">
                        <span class="font-bold text-[#38BDF8] tabular-nums text-xs">{{ d.speed.toFixed(1) }} m/s</span>
                        <div class="text-[10px] font-semibold text-[#34D399] tabular-nums">{{ fmtDist(d.distanceKm) }} (+{{ Math.round(d.speed) }}m/s)</div>
                      </div>
                    } @else {
                      <span class="text-[#94A3B8] text-[11px] tabular-nums">{{ fmtDist(d.distanceKm) }}</span>
                    }
                  </td>
                  <td class="text-[#94A3B8] font-medium">{{ missionOf(d) }}</td>
                  <td class="text-right">
                    <button type="button" class="icon-btn" aria-label="Voir la fiche" (click)="$event.stopPropagation(); details.drone(d)"><app-icon name="eye" [size]="13" /></button>
                    <button type="button" class="icon-btn" aria-label="Modifier" (click)="$event.stopPropagation(); ui.openDroneForm(d)"><app-icon name="pencil" [size]="13" /></button>
                    <button type="button" class="icon-btn hover:!text-[#F87171]" aria-label="Supprimer" (click)="$event.stopPropagation(); remove(d)"><app-icon name="trash" [size]="13" /></button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="py-8 text-center text-[#94A3B8]">
                    @if (term() || status()) {
                      Aucun drone ne correspond aux critères.
                    } @else {
                      Aucun drone. Ajoutez votre premier drone.
                    }
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
export class DronesTableComponent {
  protected readonly drones = inject(DroneService);
  private readonly missions = inject(MissionService);
  protected readonly details = inject(DetailService);
  protected readonly ui = inject(UiService);

  readonly full = input(false);
  protected readonly term = signal('');
  protected readonly status = signal<DroneStatus | ''>('');
  protected readonly meta = DRONE_STATUS;
  protected readonly round = Math.round;
  protected readonly Math = Math;
  protected readonly fmtDist = fmtDistance;

  protected readonly statuses = (Object.keys(DRONE_STATUS) as DroneStatus[]).map((value) => ({
    value,
    label: DRONE_STATUS[value].label,
  }));

  protected readonly rows = computed(() => {
    const q = this.term().trim().toLowerCase();
    const st = this.status();
    return this.drones
      .drones()
      .filter((d) => (!q || `${d.name} ${d.code}`.toLowerCase().includes(q)) && (!st || d.status === st));
  });

  protected missionOf(d: Drone): string {
    const m = this.missions.missions().find((x) => x.droneId === d.id && x.status === 'in-progress');
    return m ? m.name : '—';
  }

  protected remove(d: Drone): void {
    this.ui.askConfirm({
      message: `Voulez-vous vraiment supprimer ${d.name} (${d.code}) ?`,
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        await this.drones.remove(d.id);
      },
    });
  }
}
