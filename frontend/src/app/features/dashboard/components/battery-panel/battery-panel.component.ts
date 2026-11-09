import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DroneService } from '../../../../core/services/drone.service';
import { TelemetryService } from '../../../../core/services/telemetry.service';
import { CircularIndicatorComponent } from '../../../../shared/components/circular-indicator/circular-indicator.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-battery-panel',
  imports: [CircularIndicatorComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <div class="panel-title flex items-center justify-between">
        <div class="flex items-center gap-2">
          <app-icon name="battery" [size]="15" class="text-[#34D399]" />
          <span class="text-[#F8FAFC] font-semibold">Niveau de batterie</span>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-1">
        <div class="shrink-0">
          <app-circular-indicator [value]="level()" [size]="92">
            <!-- Pourcentages batterie vert doux sur fond bleu marine -->
            <span class="rounded-full border border-[#10B981]/30 bg-[#10B981]/15 px-2.5 py-0.5 text-base font-extrabold text-[#34D399] tabular-nums shadow-sm">
              {{ level() }}%
            </span>
          </app-circular-indicator>
        </div>
        <dl class="w-full flex-1 space-y-2 text-[11px]">
          <div class="flex items-center justify-between border-b border-[#1E3A5F] pb-1.5">
            <dt class="flex items-center gap-1.5 text-[#94A3B8]"><app-icon name="zap" [size]="12" class="text-[#38BDF8]" />Tension</dt>
            <dd class="font-bold text-[#F8FAFC] tabular-nums">{{ t().voltage.toFixed(1).replace('.', ',') }} V</dd>
          </div>
          <div class="flex items-center justify-between border-b border-[#1E3A5F] pb-1.5">
            <dt class="flex items-center gap-1.5 text-[#94A3B8]"><app-icon name="thermometer" [size]="12" class="text-[#38BDF8]" />Température</dt>
            <dd class="font-bold text-[#F8FAFC] tabular-nums">{{ t().batteryTemp }} °C</dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="flex items-center gap-1.5 text-[#94A3B8]"><app-icon name="clock" [size]="12" class="text-[#38BDF8]" />Autonomie</dt>
            <dd class="font-bold text-[#F8FAFC] tabular-nums">{{ t().autonomyMin }} min</dd>
          </div>
        </dl>
      </div>
    </section>
  `,
})
export class BatteryPanelComponent {
  private readonly drones = inject(DroneService);
  protected readonly t = inject(TelemetryService).selectedTelemetry;
  protected level(): number {
    return Math.round(this.drones.selected()?.batteryLevel ?? 0);
  }
}
