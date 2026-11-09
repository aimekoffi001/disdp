import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent, IconName } from '../icon/icon.component';

type Accent = 'green' | 'blue' | 'violet' | 'cyan';

const ICON_COLORS: Record<Accent, string> = {
  green: '#34D399',
  blue: '#38BDF8',
  violet: '#A5B4FC',
  cyan: '#38BDF8',
};

@Component({
  selector: 'app-stat-card',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative flex flex-col justify-between h-[124px] overflow-hidden rounded-[12px] border border-[#1E3A5F] bg-[#112240] p-3.5 shadow-[0_4px_12px_rgba(2,12,27,0.4)] transition hover:shadow-lg hover:border-[#38BDF8]/40">
      <!-- En-tête : Icône pro + tendance discrète -->
      <div class="flex items-center justify-between gap-1">
        <span class="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[#1E3A5F] bg-[#0C1E3D]" [style.color]="iconColor()">
          <app-icon [name]="icon()" [size]="16" />
        </span>
        @if (trend()) {
          <span class="rounded-md border border-[#1E3A5F] bg-[#0C1E3D] px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium text-[#94A3B8] truncate max-w-[85px] text-right">{{ trend() }}</span>
        }
      </div>

      <!-- Label & Valeur principale : espacement rigoureusement uniforme -->
      <div>
        <div class="truncate text-[10px] sm:text-[11px] font-medium tracking-[0.05em] text-[#94A3B8] uppercase" [title]="label()">{{ label() }}</div>
        <div class="flex items-baseline gap-1 mt-0.5">
          <span class="text-[20px] sm:text-[24px] font-bold tracking-tight text-[#F8FAFC] tabular-nums leading-tight truncate">{{ value() }}</span>
          @if (unit()) {
            <span class="text-[12px] sm:text-[13px] font-medium text-[#94A3B8]">{{ unit() }}</span>
          }
        </div>
      </div>

      <!-- Barre de progression uniforme 3px -->
      <div class="h-[3px] w-full overflow-hidden rounded-full bg-[#1E3A5F]">
        <div class="h-full rounded-full transition-all duration-700" [style.background-color]="iconColor()" [style.width.%]="progress() ?? 100"></div>
      </div>
    </div>
  `,
})
export class StatCardComponent {
  readonly icon = input.required<IconName>();
  readonly accent = input<Accent>('blue');
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly unit = input('');
  readonly trend = input<string | null>(null);
  readonly progress = input<number | null>(null);

  protected readonly iconColor = computed(() => ICON_COLORS[this.accent()] ?? ICON_COLORS.blue);
}
