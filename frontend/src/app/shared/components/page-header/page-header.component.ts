import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, timer } from 'rxjs';
import { IconComponent } from '../icon/icon.component';

const dateFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

@Component({
  selector: 'app-page-header',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
      <div class="min-w-0">
        <h1 class="text-base sm:text-lg font-bold tracking-tight text-[#F8FAFC] truncate">{{ title() }}</h1>
        @if (subtitle()) { <p class="text-[10px] sm:text-[11px] text-[#94A3B8]">{{ subtitle() }}</p> }
      </div>
      <div class="flex flex-wrap items-center gap-2 sm:gap-3">
        <ng-content />
        <div class="hidden sm:flex items-center gap-2 rounded-lg border border-[#1E3A5F] bg-[#112240] px-3 py-1.5 text-[11px] text-[#94A3B8] shadow-sm">
          <app-icon name="calendar" [size]="13" />
          <span>{{ date() }}</span>
          <span class="text-[#1E3A5F]">·</span>
          <app-icon name="clock" [size]="13" />
          <span class="font-semibold text-[#F8FAFC] tabular-nums">{{ time() }}</span>
        </div>
        <div class="sm:hidden flex items-center gap-1.5 rounded-lg border border-[#1E3A5F] bg-[#112240] px-2.5 py-1 text-[10px] text-[#94A3B8] shadow-sm">
          <app-icon name="clock" [size]="12" />
          <span class="font-semibold text-[#F8FAFC] tabular-nums">{{ time() }}</span>
        </div>
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  private readonly now = toSignal(timer(0, 1000).pipe(map(() => new Date())), { initialValue: new Date() });
  protected readonly date = computed(() => {
    const s = dateFmt.format(this.now());
    return s.charAt(0).toUpperCase() + s.slice(1);
  });
  protected readonly time = computed(() => timeFmt.format(this.now()));
}
