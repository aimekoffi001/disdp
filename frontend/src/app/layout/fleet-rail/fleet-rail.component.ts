import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Drone, DroneStatus } from '../../core/models/models';
import { DetailService } from '../../core/services/detail.service';
import { DroneService } from '../../core/services/drone.service';
import { MissionService } from '../../core/services/mission.service';
import { UiService } from '../../core/services/ui.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { DRONE_STATUS } from '../../shared/utils/labels';

const DOT: Record<DroneStatus, string> = {
  'in-flight': 'bg-[#34D399]',
  available: 'bg-[#38BDF8]',
  maintenance: 'bg-[#F87171]',
  offline: 'bg-[#64748B]',
};

/** Panneau « Flotte » style BLEU MARINE PRO. */
@Component({
  selector: 'app-fleet-rail',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [class]="strip() ? 'flex flex-col gap-2' : 'flex h-full flex-col gap-3 border-r border-[#1E3A5F] bg-[#112240] p-3 shadow-md'" aria-label="Flotte de drones">
      <div class="flex items-center justify-between gap-2">
        <div>
          <h2 class="text-[11px] font-medium tracking-[0.05em] text-[#94A3B8] uppercase">Flotte</h2>
          <p class="text-[10px] text-[#94A3B8]">
            <span class="text-[#34D399] font-medium">{{ count('in-flight') }} en vol</span> · {{ count('available') }} dispo · <span class="text-[#F87171] font-medium">{{ count('maintenance') }} maint.</span>
          </p>
        </div>
        <!-- Bouton "+ Drone" : Style Bleu Marine Accent -->
        <button type="button" class="flex items-center gap-1.5 rounded-[8px] bg-[#2563EB] text-white px-3 py-1.5 text-[11px] font-semibold transition hover:bg-[#1D4ED8] active:scale-[0.98] cursor-pointer shadow-sm" (click)="ui.openDroneForm()">
          <app-icon name="plus" [size]="13" /> Drone
        </button>
      </div>

      @if (!strip()) {
        <div class="relative">
          <app-icon name="search" [size]="13" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#64748B]" />
          <input type="search" class="field !rounded-lg !py-1.5 !pl-8" placeholder="Filtrer la flotte…" aria-label="Filtrer la flotte" (input)="term.set($any($event.target).value)" />
        </div>
      }

      <div [class]="strip() ? 'flex gap-2 overflow-x-auto pb-1.5 no-scrollbar' : 'flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5'">
        @for (d of rows(); track d.id) {
          <div
            role="button" tabindex="0"
            [class]="'group relative cursor-pointer rounded-[12px] border p-2.5 sm:p-3 transition shadow-sm ' + (strip() ? 'w-[210px] sm:w-[240px] shrink-0 ' : '') + (d.id === drones.selectedId() ? 'border-[#38BDF8] bg-[#172A4D]' : 'border-[#1E3A5F] bg-[#0C1E3D] hover:border-[#38BDF8]/40 hover:bg-[#172A4D]')"
            (click)="drones.select(d.id)" (keydown.enter)="drones.select(d.id)">
            <div class="flex items-center gap-2.5">
              <span class="relative flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#1E3A5F] bg-[#112240] text-[#38BDF8]">
                <app-icon name="drone" [size]="18" />
                <span [class]="'absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2 ring-[#0C1E3D] ' + dot[d.status]"></span>
              </span>
              <div class="min-w-0 flex-1">
                <div class="truncate text-[13px] font-semibold text-[#F8FAFC]">{{ d.name }}</div>
                <div class="truncate text-[10px] text-[#94A3B8]">{{ d.code }} · {{ meta[d.status].label }}</div>
              </div>
              <!-- Badge batterie vert doux sur fond navy teinté -->
              <span class="inline-flex items-center rounded-full border border-[#10B981]/30 bg-[#10B981]/15 px-2 py-0.5 text-[11px] font-bold tabular-nums text-[#34D399]">
                {{ round(d.batteryLevel) }}%
              </span>
            </div>

            <!-- Barre de progression fine 3px bleu #38BDF8 -->
            <div class="mt-2.5 h-[3px] overflow-hidden rounded-full bg-[#1E3A5F]">
              <div class="h-full rounded-full transition-all duration-700 bg-[#38BDF8]" [style.width.%]="d.batteryLevel"></div>
            </div>

            <div class="mt-2 flex items-center justify-between text-[10px] text-[#94A3B8]">
              <span class="flex min-w-0 items-center gap-1"><app-icon name="route" [size]="11" /><span class="truncate">{{ missionOf(d) }}</span></span>
              @if (d.status === 'in-flight') { <span class="tabular-nums font-medium text-[#F8FAFC]">{{ d.speed.toFixed(1) }} m/s</span> }
            </div>

            <div class="absolute top-1.5 right-1.5 hidden gap-0.5 rounded-lg border border-[#1E3A5F] bg-[#112240] p-0.5 shadow-lg group-focus-within:flex group-hover:flex">
              <button type="button" class="icon-btn !size-6" aria-label="Voir la fiche" (click)="$event.stopPropagation(); details.drone(d)"><app-icon name="eye" [size]="12" /></button>
              <button type="button" class="icon-btn !size-6" aria-label="Modifier" (click)="$event.stopPropagation(); ui.openDroneForm(d)"><app-icon name="pencil" [size]="12" /></button>
              <button type="button" class="icon-btn !size-6 hover:!text-[#F87171]" aria-label="Supprimer" (click)="$event.stopPropagation(); remove(d)"><app-icon name="trash" [size]="12" /></button>
            </div>
          </div>
        } @empty {
          <p class="py-6 text-center text-xs text-[#94A3B8]">Aucun drone.</p>
        }
      </div>
    </section>
  `,
})
export class FleetRailComponent {
  protected readonly drones = inject(DroneService);
  private readonly missions = inject(MissionService);
  protected readonly details = inject(DetailService);
  protected readonly ui = inject(UiService);

  readonly strip = input(false);
  protected readonly term = signal('');
  protected readonly meta = DRONE_STATUS;
  protected readonly dot = DOT;
  protected readonly round = Math.round;

  protected readonly rows = computed(() => {
    const q = this.term().trim().toLowerCase();
    return this.drones.drones().filter((d) => !q || `${d.name} ${d.code}`.toLowerCase().includes(q));
  });

  protected count(s: DroneStatus): number {
    return this.drones.drones().filter((d) => d.status === s).length;
  }
  protected missionOf(d: Drone): string {
    const m = this.missions.missions().find((x) => x.droneId === d.id && x.status === 'in-progress');
    return m ? m.name : 'Aucune mission';
  }
  protected remove(d: Drone): void {
    this.ui.askConfirm({
      message: `Supprimer ${d.name} (${d.code}) de la flotte ?`,
      confirmLabel: 'Supprimer',
      onConfirm: () => this.drones.remove(d.id),
    });
  }
}
