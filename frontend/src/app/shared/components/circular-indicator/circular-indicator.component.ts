import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-circular-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative inline-flex items-center justify-center' },
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 100 100" class="-rotate-90">
      <!-- Piste de fond bleu marine #1E3A5F -->
      <circle cx="50" cy="50" r="42" fill="none" stroke="#1E3A5F" stroke-width="7" />
      <!-- Piste active pro -->
      <circle
        cx="50" cy="50" r="42" fill="none" [attr.stroke]="color()" stroke-width="7" stroke-linecap="round"
        [attr.stroke-dasharray]="circumference" [attr.stroke-dashoffset]="offset()"
        style="transition: stroke-dashoffset .6s cubic-bezier(0.16, 1, 0.3, 1), stroke .3s ease" />
    </svg>
    <div class="absolute inset-0 flex flex-col items-center justify-center leading-none">
      <ng-content />
    </div>
  `,
})
export class CircularIndicatorComponent {
  readonly value = input.required<number>();
  readonly size = input(88);
  protected readonly circumference = 2 * Math.PI * 42;
  protected readonly offset = computed(() => this.circumference * (1 - Math.min(100, Math.max(0, this.value())) / 100));
  protected readonly color = computed(() =>
    this.value() >= 50 ? '#34D399' : this.value() >= 25 ? '#FBBF24' : '#F87171',
  );
}
