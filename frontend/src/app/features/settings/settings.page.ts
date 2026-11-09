import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { AlertService } from '../../core/services/alert.service';
import { DroneService } from '../../core/services/drone.service';
import { FlightService } from '../../core/services/flight.service';
import { MissionService } from '../../core/services/mission.service';
import { NotificationService } from '../../core/services/notification.service';
import { FlightControlService } from '../../core/services/flight-control.service';
import { TelemetryService } from '../../core/services/telemetry.service';
import { UiService } from '../../core/services/ui.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-settings-page',
  imports: [PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-[900px] flex-col gap-3">
      <app-page-header title="Paramètres" subtitle="Simulation et données de démonstration" />
      <section class="panel">
        <div class="panel-title">Simulation de télémétrie</div>
        <p class="text-xs text-[#94A3B8]">La télémétrie (position, batterie, moteurs, capteurs) est simulée toutes les {{ interval / 1000 }} s. Aucune donnée réelle n'est utilisée.</p>
        <button type="button" class="btn-pill mt-3" (click)="telemetry.toggle()">
          {{ telemetry.running() ? 'Suspendre la simulation' : 'Reprendre la simulation' }}
        </button>
      </section>
      <section class="panel">
        <div class="panel-title">Accélération des vols programmés</div>
        <p class="text-xs text-[#94A3B8]">Les vols programmés comptent leurs durées et changements de mode en minutes de vol. Accélérez le temps pour tester un plan de vol en quelques secondes (×60 : une minute de vol par seconde).</p>
        <div class="mt-3 flex gap-2">
          @for (s of scales; track s) {
            <button type="button" [class]="control.timeScale() === s ? 'btn-pill' : 'btn-ghost'" (click)="control.timeScale.set(s)">×{{ s }}</button>
          }
        </div>
      </section>
      <section class="panel">
        <div class="panel-title">Données de démonstration</div>
        <p class="text-xs text-[#94A3B8]">Les modifications sont conservées dans le navigateur (localStorage). La réinitialisation restaure le jeu de données d'origine.</p>
        <button type="button" class="btn-pill mt-3 !bg-[#EF4444] hover:!bg-[#DC2626] text-white" (click)="askReset()">Réinitialiser les données</button>
      </section>
      <section class="panel">
        <div class="panel-title">Flux vidéo de démonstration</div>
        <ol class="list-decimal space-y-1 pl-5 text-xs text-[#94A3B8]">
          @for (s of sources; track s) { <li class="break-all text-[#F8FAFC]">{{ s }}</li> }
        </ol>
        <p class="mt-2 text-[11px] text-[#94A3B8]">Modifiable dans <code class="text-[#38BDF8] bg-[#0C1E3D] px-1 py-0.5 rounded border border-[#1E3A5F]">src/app/core/config/app-settings.ts</code>.</p>
      </section>
    </div>
  `,
})
export class SettingsPage {
  protected readonly telemetry = inject(TelemetryService);
  protected readonly control = inject(FlightControlService);
  protected readonly scales = [1, 10, 60];
  private readonly ui = inject(UiService);
  private readonly drones = inject(DroneService);
  private readonly missions = inject(MissionService);
  private readonly alerts = inject(AlertService);
  private readonly flights = inject(FlightService);
  private readonly notifications = inject(NotificationService);
  protected readonly interval = APP_SETTINGS.telemetryIntervalMs;
  protected readonly sources = APP_SETTINGS.demoVideoSources;

  protected askReset(): void {
    this.ui.askConfirm({
      message: 'Restaurer toutes les données de démonstration ? Vos modifications seront perdues.',
      confirmLabel: 'Réinitialiser',
      onConfirm: () => {
        this.drones.reset();
        this.missions.reset();
        this.alerts.reset();
        this.flights.reset();
        this.notifications.success('Données de démonstration restaurées.');
      },
    });
  }
}
