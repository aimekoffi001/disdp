import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { LatLng } from '../../core/models/models';
import { DroneService } from '../../core/services/drone.service';
import { FlightService } from '../../core/services/flight.service';
import { MissionService } from '../../core/services/mission.service';
import { ZoneService } from '../../core/services/zone.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { fmtArea, pointInPolygon, polygonAreaM2 } from '../../shared/utils/geo';
import { DRONE_STATUS, FLIGHT_MODE } from '../../shared/utils/labels';
import { DroneMapComponent } from '../dashboard/components/drone-map/drone-map.component';

@Component({
  selector: 'app-surveillance-zones-page',
  imports: [PageHeaderComponent, DroneMapComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-[1500px] flex-col gap-4">
      <app-page-header title="Zones de surveillance" subtitle="Déplacement de chaque drone en temps réel (simulation)" />
      <div class="grid gap-4 xl:grid-cols-12">
        <div class="xl:col-span-8"><app-drone-map [height]="560" [controls]="true" /></div>
        <div class="flex flex-col gap-4 xl:col-span-4">
          <section class="panel">
            <div class="panel-title flex items-center justify-between">
              <span class="text-[#F8FAFC] font-semibold">Drones en direct</span>
            </div>
            <ul class="space-y-2 mt-2">
              @for (d of live(); track d.id) {
                <li>
                  <button type="button" (click)="drones.select(d.id)"
                    [class]="'w-full rounded-[12px] border px-3 py-2 text-left text-xs transition shadow-sm ' + (d.id === drones.selectedId() ? 'border-[#38BDF8] bg-[#172A4D]' : 'border-[#1E3A5F] bg-[#0C1E3D] hover:bg-[#172A4D]')">
                    <div class="flex items-center justify-between">
                      <span class="font-bold text-[#F8FAFC]">{{ d.name }}</span>
                      <app-status-badge [tone]="meta[d.status].tone">{{ meta[d.status].label }}</app-status-badge>
                    </div>
                    <div class="mt-1 grid grid-cols-2 gap-x-3 text-[10px] text-[#94A3B8] tabular-nums">
                      <span>{{ d.latitude.toFixed(5) }}, {{ d.longitude.toFixed(5) }}</span>
                      <span class="text-right">{{ d.speed.toFixed(1) }} m/s · {{ d.altitude.toFixed(0) }} m</span>
                      <span>Zone : <span class="font-semibold text-[#F8FAFC]">{{ d.zone }}</span></span>
                      <span class="text-right font-medium">{{ d.status === 'in-flight' ? modes[d.flightMode].label : '—' }}</span>
                    </div>
                  </button>
                </li>
              }
            </ul>
          </section>

          <section class="panel">
            <div class="panel-title flex items-center justify-between">
              <span class="text-[#F8FAFC] font-semibold">Zones et occupation</span>
            </div>
            <ul class="space-y-2 mt-2">
              @for (z of zones(); track z.id) {
                <li class="rounded-[12px] border border-[#1E3A5F] bg-[#0C1E3D] p-3 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="flex items-center gap-2 font-bold text-[#F8FAFC]">
                      <span class="size-2 rounded-full" [style.background]="z.color"></span>{{ z.name }}
                    </span>
                    <span class="text-[10px] text-[#94A3B8]">{{ z.area }}</span>
                  </div>
                  <div class="mt-2 text-[11px] text-[#94A3B8]">
                    Drones présents :
                    @if (z.drones.length) {
                      <span class="font-semibold text-[#F8FAFC]">{{ z.drones.join(', ') }}</span>
                    } @else { <span class="italic text-[#64748B]">aucun drone</span> }
                  </div>
                </li>
              }
            </ul>
          </section>
        </div>
      </div>
    </div>
  `,
})
export class SurveillanceZonesPage {
  protected readonly drones = inject(DroneService);
  protected readonly zoneService = inject(ZoneService);
  private readonly missions = inject(MissionService);
  private readonly flights = inject(FlightService);
  protected readonly meta = DRONE_STATUS;
  protected readonly modes = FLIGHT_MODE;

  protected readonly live = computed(() => {
    const zones = this.zoneService.zones();
    return this.drones.drones().map((d) => ({
      ...d,
      zone: zones.find((z) => pointInPolygon([d.latitude, d.longitude], z.polygon))?.name ?? 'Hors zone',
    }));
  });

  protected readonly zones = computed(() => {
    const list = this.drones.drones();
    return this.zoneService.zones().map((z) => {
      const inside = list.filter((d) => pointInPolygon([d.latitude, d.longitude], z.polygon)).map((d) => d.name);
      return {
        id: z.id,
        name: z.name,
        color: z.color,
        area: fmtArea(polygonAreaM2(z.polygon as LatLng[])),
        drones: inside,
      };
    });
  });
}
