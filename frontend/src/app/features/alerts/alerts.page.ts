import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AlertsTableComponent } from '../dashboard/components/alerts-table/alerts-table.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-alerts-page',
  imports: [PageHeaderComponent, AlertsTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-[1200px] flex-col gap-3">
      <app-page-header title="Alertes" subtitle="Suivi et traitement des alertes de la flotte" />
      <app-alerts-table [full]="true" />
    </div>
  `,
})
export class AlertsPage {}
