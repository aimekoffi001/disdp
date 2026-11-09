import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MissionsTableComponent } from '../dashboard/components/missions-table/missions-table.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-missions-page',
  imports: [PageHeaderComponent, MissionsTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-[1200px] flex-col gap-3">
      <app-page-header title="Missions" subtitle="Missions planifiées, en cours et terminées" />
      <app-missions-table [full]="true" />
    </div>
  `,
})
export class MissionsPage {}
