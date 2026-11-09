import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DroneService } from '../../../../core/services/drone.service';
import { StatCardComponent } from '../../../../shared/components/stat-card/stat-card.component';

const fr1 = (n: number) => n.toFixed(1).replace('.', ',');
const fr2 = (n: number) => n.toFixed(2).replace('.', ',');
const signed = (n: number, unit: string, digits = 0) => `${n >= 0 ? '↑ +' : '↓ '}${digits ? fr1(n) : Math.round(n)}${unit}`;

@Component({
  selector: 'app-statistics',
  imports: [StatCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      <app-stat-card icon="battery" accent="green" label="Batterie moyenne" [value]="battery()" unit="%" [trend]="batteryTrend()" [progress]="batteryPct()" />
      <app-stat-card icon="route" accent="blue" label="Distance parcourue" [value]="distance()" unit="km" [trend]="distanceTrend()" [progress]="distancePct()" />
      <app-stat-card icon="gauge" accent="violet" label="Vitesse moyenne" [value]="speed()" unit="m/s" [trend]="speedTrend()" [progress]="speedPct()" />
      <app-stat-card icon="radio" accent="cyan" label="Portée maximale" [value]="maxRange()" unit="km" [trend]="maxRangeTrend()" [progress]="maxRangePct()" />
    </div>
  `,
})
export class StatisticsComponent {
  protected readonly drones = inject(DroneService);
  protected readonly battery = computed(() => fr1(this.drones.averageBattery()));
  protected readonly batteryPct = computed(() => Math.round(this.drones.averageBattery()));
  
  protected readonly distance = computed(() => fr2(this.drones.totalDistanceKm()));
  protected readonly distancePct = computed(() => Math.min(100, Math.max(5, Math.round((this.drones.totalDistanceKm() / 15) * 100))));
  
  protected readonly speed = computed(() => fr1(this.drones.averageSpeed()));
  protected readonly speedPct = computed(() => Math.min(100, Math.max(5, Math.round((this.drones.averageSpeed() / 15) * 100))));
  
  protected readonly maxRange = computed(() => fr1(this.drones.effectiveMaxRangeKm()));
  protected readonly maxRangePct = computed(() => {
    const nominal = this.drones.selected()?.maxRangeKm ?? 16;
    return Math.min(100, Math.max(5, Math.round((this.drones.effectiveMaxRangeKm() / nominal) * 100)));
  });

  // Tendances calculées automatiquement en temps réel
  protected readonly batteryTrend = computed(() => signed(this.drones.averageBattery() - this.drones.previous.battery, '%'));
  protected readonly distanceTrend = computed(() => signed(this.drones.totalDistanceKm() - this.drones.previous.distanceKm, ' km', 1));
  protected readonly speedTrend = computed(() => {
    const prev = this.drones.previous.speed;
    return signed(((this.drones.averageSpeed() - prev) / (prev || 1)) * 100, '%');
  });
  protected readonly maxRangeTrend = computed(() => {
    const nominal = this.drones.selected()?.maxRangeKm ?? 16;
    return signed(this.drones.effectiveMaxRangeKm() - nominal, ' km', 1);
  });
}
