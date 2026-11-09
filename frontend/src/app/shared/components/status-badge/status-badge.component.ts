import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Tone } from '../../utils/labels';

/**
 * Pastilles de statut style BLEU MARINE PRO :
 * Fond teinté translucide, bordure subtile, texte lumineux et dot 6px.
 */
const TONES: Record<Tone, { bg: string; text: string; dot: string; border: string }> = {
  green: { bg: 'bg-[#10B981]/15', text: 'text-[#34D399]', dot: 'bg-[#10B981]', border: 'border-[#10B981]/30' },
  blue: { bg: 'bg-[#38BDF8]/15', text: 'text-[#38BDF8]', dot: 'bg-[#38BDF8]', border: 'border-[#38BDF8]/30' },
  amber: { bg: 'bg-[#F59E0B]/15', text: 'text-[#FBBF24]', dot: 'bg-[#F59E0B]', border: 'border-[#F59E0B]/30' },
  red: { bg: 'bg-[#EF4444]/15', text: 'text-[#F87171]', dot: 'bg-[#EF4444]', border: 'border-[#EF4444]/30' },
  gray: { bg: 'bg-[#1E3A5F]/40', text: 'text-[#94A3B8]', dot: 'bg-[#94A3B8]', border: 'border-[#1E3A5F]' },
  violet: { bg: 'bg-[#818CF8]/15', text: 'text-[#A5B4FC]', dot: 'bg-[#818CF8]', border: 'border-[#818CF8]/30' },
};

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none ' + cfg().bg + ' ' + cfg().text + ' ' + cfg().border">
      <span [class]="'size-1.5 shrink-0 rounded-full ' + cfg().dot"></span>
      <ng-content />
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly tone = input<Tone>('gray');
  protected readonly cfg = computed(() => TONES[this.tone()] ?? TONES.gray);
}
