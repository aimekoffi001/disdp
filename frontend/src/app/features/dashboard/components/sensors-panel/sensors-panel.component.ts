import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TelemetryService } from '../../../../core/services/telemetry.service';
import { IconComponent, IconName } from '../../../../shared/components/icon/icon.component';

const ICONS: Partial<Record<string, IconName>> = {
  temp: 'thermometer',
  hum: 'droplets',
};

@Component({
  selector: 'app-sensors-panel',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel h-full flex flex-col justify-between gap-4">
      <div>
        <div class="panel-title flex items-center justify-between">
          <div class="flex items-center gap-2">
            <app-icon name="wind" [size]="14" class="text-[#38BDF8]" />
            <span class="text-[#F8FAFC] font-semibold">Capteurs Météo & Aérologie</span>
          </div>
          <span class="rounded-md border border-[#1E3A5F] bg-[#0C1E3D] px-2 py-0.5 text-[10px] font-medium text-[#34D399]">En direct</span>
        </div>

        <!-- 2 Capteurs Clairs : Température et Humidité -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          @for (s of sensors(); track s.key) {
            <div class="metric-tile flex flex-col justify-between h-[72px]">
              <div class="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium tracking-[0.05em] text-[#94A3B8] uppercase">
                <app-icon [name]="icons[s.key] ?? 'activity'" [size]="12" class="text-[#38BDF8]" />{{ s.label }}
              </div>
              <div class="flex items-baseline justify-between">
                <span class="text-[18px] sm:text-[20px] font-bold text-[#F8FAFC] tabular-nums leading-tight">
                  {{ s.value }}<span class="ml-0.5 text-[12px] font-normal text-[#94A3B8]">{{ s.unit }}</span>
                </span>
                <span class="text-[10px] font-medium text-[#34D399] truncate max-w-[150px] text-right">{{ s.status }}</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Bloc Aérologie & Rose des Vents Unifiée : Simple & Facile à Expliquer -->
      <div class="rounded-xl border border-[#1E3A5F] bg-[#0C1E3D] p-3.5 shadow-sm">
        <div class="flex items-center justify-between text-[11px] font-semibold text-[#F8FAFC] border-b border-[#1E3A5F] pb-2 mb-3">
          <span class="flex items-center gap-1.5 text-[#38BDF8]">
            <app-icon name="compass" [size]="13" /> Direction & Vitesse du Vent
          </span>
          <span class="rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-bold text-[#34D399]">
            {{ wind().status }}
          </span>
        </div>

        <div class="flex items-center gap-4">
          <!-- Boussole Rose des vents SVG -->
          <div class="relative size-20 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 80 80" class="size-full">
              <circle cx="40" cy="40" r="36" fill="#112240" stroke="#1E3A5F" stroke-width="1.5" />
              <circle cx="40" cy="40" r="28" fill="none" stroke="#1E3A5F" stroke-width="1" stroke-dasharray="2 3" />
              <text x="40" y="14" text-anchor="middle" font-size="8" font-weight="bold" fill="#EF4444">N</text>
              <text x="68" y="43" text-anchor="middle" font-size="8" font-weight="bold" fill="#64748B">E</text>
              <text x="40" y="73" text-anchor="middle" font-size="8" font-weight="bold" fill="#64748B">S</text>
              <text x="12" y="43" text-anchor="middle" font-size="8" font-weight="bold" fill="#64748B">O</text>
              <!-- Flèche orientée selon la direction du vent -->
              <g [style.transform]="'rotate(' + wind().directionDeg + 'deg)'" style="transform-origin: 40px 40px; transition: transform 0.5s ease-out;">
                <polygon points="40,16 44,40 36,40" fill="#38BDF8" opacity="0.9" />
                <polygon points="40,64 43,40 37,40" fill="#64748B" opacity="0.6" />
                <circle cx="40" cy="40" r="3" fill="#F8FAFC" />
              </g>
            </svg>
          </div>

          <div class="min-w-0 flex-1 space-y-1.5 text-[11px]">
            <div>
              <span class="text-[#94A3B8] text-[10px] uppercase font-medium">Vitesse du vent</span>
              <div class="font-bold text-[#F8FAFC] text-[16px] tabular-nums">
                {{ wind().speedKmh }} <span class="text-[11px] font-normal text-[#94A3B8]">km/h</span>
              </div>
            </div>
            <div>
              <span class="text-[#94A3B8] text-[10px] uppercase font-medium">Cap & Direction</span>
              <div class="font-semibold text-[#38BDF8]">
                {{ wind().cardinal }} ({{ wind().directionDeg }}°)
              </div>
            </div>
            <div class="text-[10px] text-[#34D399] font-medium truncate">
              Conditions idéales · Vol 100% sécurisé
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
