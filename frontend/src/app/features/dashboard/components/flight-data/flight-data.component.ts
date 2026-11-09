import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DroneService } from '../../../../core/services/drone.service';
import { TelemetryService } from '../../../../core/services/telemetry.service';
import { IconComponent, IconName } from '../../../../shared/components/icon/icon.component';

interface Tile {
  icon: IconName;
  label: string;
  value: string;
  detail: string;
}

const fr = (n: number, d = 1) => n.toFixed(d).replace('.', ',');

@Component({
  selector: 'app-flight-data',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel h-full flex flex-col gap-3.5 sm:gap-4">
      <div class="panel-title flex items-center justify-between">
        <div class="flex items-center gap-2">
          <app-icon name="activity" [size]="14" class="text-[#38BDF8]" />
          <span class="text-[#F8FAFC] font-semibold">Télémétrie Simplifiée & Horizon Artificiel</span>
        </div>
        <span class="rounded-md border border-[#1E3A5F] bg-[#0C1E3D] px-2 py-0.5 text-[10px] font-medium text-[#38BDF8]">
          Temps Réel
        </span>
      </div>

      <!-- Horizon Artificiel & Indicateurs de Vol Simples -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 rounded-xl border border-[#1E3A5F] bg-[#0C1E3D] p-3.5 sm:p-4 shadow-sm">
        <!-- Cadran Horizon Artificiel SVG -->
        <div class="md:col-span-5 flex flex-col items-center justify-center">
          <div class="relative size-36 sm:size-40 rounded-full border-2 border-[#1E3A5F] overflow-hidden bg-[#112240] shadow-inner">
            <svg viewBox="0 0 160 160" class="size-full">
              <!-- Ciel & Terre inclinés selon Roulis & Tangage -->
              <g [style.transform]="'rotate(' + -(t().roll ?? 0) + 'deg) translate(0px, ' + ((t().pitch ?? 0) * 1.5) + 'px)'"
                 style="transform-origin: 80px 80px; transition: transform 0.25s ease-out;">
                <rect x="-40" y="-40" width="240" height="120" fill="#1E3A5F" />
                <line x1="-40" y1="80" x2="200" y2="80" stroke="#F8FAFC" stroke-width="2" />
                <line x1="65" y1="65" x2="95" y2="65" stroke="#94A3B8" stroke-width="1.5" />
                <line x1="70" y1="50" x2="90" y2="50" stroke="#94A3B8" stroke-width="1.5" />
                <line x1="65" y1="95" x2="95" y2="95" stroke="#94A3B8" stroke-width="1.5" />
                <line x1="70" y1="110" x2="90" y2="110" stroke="#94A3B8" stroke-width="1.5" />
                <rect x="-40" y="80" width="240" height="120" fill="#081225" />
              </g>
              <!-- Repère drone au centre -->
              <circle cx="80" cy="80" r="3" fill="#38BDF8" />
              <line x1="50" y1="80" x2="72" y2="80" stroke="#38BDF8" stroke-width="3" stroke-linecap="round" />
              <line x1="88" y1="80" x2="110" y2="80" stroke="#38BDF8" stroke-width="3" stroke-linecap="round" />
              <path d="M72,80 L80,72 L88,80" stroke="#38BDF8" stroke-width="3" fill="none" stroke-linejoin="round" />
              <polygon points="80,8 76,16 84,16" fill="#FBBF24" />
            </svg>
          </div>
          <span class="mt-2 text-[11px] font-semibold text-[#94A3B8]">Horizon Artificiel (Assiette)</span>
        </div>

        <!-- Deux Blocs Clairs & Faciles à Expliquer : Stabilité et Accélération -->
        <div class="md:col-span-7 flex flex-col justify-center space-y-3 text-[11px]">
          <!-- Bloc Stabilité Gyroscope -->
          <div class="rounded-xl border border-[#1E3A5F] bg-[#112240] p-3 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
                <app-icon name="activity" [size]="14" class="text-[#38BDF8]" /> Stabilité Gyroscope
              </span>
              <span class="rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[11px] font-extrabold text-[#34D399] tabular-nums">
                {{ t().gyro.stabilityPct.toFixed(1) }} %
              </span>
            </div>
            <p class="mt-1 text-[11px] text-[#94A3B8]">
              Compensation automatique des turbulences et maintien de l'équilibre.
            </p>
            <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#0C1E3D]">
              <div class="h-full rounded-full bg-[#34D399] transition-all duration-500" [style.width.%]="t().gyro.stabilityPct"></div>
            </div>
          </div>

          <!-- Bloc Accélération & Dynamique de Vol -->
          <div class="rounded-xl border border-[#1E3A5F] bg-[#112240] p-3 shadow-xs">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1.5 font-bold text-[#F8FAFC]">
                <app-icon name="gauge" [size]="14" class="text-[#38BDF8]" /> Accélération & Dynamique
              </span>
              <span class="rounded-full bg-[#38BDF8]/15 px-2 py-0.5 text-[11px] font-extrabold text-[#38BDF8] tabular-nums">
                {{ fr(t().accel.instantAccel, 1) }} m/s² · {{ fr(t().accel.gForce, 2) }} G
              </span>
            </div>
            <p class="mt-1 text-[11px] text-[#94A3B8]">
              Régime de propulsion fluide et régulier, sans secousses pour la charge utile.
            </p>
            <div class="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#0C1E3D]">
              <div class="h-full rounded-full bg-[#38BDF8] transition-all duration-500" [style.width.%]="Math.min(100, Math.max(10, t().accel.gForce * 50))"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Grille des 6 Tuiles Essentielles (Même Distance, Même Hauteur, Simple à Expliquer) -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        @for (t of tiles(); track t.label) {
          <div class="metric-tile flex flex-col justify-between h-[88px] sm:h-[94px]">
            <div class="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium tracking-[0.05em] text-[#94A3B8] uppercase truncate">
              <app-icon [name]="t.icon" [size]="13" class="text-[#38BDF8]" />{{ t.label }}
            </div>
            <div class="text-[14px] sm:text-[16px] font-bold text-[#F8FAFC] tabular-nums leading-tight truncate">
              {{ t.value }}
            </div>
            <div class="text-[9px] sm:text-[10px] text-[#94A3B8] truncate">
              {{ t.detail }}
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class FlightDataComponent {
  protected readonly fr = fr;
  protected readonly Math = Math;
  private readonly drone = inject(DroneService).selected;
  private readonly telemetry = inject(TelemetryService);
  protected readonly t = this.telemetry.selectedTelemetry;

  /** Les 6 métriques clés : simples, intuitives, faciles à présenter */
  protected readonly tiles = computed<Tile[]>(() => {
    const d = this.drone();
    const t = this.t();
    if (!d) return [];
    const rssi = t.rssiDbm;

    return [
      {
        icon: 'gauge',
        label: 'Vitesse de vol',
        value: `${fr(d.speed)} m/s`,
        detail: `Équivalent à ${fr(d.speed * 3.6, 0)} km/h`,
      },
      {
        icon: 'route',
        label: 'Distance parcourue',
        value: `${fr(d.distanceKm, 2)} km`,
        detail: 'Cumulée depuis le décollage',
      },
      {
        icon: 'radio',
        label: 'Portée dynamique',
        value: `${fr(d.currentRangeKm ?? 15, 1)} km`,
        detail: 'Rayon sécurisé restant',
      },
      {
        icon: 'wind',
        label: 'Vent & Aérologie',
        value: `${fr(t.wind.speedKmh, 1)} km/h`,
        detail: `Direction ${t.wind.cardinal} (${t.wind.directionDeg}°)`,
      },
      {
        icon: 'activity',
        label: 'Stabilité de vol',
        value: `${t.gyro.stabilityPct.toFixed(1)} %`,
        detail: 'Assistance gyroscopique active',
      },
      {
        icon: 'radio',
        label: 'Liaison & Contrôle',
        value: '100 % (Optimal)',
        detail: `Signal radio ${rssi ?? -64} dBm`,
      },
    ];
  });
}
