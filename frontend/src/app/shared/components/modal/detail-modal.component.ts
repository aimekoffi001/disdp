import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiService } from '../../../core/services/ui.service';
import { ModalComponent } from './modal.component';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';

@Component({
  selector: 'app-detail-modal',
  imports: [ModalComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ui.detail(); as d) {
      <app-modal [title]="d.title" (closed)="ui.detail.set(null)">
        <dl class="divide-y divide-[#1E3A5F] text-xs">
          @for (r of d.rows; track r.label) {
            <div class="flex items-center justify-between gap-3 py-2">
              <dt class="text-[#94A3B8] font-medium">{{ r.label }}</dt>
              <dd class="text-right text-[#F8FAFC] font-semibold">
                @if (r.tone) { <app-status-badge [tone]="r.tone">{{ r.value }}</app-status-badge> } @else { {{ r.value }} }
              </dd>
            </div>
          }
        </dl>
        @if (d.actions?.length) {
          <div class="mt-4 flex flex-wrap justify-end gap-2 border-t border-[#1E3A5F] pt-3">
            @for (a of d.actions; track a.label) {
              <button type="button" class="btn-pill" (click)="a.run()">{{ a.label }}</button>
            }
          </div>
        }
      </app-modal>
    }
    @if (ui.confirmRequest(); as c) {
      <app-modal title="Confirmation" [width]="380" (closed)="ui.confirmRequest.set(null)">
        <p class="text-xs text-[#F8FAFC] font-medium">{{ c.message }}</p>
        <div class="mt-4 flex justify-end gap-2 border-t border-[#1E3A5F] pt-3">
          <button type="button" class="btn-ghost" (click)="ui.confirmRequest.set(null)">Annuler</button>
          <button type="button" class="btn-pill !bg-[#EF4444] hover:!bg-[#DC2626]" (click)="confirm()">{{ c.confirmLabel }}</button>
        </div>
      </app-modal>
    }
  `,
})
export class DetailModalComponent {
  protected readonly ui = inject(UiService);
  protected confirm(): void {
    const c = this.ui.confirmRequest();
    this.ui.confirmRequest.set(null);
    c?.onConfirm();
  }
}
