import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TelemetryService } from '../../../../core/services/telemetry.service';
import { IconComponent, IconName } from '../../../../shared/components/icon/icon.component';

const ICONS: Partial<Record<string, IconName>> = {
  temp: 'thermometer',
  hum: 'droplets',
  press: 'gauge',
  air: 'activity',
};

@Component({
  selector: 'app-sensors-panel',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel h-full flex flex-col justify-between gap-3.5">
      <div>
        <div class="panel-title flex items-center justify-between">
          <div class="flex items-center gap-2">
            <app-icon name="wind" [size]="14" class="text-[#38BDF8]" />
            <span class="text-[#F8FAFC] font-semibold">Capteurs Météo & Aérologie</span>
          </div>
          <span class="inline-flex items-center gap-1 rounded-md border border-[#1E3A5F] bg-[#0C1E3D] px-2 py-0.5 text-[10px] font-semibold text-[#34D399]">
            <span class="size-1.5 rounded-full bg-[#10B981] animate-pulse"></span>En direct (1 Hz)
          </span>
        </div>

        <!-- 4 Capteurs Réactifs en Direct : Température, Humidité, Pression baro, Qualité d'air MQ-2 -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          @for (s of sensors(); track s.key) {
            <div class="metric-tile flex flex-col justify-between h-[72px] p-2.5">
              <div class="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium tracking-[0.05em] text-[#94A3B8] uppercase truncate">
                <app-icon [name]="icons[s.key] ?? 'activity'" [size]="12" class="text-[#38BDF8]" />{{ s.label }}
              </div>
              <div class="flex items-baseline justify-between gap-1">
                <span class="text-[17px] sm:text-[19px] font-bold text-[#F8FAFC] tabular-nums leading-tight">
                  {{ s.value }}<span class="ml-0.5 text-[11px] font-normal text-[#94A3B8]">{{ s.unit }}</span>
                </span>
                <span class="text-[9px] sm:text-[10px] font-medium text-[#34D399] truncate text-right">{{ s.status }}</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Bloc Aérologie & Rose des Vents Interactive Réactive -->
      <div class="rounded-xl border border-[#1E3A5F] bg-[#0C1E3D] p-3.5 shadow-sm">
        <div class="flex items-center justify-between text-[11px] font-semibold text-[#F8FAFC] border-b border-[#1E3A5F] pb-2 mb-2.5">
          <span class="flex items-center gap-1.5 text-[#38BDF8]">
            <app-icon name="compass" [size]="13" /> Direction & Vitesse du Vent
          </span>
          <span class="rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-bold text-[#34D399]">
            {{ wind().status }}
          </span>
        </div>

        <div class="flex items-center gap-4">
          <!-- Boussole Rose des vents SVG avec aiguille réactive fluide -->
          <div class="relative size-20 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 80 80" class="size-full">
              <circle cx="40" cy="40" r="36" fill="#112240" stroke="#1E3A5F" stroke-width="1.5" />
              <circle cx="40" cy="40" r="28" fill="none" stroke="#1E3A5F" stroke-width="1" stroke-dasharray="2 3" />
              <text x="40" y="14" text-anchor="middle" font-size="8" font-weight="bold" fill="#EF4444">N</text>
              <text x="68" y="43" text-anchor="middle" font-size="8" font-weight="bold" fill="#64748B">E</text>
              <text x="40" y="73" text-anchor="middle" font-size="8" font-weight="bold" fill="#64748B">S</text>
              <text x="12" y="43" text-anchor="middle" font-size="8" font-weight="bold" fill="#64748B">O</text>
              <!-- Flèche orientée en temps réel selon la direction du vent -->
              <g [style.transform]="'rotate(' + wind().directionDeg + 'deg)'"
                 style="transform-origin: 40px 40px; transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <polygon points="40,16 44,40 36,40" fill="#38BDF8" opacity="0.95" />
                <polygon points="40,64 43,40 37,40" fill="#64748B" opacity="0.6" />
                <circle cx="40" cy="40" r="3" fill="#F8FAFC" />
              </g>
            </svg>
          </div>

          <div class="min-w-0 flex-1 space-y-1 text-[11px]">
            <div>
              <span class="text-[#94A3B8] text-[10px] uppercase font-medium">Vitesse du vent</span>
              <div class="font-bold text-[#F8FAFC] text-[15px] tabular-nums">
                {{ wind().speedKmh }} <span class="text-[11px] font-normal text-[#94A3B8]">km/h</span>
                <span class="ml-1 text-[11px] font-semibold text-[#38BDF8]">({{ wind().speedMs }} m/s)</span>
              </div>
            </div>
            <div class="flex items-center justify-between text-[10px]">
              <span class="text-[#94A3B8]">Rafales : <strong class="text-[#F8FAFC]">{{ wind().gustKmh }} km/h</strong></span>
              <span class="font-semibold text-[#38BDF8]">{{ wind().cardinal }} ({{ wind().directionDeg }}°)</span>
            </div>
            <div class="text-[10px] font-medium text-[#34D399] truncate pt-0.5 border-t border-[#1E3A5F]/60">
              {{ wind().driftEffect }}
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class SensorsPanelComponent {
  private readonly telemetry = inject(TelemetryService);
  protected readonly sensors = this.telemetry.selectedSensors;
  protected readonly t = this.telemetry.selectedTelemetry;
  protected readonly wind = computed(() => this.t().wind);
  protected readonly icons = ICONS;
}
