import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AlertService } from '../../core/services/alert.service';
import { DroneService } from '../../core/services/drone.service';
import { FlightService } from '../../core/services/flight.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { fmtDateTime } from '../../shared/utils/labels';

@Component({
  selector: 'app-reports-page',
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-[900px] flex-col gap-3">
      <app-page-header title="Rapports" subtitle="Exports de données de démonstration" />
      <section class="panel">
        <div class="panel-title">Génération de rapports</div>
        <p class="text-xs text-[#94A3B8]">Les rapports mis en forme (PDF, graphiques) ne sont pas encore développés. En attendant, vous pouvez exporter les données en CSV.</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <button type="button" class="btn-pill" (click)="exportFlights()">Exporter l'historique des vols (CSV)</button>
          <button type="button" class="btn-pill" (click)="exportAlerts()">Exporter les alertes (CSV)</button>
        </div>
      </section>
    </div>
  `,
})
export class ReportsPage {
  private readonly flights = inject(FlightService);
  private readonly alerts = inject(AlertService);
  private readonly drones = inject(DroneService);

  protected exportFlights(): void {
    const rows = this.flights.history().map((f) => [fmtDateTime(f.date), this.drones.nameOf(f.droneId), f.missionName, String(f.durationMin), f.status]);
    this.download('vols.csv', ['Date', 'Drone', 'Mission', 'Durée (min)', 'Statut'], rows);
  }

  protected exportAlerts(): void {
    const rows = this.alerts.alerts().map((a) => [fmtDateTime(a.timestamp), this.drones.nameOf(a.droneId), a.type, a.severity, a.status]);
    this.download('alertes.csv', ['Date', 'Drone', 'Type', 'Gravité', 'Statut'], rows);
  }

  private download(name: string, header: string[], rows: string[][]): void {
    const esc = (v: string) => `"${v.replaceAll('"', '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }
}
