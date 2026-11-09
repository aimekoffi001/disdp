import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationType } from '../../../core/models/models';

const DOT_COLORS: Record<NotificationType, string> = {
  success: 'bg-[#34D399]',
  error: 'bg-[#F87171]',
  warning: 'bg-[#FBBF24]',
  info: 'bg-[#38BDF8]',
};

@Component({
  selector: 'app-notification-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">
      @for (t of service.toasts(); track t.id) {
        <button
          type="button"
          class="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-[#1E3A5F] bg-[#112240] px-3.5 py-2.5 text-left text-xs shadow-2xl transition hover:bg-[#172A4D] cursor-pointer"
          (click)="service.dismiss(t.id)">
          <span class="size-2 shrink-0 rounded-full" [class]="dots[t.type]"></span>
          <span class="text-[#F8FAFC] font-semibold">{{ t.message }}</span>
        </button>
      }
    </div>
  `,
})
export class NotificationToastComponent {
  protected readonly service = inject(NotificationService);
  protected readonly dots = DOT_COLORS;
}
