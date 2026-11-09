import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FlightHistoryComponent } from '../dashboard/components/flight-history/flight-history.component';
import { FlightSchedulerComponent } from '../dashboard/components/flight-scheduler/flight-scheduler.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-flight-planning-page',
  imports: [PageHeaderComponent, FlightSchedulerComponent, FlightHistoryComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-[1200px] flex-col gap-3">
      <app-page-header title="Planification des vols" subtitle="Programmation (simulée) et historique" />
      <app-flight-scheduler [full]="true" />
      <app-flight-history [full]="true" />
    </div>
  `,
})
export class FlightPlanningPage {}
