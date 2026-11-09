import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DetailService } from '../../../core/services/detail.service';
import { DroneService } from '../../../core/services/drone.service';
import { MissionService } from '../../../core/services/mission.service';
import { SearchHit, UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-search-box',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block' },
  template: `
    <app-icon name="search" [size]="13" class="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#64748B]" />
    <input
      type="search" class="w-full rounded-lg border border-[#1E3A5F] bg-[#0C1E3D] py-1.5 pl-8 pr-3 text-xs text-[#F8FAFC] outline-none transition placeholder:text-[#64748B] focus:bg-[#112240] focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]/25"
      placeholder="Rechercher un drone, une mission…"
      aria-label="Rechercher" [value]="ui.searchTerm()"
      (input)="ui.searchTerm.set($any($event.target).value)" (keydown.escape)="ui.searchTerm.set('')" />
    @if (ui.searchTerm().trim()) {
      <div class="absolute top-full right-0 left-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-[#1E3A5F] bg-[#112240] shadow-2xl" role="listbox">
        @for (hit of ui.searchResults(); track hit.kind + hit.id) {
          <button type="button" role="option" class="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-[#F8FAFC] hover:bg-[#172A4D] transition-colors" (click)="open(hit)">
            <span class="flex items-center gap-2 font-medium"><app-icon [name]="hit.kind === 'drone' ? 'drone' : 'missions'" [size]="13" class="text-[#38BDF8]" />{{ hit.label }}</span>
            <span class="text-[10px] text-[#94A3B8]">{{ hit.kind === 'drone' ? 'Drone' : 'Mission' }} · {{ hit.sub }}</span>
          </button>
        } @empty {
          <div class="px-3 py-2 text-xs text-[#94A3B8]">Aucun résultat.</div>
        }
      </div>
    }
  `,
})
export class SearchBoxComponent {
  protected readonly ui = inject(UiService);
  private readonly details = inject(DetailService);
  private readonly drones = inject(DroneService);
  private readonly missions = inject(MissionService);

  protected open(hit: SearchHit): void {
    this.ui.searchTerm.set('');
    this.ui.menuOpen.set(false);
    if (hit.kind === 'drone') {
      const d = this.drones.byId(hit.id);
      if (d) { this.drones.select(d.id); this.details.drone(d); }
    } else {
      const m = this.missions.byId(hit.id);
      if (m) this.details.mission(m);
    }
  }
}
