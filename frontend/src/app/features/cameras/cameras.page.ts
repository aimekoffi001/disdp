import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DroneService } from '../../core/services/drone.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { DRONE_STATUS } from '../../shared/utils/labels';
import { LiveCameraComponent } from '../dashboard/components/live-camera/live-camera.component';

@Component({
  selector: 'app-cameras-page',
  imports: [PageHeaderComponent, LiveCameraComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-[1200px] flex-col gap-3 sm:gap-4">
      <app-page-header title="Caméras" subtitle="Sélectionnez un drone pour afficher son flux (démonstration)" />
      <div class="grid gap-3 sm:gap-4 lg:grid-cols-3">
        <div class="lg:col-span-2"><app-live-camera /></div>
        <section class="panel">
          <div class="panel-title flex items-center justify-between">
            <span class="text-[#F8FAFC] font-semibold">Flux disponibles</span>
          </div>
          <ul class="space-y-1.5 mt-2">
            @for (d of drones.drones(); track d.id) {
              <li>
                <button type="button" (click)="drones.select(d.id)"
                  [class]="'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition shadow-sm cursor-pointer ' + (d.id === drones.selectedId() ? 'border-[#38BDF8] bg-[#172A4D]' : 'border-[#1E3A5F] bg-[#0C1E3D] hover:bg-[#172A4D]')">
                  <span class="font-bold text-[#F8FAFC]">{{ d.name }} <span class="text-[#94A3B8] font-normal">· {{ d.code }}</span></span>
                  <app-status-badge [tone]="meta[d.status].tone">{{ meta[d.status].label }}</app-status-badge>
                </button>
              </li>
            }
          </ul>
          <p class="mt-3 text-[11px] text-[#94A3B8]">
            Seul un drone en vol possède un flux. En démonstration la vidéo est la même pour tous ;
            un flux réel se branche via <code class="text-[#38BDF8] font-mono">liveStreamUrl</code> dans <code class="text-[#38BDF8] font-mono">app-settings.ts</code>.
          </p>
        </section>
      </div>
    </div>
  `,
})
export class CamerasPage {
  protected readonly drones = inject(DroneService);
  protected readonly meta = DRONE_STATUS;
}
