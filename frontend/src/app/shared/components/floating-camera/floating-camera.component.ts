import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { APP_SETTINGS } from '../../../core/config/app-settings';
import { DroneService } from '../../../core/services/drone.service';
import { TelemetryService } from '../../../core/services/telemetry.service';
import { UiService } from '../../../core/services/ui.service';
import { IconComponent } from '../icon/icon.component';

interface Position {
  x: number;
  y: number;
}

@Component({
  selector: 'app-floating-camera',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ui.floatingCameraOpen()) {
      <!-- Fenêtre flottante (PiP) déplaçable librement sur l'ensemble de l'écran -->
      <div #windowRef
           [class]="'fixed z-[999] rounded-2xl border border-[#1E3A5F] bg-[#0A192F]/95 backdrop-blur-md overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none ' + 
                   (minimized() ? 'w-72' : 'w-[320px] sm:w-[390px] max-w-[calc(100vw-1rem)]') +
                   (isDragging() 
                     ? ' cursor-grabbing shadow-[0_25px_60px_rgba(2,12,27,0.95)] ring-2 ring-[#38BDF8]' 
                     : ' shadow-2xl transition-[box-shadow,ring] duration-200 hover:border-[#38BDF8]/60')"
           [style.left.px]="pos().x"
           [style.top.px]="pos().y"
           (pointerdown)="onPointerDown($event)"
           (dblclick)="resetPosition()"
           title="Cliquez et glissez n'importe où pour déplacer sur tout l'écran · Double-clic pour réinitialiser">
        
        <!-- Barre de titre de la Caméra du Drone -->
        <div class="flex items-center justify-between border-b border-[#1E3A5F] bg-[#112240] px-3 py-2.5">
          <div class="flex items-center gap-2 min-w-0 pointer-events-none">
            <!-- Poignée tactile de déplacement -->
            <svg class="size-3.5 text-[#38BDF8] shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="8" cy="5" r="2"/><circle cx="16" cy="5" r="2"/>
              <circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/>
              <circle cx="8" cy="19" r="2"/><circle cx="16" cy="19" r="2"/>
            </svg>
            <span class="flex size-2 rounded-full bg-[#EF4444] animate-pulse shrink-0"></span>
            <span class="text-xs font-bold text-[#F8FAFC] truncate">Caméra Drone · {{ drone().name }}</span>
          </div>

          <!-- Boutons d'action (pointerdown stoppé pour ne pas interférer avec le clic) -->
          <div class="flex items-center gap-1 shrink-0" (pointerdown)="$event.stopPropagation()">
            <button type="button" 
                    (click)="toggleMinimize()"
                    class="icon-btn !size-6 text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
                    [title]="minimized() ? 'Agrandir la fenêtre' : 'Minimiser la fenêtre'">
              <app-icon [name]="minimized() ? 'maximize' : 'chevron'" [size]="12" />
            </button>
            <button type="button" 
                    (click)="ui.closeFloatingCamera()"
                    class="icon-btn !size-6 text-[#94A3B8] hover:text-[#F87171] cursor-pointer"
                    title="Fermer la caméra flottante">
              <app-icon name="x" [size]="12" />
            </button>
          </div>
        </div>

        @if (!minimized()) {
          <!-- Zone d'affichage vidéo du drone -->
          <div class="relative aspect-video w-full bg-[#081225] overflow-hidden">
            <video #videoElement
                   class="absolute inset-0 size-full object-cover pointer-events-none"
                   autoplay
                   muted
                   loop
                   playsinline
                   [attr.src]="demoVideoUrl"></video>

            <!-- Réticule HUD tactique -->
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div class="relative size-16 sm:size-20 border border-[#38BDF8]/40 rounded-lg">
                <div class="absolute -top-1 -left-1 size-2 border-t border-l border-[#38BDF8]"></div>
                <div class="absolute -top-1 -right-1 size-2 border-t border-r border-[#38BDF8]"></div>
                <div class="absolute -bottom-1 -left-1 size-2 border-b border-l border-[#38BDF8]"></div>
                <div class="absolute -bottom-1 -right-1 size-2 border-b border-r border-[#38BDF8]"></div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="size-1 rounded-full bg-[#38BDF8]"></div>
                </div>
              </div>
            </div>

            <!-- Badges incrustés : Flux Caméra Drone & Batterie -->
            <div class="absolute top-2 left-2 flex items-center gap-1.5 z-10 text-[9px] font-bold pointer-events-none">
              <span class="rounded bg-[#0A192F]/85 px-1.5 py-0.5 text-[#34D399] border border-[#1E3A5F] flex items-center gap-1">
                <span class="size-1.5 rounded-full bg-[#34D399] animate-pulse"></span>
                DIRECT 4K
              </span>
              <span class="rounded bg-[#0A192F]/85 px-1.5 py-0.5 text-[#38BDF8] border border-[#1E3A5F]">
                {{ drone().batteryLevel.toFixed(0) }}%
              </span>
            </div>

            <div class="absolute top-2 right-2 rounded bg-[#0A192F]/85 px-1.5 py-0.5 text-[8px] text-[#94A3B8] border border-[#1E3A5F] pointer-events-none">
              Glisser pour déplacer
            </div>

            <!-- Télémétrie simplifiée en surimpression basse (Vitesse, Vent, Stabilité) -->
            <div class="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-1.5 border-t border-[#1E3A5F]/80 bg-[#0A192F]/90 px-2.5 py-1 text-[9px] text-[#94A3B8] backdrop-blur-xs pointer-events-none">
              <span class="flex items-center gap-1 text-[#F8FAFC]">
                <app-icon name="gauge" [size]="10" class="text-[#38BDF8]" />
                <span>Vit : <b>{{ drone().speed.toFixed(1) }} m/s</b></span>
              </span>
              <span class="flex items-center gap-1 text-[#34D399]">
                <app-icon name="wind" [size]="10" />
                <span>Vent : <b>{{ t().wind.speedKmh.toFixed(0) }} km/h ({{ t().wind.cardinal }})</b></span>
              </span>
              <span class="flex items-center gap-1 text-[#38BDF8]">
                <app-icon name="activity" [size]="10" />
                <span>Stabilité : <b>{{ t().gyro.stabilityPct.toFixed(0) }}%</b></span>
              </span>
            </div>
          </div>
        } @else {
          <!-- Mode compact minimisé -->
          <div class="flex items-center justify-between p-2.5 text-[10px] text-[#94A3B8] pointer-events-none">
            <span class="flex items-center gap-1 text-[#F8FAFC] font-semibold">
              <app-icon name="video" [size]="11" class="text-[#38BDF8]" />
              <span>Direct Drone 4K</span>
            </span>
            <span>Vit : <b class="text-[#F8FAFC]">{{ drone().speed.toFixed(1) }} m/s</b></span>
            <span>Bat : <b class="text-[#34D399]">{{ drone().batteryLevel.toFixed(0) }}%</b></span>
          </div>
        }
      </div>
    }
  `,
})
export class FloatingCameraComponent implements OnInit {
  @ViewChild('windowRef') windowRef?: ElementRef<HTMLDivElement>;
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;

  protected readonly ui = inject(UiService);
  private readonly drones = inject(DroneService);
  private readonly telemetry = inject(TelemetryService);

  protected readonly drone = this.drones.selected;
  protected readonly t = this.telemetry.selectedTelemetry;
  protected readonly minimized = signal<boolean>(false);
  protected readonly demoVideoUrl = APP_SETTINGS.demoVideoSources[0];

  /** Coordonnées (x, y) de la fenêtre flottante sur l'ensemble de l'écran */
  protected readonly pos = signal<Position>({ x: 20, y: 20 });
  protected readonly isDragging = signal<boolean>(false);

  private dragOffset = { x: 0, y: 0 };

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.pos.set(this.getDefaultPosition());
    }
  }

  /** Position initiale par défaut : en bas à droite */
  private getDefaultPosition(): Position {
    if (typeof window === 'undefined') return { x: 20, y: 20 };
    const width = this.minimized() ? 288 : Math.min(390, window.innerWidth - 32);
    const height = this.minimized() ? 48 : 290;
    const x = Math.max(16, window.innerWidth - width - 24);
    const y = Math.max(16, window.innerHeight - height - 24);
    return { x, y };
  }

  /** Réinitialisation de la position en bas à droite */
  resetPosition(): void {
    this.pos.set(this.getDefaultPosition());
  }

  /** Basculer entre vue normale et vue minimisée */
  toggleMinimize(): void {
    this.minimized.update((v) => !v);
    setTimeout(() => this.clampToViewport(), 50);
  }

  /** Début du déplacement sur l'ensemble de l'écran */
  onPointerDown(ev: PointerEvent): void {
    if (ev.button !== 0) return;
    const target = ev.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input')) return;

    this.isDragging.set(true);
    const current = this.pos();
    this.dragOffset = {
      x: ev.clientX - current.x,
      y: ev.clientY - current.y,
    };
  }

  /** Déplacement fluide à l'échelle de toute la fenêtre du navigateur */
  @HostListener('window:pointermove', ['$event'])
  onWindowPointerMove(ev: PointerEvent): void {
    if (!this.isDragging()) return;
    ev.preventDefault();

    const width = this.windowRef?.nativeElement?.offsetWidth ?? (this.minimized() ? 288 : 390);
    const height = this.windowRef?.nativeElement?.offsetHeight ?? (this.minimized() ? 48 : 290);

    const maxX = Math.max(0, window.innerWidth - width);
    const maxY = Math.max(0, window.innerHeight - height);

    const newX = Math.max(0, Math.min(maxX, ev.clientX - this.dragOffset.x));
    const newY = Math.max(0, Math.min(maxY, ev.clientY - this.dragOffset.y));

    this.pos.set({ x: newX, y: newY });
  }

  /** Fin du déplacement dès relâchement du pointeur */
  @HostListener('window:pointerup')
  @HostListener('window:pointercancel')
  onWindowPointerUp(): void {
    if (this.isDragging()) {
      this.isDragging.set(false);
    }
  }

  /** Maintien de la fenêtre à l'intérieur de l'écran lors du redimensionnement */
  @HostListener('window:resize')
  clampToViewport(): void {
    if (typeof window === 'undefined') return;
    const current = this.pos();
    const width = this.windowRef?.nativeElement?.offsetWidth ?? (this.minimized() ? 288 : 390);
    const height = this.windowRef?.nativeElement?.offsetHeight ?? (this.minimized() ? 48 : 290);

    const maxX = Math.max(0, window.innerWidth - width);
    const maxY = Math.max(0, window.innerHeight - height);

    this.pos.set({
      x: Math.max(0, Math.min(maxX, current.x)),
      y: Math.max(0, Math.min(maxY, current.y)),
    });
  }
}
