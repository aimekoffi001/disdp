import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DroneService } from '../../../../core/services/drone.service';
import { TelemetryService } from '../../../../core/services/telemetry.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

// Palette BLEU MARINE PRO
const LIGNE = '#1E3A5F';
const BLEU = '#38BDF8';
const ORANGE = '#F59E0B';
const GAZ_MIN = 1000;
const MOTEUR_MAX = 2000;
/** Positions des moteurs dans la vue 380 × 380 : AVG, AVD, ARD, ARG. */
const POSITIONS = [{ x: 100, y: 115 }, { x: 280, y: 115 }, { x: 280, y: 295 }, { x: 100, y: 295 }];
const NOMS = ['AVG', 'AVD', 'ARD', 'ARG'];
const LIBELLES = ['avant gauche', 'avant droit', 'arrière droit', 'arrière gauche'];
const SENS = ['↻', '↺', '↻', '↺'];

function melange(a: string, b: string, k: number): string {
  const ca = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const cb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + ca.map((x, i) => Math.round(x + (cb[i] - x) * k).toString(16).padStart(2, '0')).join('');
}

/** Ligne discrète à l'arrêt, puis cyan vers ambre à plein régime. */
function couleurMoteur(us: number): string {
  return us <= GAZ_MIN ? LIGNE : melange(BLEU, ORANGE, (us - GAZ_MIN) / (MOTEUR_MAX - GAZ_MIN));
}

@Component({
  selector: 'app-motors-panel',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <div class="panel-title flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <app-icon name="cog" [size]="14" class="text-[#38BDF8]" />
          <span class="text-[#F8FAFC] font-semibold">Moteurs & Hélices</span>
          <button type="button"
                  (click)="toggleSpin()"
                  [class]="'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer border shadow-sm ' + (isSpinning() ? 'border-[#38BDF8] bg-[#172A4D] text-[#38BDF8]' : 'border-[#1E3A5F] bg-[#0C1E3D] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172A4D]')">
            <span class="size-1.5 rounded-full" [style.background-color]="isSpinning() ? '#38BDF8' : '#64748B'"></span>
            <app-icon [name]="isSpinning() ? 'pause' : 'play'" [size]="11" />
            <span>{{ isSpinning() ? 'Rotation' : 'Faire tourner' }}</span><span class="hidden sm:inline">{{ isSpinning() ? ' active' : ' les roues' }}</span>
          </button>
        </div>
        <span class="text-[10px] font-medium text-[#64748B] normal-case">PWM · 1000–2000 µs</span>
      </div>

      <svg viewBox="0 0 380 392" class="mx-auto block w-full max-w-[310px] sm:max-w-[380px]" role="img" aria-label="Vue de dessus du drone et rotation des quatre roues moteurs">
        <!-- Flèche repère avant bleu #38BDF8 -->
        <path d="M190 14 L202 34 L178 34 Z" fill="#38BDF8" opacity="0.9" />
        <text x="190" y="52" text-anchor="middle" font-size="9" font-weight="700" letter-spacing="2" fill="#64748B">AVANT</text>

        <!-- Bras et châssis principal -->
        @for (m of motors(); track m.nom) {
          <line x1="190" y1="205" [attr.x2]="m.x" [attr.y2]="m.y" stroke="#1E3A5F" stroke-width="12" stroke-linecap="round" />
          <line x1="190" y1="205" [attr.x2]="m.x" [attr.y2]="m.y" [attr.stroke]="m.couleur" stroke-opacity=".35" stroke-width="3" stroke-linecap="round" />
        }
        <!-- Lignes diagonales asynchrones de couplage (pointillés fins) -->
        <line x1="100" y1="115" x2="280" y2="295" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="4,4" stroke-opacity="0.35" />
        <line x1="280" y1="115" x2="100" y2="295" stroke="#34D399" stroke-width="1.5" stroke-dasharray="4,4" stroke-opacity="0.35" />
        <rect x="150" y="160" width="80" height="90" rx="16" fill="#0C1E3D" stroke="#1E3A5F" stroke-width="1.5" />
        <rect x="166" y="178" width="48" height="54" rx="10" fill="#112240" stroke="#1E3A5F" />
        <circle cx="190" cy="205" r="5" [attr.fill]="actif() ? '#34D399' : '#1E3A5F'" />

        <!-- Moteurs & rotors tournants -->
        @for (m of motors(); track m.nom) {
          <g>
            <title>Moteur {{ m.libelle }} — {{ m.pwm }} µs ({{ m.pct }} %)</title>
            <!-- Cage extérieure du stator -->
            <circle [attr.cx]="m.x" [attr.cy]="m.y" r="52" fill="#112240" [attr.stroke]="m.couleur" stroke-width="2.5" />
            @if (m.tourne) {
              <circle [attr.cx]="m.x" [attr.cy]="m.y" r="52" fill="none" [attr.stroke]="m.couleur" stroke-opacity=".2" stroke-width="8" />
            }

            <!-- Roue / Rotor en rotation continue avec transform-origin explicite -->
            <g [attr.class]="m.tourne ? 'rotor ' + m.rotation : ''"
               [style.transform-origin]="m.x + 'px ' + m.y + 'px'"
               [style.animation-duration.s]="m.duree">
              @if (m.tourne) {
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  [attr.from]="(m.sens === '↻' ? '0 ' : '360 ') + m.x + ' ' + m.y"
                  [attr.to]="(m.sens === '↻' ? '360 ' : '0 ') + m.x + ' ' + m.y"
                  [attr.dur]="m.duree + 's'"
                  repeatCount="indefinite" />
              }
              <!-- Couronne dentée / rayons de turbine -->
              <circle [attr.cx]="m.x" [attr.cy]="m.y" r="44" fill="none" [attr.stroke]="m.couleur" [attr.stroke-opacity]="m.tourne ? '.35' : '.15'" stroke-width="1.5" stroke-dasharray="6,4" />
              <!-- Pales d'hélice principales -->
              <ellipse [attr.cx]="m.x" [attr.cy]="m.y" rx="46" ry="6" [attr.fill]="m.couleur" [attr.fill-opacity]="m.tourne ? '.90' : '.40'" />
              <ellipse [attr.cx]="m.x" [attr.cy]="m.y" rx="6" ry="46" [attr.fill]="m.couleur" [attr.fill-opacity]="m.tourne ? '.75' : '.30'" />
              <!-- Rayons secondaires de la roue -->
              <circle [attr.cx]="m.x" [attr.cy]="m.y" r="28" fill="none" [attr.stroke]="m.couleur" [attr.stroke-opacity]="m.tourne ? '.5' : '.2'" stroke-width="1.5" stroke-dasharray="5,3" />
            </g>

            <!-- Moyeu central fixe avec indicateur de sens -->
            <circle [attr.cx]="m.x" [attr.cy]="m.y" r="13" fill="#112240" stroke="#1E3A5F" stroke-width="1.5" />
            <text [attr.x]="m.x" [attr.y]="m.y + 4" text-anchor="middle" font-size="13" font-weight="700" fill="#F8FAFC">{{ m.sens }}</text>

            <!-- Libellés du moteur -->
            <text [attr.x]="m.x" [attr.y]="m.yNom" text-anchor="middle" font-size="12" font-weight="700" fill="#F8FAFC">{{ m.nom }}</text>
            <text [attr.x]="m.x" [attr.y]="m.yValeur" text-anchor="middle" font-size="11" font-weight="600" [attr.fill]="m.tourne ? m.couleur : '#94A3B8'" font-family="Consolas, ui-monospace, monospace">{{ m.pwm }} µs</text>
          </g>
        }
      </svg>

      <div class="mt-2 flex items-center gap-2 text-[10px] text-[#94A3B8]">
        <span>Arrêt (1000 µs)</span>
        <span class="h-[3px] flex-1 rounded-full bg-[#1E3A5F]">
          <span class="block h-full rounded-full" style="background: linear-gradient(90deg, #1E3A5F, #38BDF8 50%, #F59E0B)"></span>
        </span>
        <span>Plein gaz (2000 µs)</span>
      </div>

      <!-- Indicateurs temps réel des paires diagonales asynchrones -->
      <div class="mt-2.5 grid grid-cols-2 gap-2 text-[10px]">
        <div class="flex items-center justify-between rounded-lg border border-[#38BDF8]/30 bg-[#0C1E3D] px-2.5 py-1.5 shadow-sm">
          <div class="flex items-center gap-1.5">
            <span class="size-2 rounded-full bg-[#38BDF8]"></span>
            <span class="font-medium text-[#94A3B8]">Diag. 1 <span class="hidden xs:inline">(AVG & ARD)</span></span>
          </div>
          <span class="font-bold text-[#F8FAFC] tabular-nums font-mono">{{ motors()[0].pwm }} µs ({{ motors()[0].pct }}%)</span>
        </div>
        <div class="flex items-center justify-between rounded-lg border border-[#34D399]/30 bg-[#0C1E3D] px-2.5 py-1.5 shadow-sm">
          <div class="flex items-center gap-1.5">
            <span class="size-2 rounded-full bg-[#34D399]"></span>
            <span class="font-medium text-[#94A3B8]">Diag. 2 <span class="hidden xs:inline">(AVD & ARG)</span></span>
          </div>
          <span class="font-bold text-[#F8FAFC] tabular-nums font-mono">{{ motors()[1].pwm }} µs ({{ motors()[1].pct }}%)</span>
        </div>
      </div>
      <div class="mt-1 flex items-center justify-center gap-1.5 text-[9px] text-[#94A3B8]">
        <app-icon name="activity" [size]="10" class="text-[#38BDF8]" />
        <span>Régulation asynchrone par paires diagonales (AVG = ARD · AVD = ARG)</span>
      </div>
    </section>
  `,
})
export class MotorsPanelComponent {
  private readonly telemetry = inject(TelemetryService).selectedTelemetry;
  private readonly droneService = inject(DroneService);

  /** Déclenchement manuel ou lié à l'état de vol */
  protected readonly manualSpin = signal<boolean>(false);
  protected readonly isFlying = computed(() => this.droneService.selected()?.status === 'in-flight');
  protected readonly isSpinning = computed(() => this.manualSpin() || this.isFlying());

  toggleSpin(): void {
    this.manualSpin.update((v) => !v);
  }

  protected readonly motors = computed(() => {
    const raw = this.telemetry().motors;
    const flying = this.isFlying();
    const spinning = this.isSpinning();

    // Règle formelle : les deux moteurs en diagonale doivent avoir EXACTEMENT la même valeur
    // Diagonale 1 : AVG (index 0) et ARD (index 2)
    // Diagonale 2 : AVD (index 1) et ARG (index 3)
    let diag1Pwm = GAZ_MIN;
    let diag2Pwm = GAZ_MIN;

    if (flying && raw.length === 4) {
      diag1Pwm = raw[0].pwm;
      diag2Pwm = raw[1].pwm;
    } else if (spinning) {
      diag1Pwm = 1580;
      diag2Pwm = 1490;
    }

    return [0, 1, 2, 3].map((i) => {
      const { x, y } = POSITIONS[i] ?? POSITIONS[0];
      const haut = y < 190;
      const isDiag1 = i === 0 || i === 2;
      const effectivePwm = isDiag1 ? diag1Pwm : diag2Pwm;
      const tourne = spinning || effectivePwm > GAZ_MIN;

      return {
        nom: NOMS[i] ?? `M${i + 1}`,
        libelle: LIBELLES[i] ?? '',
        x, y,
        pwm: effectivePwm,
        pct: Math.round(((effectivePwm - GAZ_MIN) / (MOTEUR_MAX - GAZ_MIN)) * 100),
        couleur: couleurMoteur(effectivePwm),
        sens: SENS[i] ?? '↻',
        rotation: (SENS[i] ?? '↻') === '↻' ? 'rotor-cw' : 'rotor-ccw',
        tourne,
        duree: Math.max(0.18, 0.85 - ((effectivePwm - GAZ_MIN) / (MOTEUR_MAX - GAZ_MIN)) * 0.7),
        yNom: haut ? y - 70 : y + 76,
        yValeur: haut ? y - 56 : y + 90,
      };
    });
  });

  protected readonly actif = computed(() => this.isSpinning() || this.motors().some((m) => m.pwm > GAZ_MIN));
}
