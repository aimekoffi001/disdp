import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DronesTableComponent } from '../dashboard/components/drones-table/drones-table.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-drones-page',
  imports: [PageHeaderComponent, DronesTableComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-[1200px] flex-col gap-3">
      <app-page-header title="Drones" subtitle="Flotte, statuts et niveaux de batterie" />
      <app-drones-table [full]="true" />
    </div>
  `,
})
export class DronesPage {}
