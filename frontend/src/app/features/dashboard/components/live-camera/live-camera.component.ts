import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { APP_SETTINGS } from '../../../../core/config/app-settings';
import { DroneService } from '../../../../core/services/drone.service';
import { UiService } from '../../../../core/services/ui.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-live-camera',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel h-full flex flex-col">
      <!-- En-tête : Indication explicite de la Caméra du Drone -->
      <div class="panel-title flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <app-icon name="video" [size]="15" class="text-[#38BDF8] shrink-0" />
          <span class="truncate text-[#F8FAFC] font-semibold">Caméra du Drone — {{ drone()?.name ?? 'Aucun drone' }}</span>
          <span class="rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-semibold text-[#34D399] border border-[#10B981]/30 flex items-center gap-1.5 shadow-xs">
            <span class="size-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
            Capteur Optique 4K
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="ui.toggleFloatingCamera()"
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#1E3A5F] bg-[#0C1E3D] px-2.5 py-1 text-[11px] font-semibold text-[#94A3B8] transition hover:border-[#38BDF8] hover:bg-[#172A4D] hover:text-[#38BDF8] cursor-pointer shadow-sm"
            title="Détacher en fenêtre flottante déplaçable (PiP)">
            <app-icon name="maximize" [size]="12" />
            <span class="hidden sm:inline">Caméra </span>Flottante
          </button>
        </div>
      </div>

      <!-- Cadre Vidéo de la Caméra Embarquée du Drone -->
      <div #box class="relative aspect-video w-full overflow-hidden rounded-xl border border-[#1E3A5F] bg-[#0A192F] flex-1">
        <!-- Fond graphique bleu marine -->
        <div class="absolute inset-0 bg-[#0A192F]"></div>

        <!-- Flux vidéo réel du drone -->
        <video
          #videoPlayer
          class="absolute inset-0 size-full object-cover"
          autoplay
          muted
          loop
          playsinline
          [attr.src]="currentSrc()"
          (playing)="playing.set(true)"
          (error)="onError()"></video>

        <!-- Badges d'état de la caméra du drone -->
        <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span class="flex items-center gap-1 rounded-full border border-[#EF4444]/40 bg-[#0A192F]/90 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-[#F87171] shadow-xs backdrop-blur-xs">
            <span class="size-1.5 rounded-full bg-[#EF4444] animate-pulse"></span>DIRECT DRONE
          </span>
          <span class="rounded-full border border-[#1E3A5F] bg-[#0A192F]/90 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-[#38BDF8] shadow-xs backdrop-blur-xs">
            4K UHD · 60 FPS
          </span>
        </div>

        <div class="absolute top-2.5 right-2.5 rounded-full border border-[#1E3A5F] bg-[#0A192F]/90 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-medium text-[#94A3B8] shadow-xs z-10 backdrop-blur-xs">
          Capteur Sony Exmor · Zoom 30x
        </div>

        <!-- Réticule HUD de ciblage tactique embarqué -->
        <div class="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div class="relative size-24 sm:size-32 border border-[#38BDF8]/40 rounded-lg">
            <div class="absolute -top-1 -left-1 size-2.5 sm:size-3 border-t-2 border-l-2 border-[#38BDF8]"></div>
            <div class="absolute -top-1 -right-1 size-2.5 sm:size-3 border-t-2 border-r-2 border-[#38BDF8]"></div>
            <div class="absolute -bottom-1 -left-1 size-2.5 sm:size-3 border-b-2 border-l-2 border-[#38BDF8]"></div>
            <div class="absolute -bottom-1 -right-1 size-2.5 sm:size-3 border-b-2 border-r-2 border-[#38BDF8]"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="size-1.5 rounded-full bg-[#38BDF8]"></div>
            </div>
            <span class="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] sm:text-[9px] font-mono font-bold tracking-widest text-[#38BDF8] uppercase bg-[#0A192F]/95 border border-[#1E3A5F] px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap">
              CAMÉRA EMBARQUÉE DRONE
            </span>
          </div>
        </div>

        <!-- Bandeau Télémétrie simplifié : Vitesse, Batterie, Signal Radio (sans latitude/longitude/altitude) -->
        <div class="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-1.5 sm:gap-2 border-t border-[#1E3A5F] bg-[#0A192F]/95 px-2.5 py-1.5 text-[9px] sm:text-[10px] text-[#94A3B8] shadow-md z-10 backdrop-blur-xs">
          <span class="flex items-center gap-1 rounded-md border border-[#1E3A5F] bg-[#0C1E3D] px-2 py-0.5">
            <app-icon name="gauge" [size]="11" class="text-[#38BDF8]" />
            <span>Vitesse :</span>
            <span class="font-bold text-[#F8FAFC] tabular-nums">{{ speed() }} m/s</span>
          </span>
          <span class="flex items-center gap-1 rounded-md border border-[#1E3A5F] bg-[#0C1E3D] px-2 py-0.5">
            <app-icon name="battery" [size]="11" class="text-[#34D399]" />
            <span>Batterie :</span>
            <span class="font-bold text-[#34D399] tabular-nums">{{ (drone()?.batteryLevel ?? 0).toFixed(0) }}%</span>
          </span>
          <span class="hidden sm:flex items-center gap-1 rounded-md border border-[#1E3A5F] bg-[#0C1E3D] px-2 py-0.5">
            <app-icon name="radio" [size]="11" class="text-[#38BDF8]" />
            <span>Liaison :</span>
            <span class="font-bold text-[#F8FAFC]">100 % (Optimal)</span>
          </span>
          <button
            type="button"
            class="ml-auto rounded-md border border-[#1E3A5F] bg-[#0C1E3D] p-1 text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172A4D] transition cursor-pointer shadow-xs"
            aria-label="Plein écran"
            (click)="fullscreen(box)">
            <app-icon name="maximize" [size]="12" />
          </button>
        </div>
      </div>
    </section>
  `,
})
export class LiveCameraComponent {
  @ViewChild('videoPlayer') videoElement?: ElementRef<HTMLVideoElement>;

  private readonly drones = inject(DroneService);
  protected readonly ui = inject(UiService);
  protected readonly drone = this.drones.selected;

  private readonly sources = APP_SETTINGS.liveStreamUrl ? [APP_SETTINGS.liveStreamUrl] : APP_SETTINGS.demoVideoSources;
  private readonly index = signal(0);
  protected readonly playing = signal(false);

  protected readonly currentSrc = computed(() => this.sources[this.index()]);
  protected readonly speed = computed(() => (this.drone()?.speed ?? 0).toFixed(1));

  protected onError(): void {
    if (this.index() < this.sources.length - 1) {
      this.index.update((i) => i + 1);
    }
  }

  protected fullscreen(el: HTMLElement): void {
    void el.requestFullscreen?.();
  }
}
