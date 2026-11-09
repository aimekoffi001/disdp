import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { TelemetryService } from './core/services/telemetry.service';
import { FlightControlService } from './core/services/flight-control.service';

@Component({
  selector: 'app-root',
  imports: [MainLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-main-layout />`,
})
export class App {
  /** Instancie la simulation dès le démarrage. */
  private readonly telemetry = inject(TelemetryService);
  private readonly flightControl = inject(FlightControlService);
}
