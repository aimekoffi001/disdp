import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Alert, AlertSeverity } from '../../../../core/models/models';
import { DetailService } from '../../../../core/services/detail.service';
import { DroneService } from '../../../../core/services/drone.service';
import { AlertService } from '../../../../core/services/alert.service';
import { UiService } from '../../../../core/services/ui.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ALERT_SEVERITY, ALERT_STATUS, fmtDateTime } from '../../../../shared/utils/labels';

@Component({
  selector: 'app-alerts-table',
  imports: [IconComponent, StatusBadgeComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel h-full">
      <div class="panel-title flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="flex size-6 items-center justify-center rounded-md border border-[#EF4444]/30 bg-[#EF4444]/15 text-[#F87171]"><app-icon name="alert" [size]="13" /></span>
          <span class="text-[#F8FAFC] font-semibold">{{ full() ? 'Alertes' : 'Dernières alertes' }}</span>
        </div>
        <div>
          @if (!full()) { <a routerLink="/alerts" class="btn-pill">Voir toutes</a> }
        </div>
      </div>

      @if (full()) {
        <div class="mb-2.5 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2">
          <select class="field w-full sm:!w-40" aria-label="Filtrer par gravité" (change)="severity.set($any($event.target).value)">
            <option value="">Toutes gravités</option>
            @for (s of severities; track s.value) { <option [value]="s.value">{{ s.label }}</option> }
          </select>
          <label class="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
            <input type="checkbox" (change)="onlyOpen.set($any($event.target).checked)" /> Non résolues uniquement
          </label>
        </div>
      }

      @if (alerts.loading()) {
        <div class="py-8 text-center text-sm text-[#38BDF8] flex items-center justify-center gap-2">
          <span class="inline-block size-4 animate-spin rounded-full border-2 border-[#38BDF8] border-t-transparent"></span>
          <span>Chargement...</span>
        </div>
      } @else {
        <div class="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
          <table class="tbl">
            <thead><tr><th>Date / Heure</th><th>Drone</th><th>Type</th><th>Niveau</th><th>Statut</th><th><span class="sr-only">Actions</span></th></tr></thead>
            <tbody>
              @for (a of rows(); track a.id) {
                <tr>
                  <td class="text-[#94A3B8] font-medium">{{ fmt(a.timestamp) }}</td>
                  <td class="font-bold text-[#F8FAFC]">{{ drones.nameOf(a.droneId) }}</td>
                  <td class="text-[#F8FAFC]">{{ a.type }}</td>
                  <td><app-status-badge [tone]="sev[a.severity].tone">{{ sev[a.severity].label }}</app-status-badge></td>
                  <td><app-status-badge [tone]="st[a.status].tone">{{ st[a.status].label }}</app-status-badge></td>
                  <td class="text-right">
                    <button type="button" class="icon-btn" aria-label="Détails de l'alerte" (click)="details.alert(a)"><app-icon name="eye" [size]="13" /></button>
                    @if (a.status !== 'resolved') {
                      <button type="button" class="icon-btn hover:!text-[#34D399]" aria-label="Résoudre" (click)="alerts.setStatus(a.id, 'resolved')"><app-icon name="check" [size]="13" /></button>
                    }
                    <button type="button" class="icon-btn hover:!text-[#F87171]" aria-label="Supprimer" (click)="remove(a)"><app-icon name="trash" [size]="13" /></button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="py-6 text-center text-[#94A3B8]">Aucune alerte enregistrée.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class AlertsTableComponent {
  protected readonly alerts = inject(AlertService);
  protected readonly drones = inject(DroneService);
  protected readonly details = inject(DetailService);
  private readonly ui = inject(UiService);

  readonly full = input(false);
  protected readonly severity = signal<AlertSeverity | ''>('');
  protected readonly onlyOpen = signal(false);
  protected readonly sev = ALERT_SEVERITY;
  protected readonly st = ALERT_STATUS;
  protected readonly fmt = fmtDateTime;

  protected readonly severities = (Object.keys(ALERT_SEVERITY) as AlertSeverity[]).map((value) => ({
    value,
    label: ALERT_SEVERITY[value].label,
  }));

  protected readonly rows = computed(() => {
    let list = this.alerts.alerts();
    const sv = this.severity();
    if (sv) list = list.filter((a) => a.severity === sv);
    if (this.onlyOpen()) list = list.filter((a) => a.status !== 'resolved');
    return this.full() ? list : list.slice(0, 5);
  });

  protected remove(a: Alert): void {
    this.ui.askConfirm({
      message: `Voulez-vous vraiment supprimer cette alerte ?`,
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        await this.alerts.remove(a.id);
      },
    });
  }
}
