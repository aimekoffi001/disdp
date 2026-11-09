import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-modal',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-[#020C1B]/80 backdrop-blur-xs p-3 sm:p-4" (click)="closed.emit()" role="presentation">
      <div
        class="max-h-[92dvh] w-full overflow-y-auto rounded-xl border border-[#1E3A5F] bg-[#112240] p-4 sm:p-5 shadow-2xl"
        [style.max-width.px]="width()"
        role="dialog" aria-modal="true" [attr.aria-label]="title()"
        (click)="$event.stopPropagation()">
        <div class="mb-4 flex items-center justify-between border-b border-[#1E3A5F] pb-3">
          <h2 class="text-sm font-bold text-[#F8FAFC]">{{ title() }}</h2>
          <button type="button" class="icon-btn !size-8" aria-label="Fermer" (click)="closed.emit()"><app-icon name="x" [size]="16" /></button>
        </div>
        <ng-content />
      </div>
    </div>
  `,
})
export class ModalComponent {
  readonly title = input.required<string>();
  readonly width = input(460);
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }
}
