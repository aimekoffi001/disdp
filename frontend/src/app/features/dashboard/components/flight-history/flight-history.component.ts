import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DetailService } from '../../../../core/services/detail.service';
import { DroneService } from '../../../../core/services/drone.service';
import { FlightService } from '../../../../core/services/flight.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { fmtDate, fmtDuration } from '../../../../shared/utils/labels';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-flight-history',
  imports: [IconComponent, StatusBadgeComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel h-full">
      <div class="panel-title flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="flex size-6 items-center justify-center rounded-md border border-[#1E3A5F] bg-[#112240] text-[#38BDF8]"><app-icon name="history" [size]="13" /></span>
          <span class="text-[#F8FAFC] font-semibold">Historique des vols</span>
        </div>
        <div>
          @if (!full()) { <a routerLink="/flight-planning" class="btn-pill">Voir tout</a> }
        </div>
      </div>

      @if (full()) {
        <div class="mb-2.5 flex flex-col sm:flex-row flex-wrap gap-2">
          <select class="field w-full sm:!w-40" aria-label="Filtrer par drone" (change)="droneId.set($any($event.target).value)">
            <option value="">Tous les drones</option>
            @for (d of drones.drones(); track d.id) { <option [value]="d.id">{{ d.name }}</option> }
          </select>
          <input type="date" class="field w-full sm:!w-40" aria-label="Filtrer par date" (change)="date.set($any($event.target).value)" />
        </div>
      }

      <div class="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
        <table class="tbl">
          <thead><tr><th>Date</th><th>Drone</th><th>Mission</th><th>Durée</th><th>Statut</th><th><span class="sr-only">Actions</span></th></tr></thead>
          <tbody>
            @for (f of rows(); track f.id) {
              <tr>
                <td class="text-[#94A3B8] font-medium">{{ fmtD(f.date) }}</td>
                <td class="font-bold text-[#F8FAFC]">{{ drones.nameOf(f.droneId) }}</td>
                <td class="text-[#F8FAFC]">{{ f.missionName }}</td>
                <td class="text-[#94A3B8] tabular-nums">{{ fmtDur(f.durationMin) }}</td>
                <td><app-status-badge [tone]="f.status === 'completed' ? 'green' : 'amber'">{{ f.status === 'completed' ? 'Terminée' : 'Interrompue' }}</app-status-badge></td>
                <td class="text-right"><button type="button" class="icon-btn" aria-label="Détails du vol" (click)="details.flight(f)"><app-icon name="eye" [size]="13" /></button></td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="py-4 text-center text-[#94A3B8]">Aucun vol.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class FlightHistoryComponent {
  private readonly flights = inject(FlightService);
  protected readonly drones = inject(DroneService);
  protected readonly details = inject(DetailService);

  readonly full = input(false);
  protected readonly droneId = signal('');
  protected readonly date = signal('');
  protected readonly fmtD = fmtDate;
  protected readonly fmtDur = fmtDuration;

  protected readonly rows = computed(() => {
    const did = this.droneId();
    const dStr = this.date();
    const all = this.flights.history();
    const filtered = all.filter((f) => (!did || f.droneId === did) && (!dStr || f.date.startsWith(dStr)));
    return this.full() ? filtered : filtered.slice(0, 5);
  });
}
