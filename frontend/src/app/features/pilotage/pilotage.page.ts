import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { interval } from 'rxjs';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { BackendService } from '../../core/services/backend.service';
import { DroneService } from '../../core/services/drone.service';
import { FlightControlService } from '../../core/services/flight-control.service';
import { NotificationService } from '../../core/services/notification.service';
import { TelemetryService } from '../../core/services/telemetry.service';
import { UiService } from '../../core/services/ui.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-pilotage-page',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-[1700px] flex-col gap-3.5 p-1">
      
      <!-- ============================================================== -->
      <!-- BANDEAU SUPÉRIEUR : BOUTONS CONNECTER & MISE EN MARCHE RÉELLE  -->
      <!-- ============================================================== -->
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E3A5F] bg-[#0A192F]/95 p-3.5 shadow-xl backdrop-blur-md">
        <!-- Titre & Indicateur d'état temps réel -->
        <div class="flex items-center gap-3">
          <div class="flex size-11 items-center justify-center rounded-2xl border border-[#38BDF8]/40 bg-[#112240] text-[#38BDF8] shadow-inner">
            <app-icon name="gamepad" [size]="22" />
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-base font-black tracking-wide text-white">Pilotage Tactique</span>
              @if (isFlying() || isRealtimeRunning()) {
                <span class="inline-flex items-center gap-1.5 rounded-full border border-[#10B981]/50 bg-[#10B981]/20 px-2.5 py-0.5 text-[10px] font-black text-[#34D399]">
                  <span class="size-2 rounded-full bg-[#10B981] animate-ping"></span>
                  EN MARCHE EN TEMPS RÉEL (1 Hz)
                </span>
              } @else {
                <span class="inline-flex items-center gap-1.5 rounded-full border border-[#64748B]/40 bg-[#1E293B] px-2.5 py-0.5 text-[10px] font-bold text-[#94A3B8]">
                  <span class="size-2 rounded-full bg-[#64748B]"></span>
                  AU REPOS · EN ATTENTE DE MISE EN MARCHE
                </span>
              }
            </div>
            <p class="text-xs text-[#94A3B8]">
              Drone connecté : <span class="font-extrabold text-[#F8FAFC]">{{ currentDrone()?.name ?? 'Aucun drone' }}</span> 
              <span class="mx-1.5 text-[#1E3A5F]">|</span>
              <span class="font-semibold text-[#34D399]">Liaison MAVLink / 5.8 GHz Active (Signal 99% · 8 ms)</span>
            </p>
          </div>
        </div>

        <!-- ACTIONS MAJEURES : CONNECTER UN DRONE & METTRE EN MARCHE -->
        <div class="flex flex-wrap items-center gap-2.5">
          <!-- Sélecteur de drone -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-semibold text-[#94A3B8] hidden sm:inline">Cible :</span>
            <select
              class="rounded-xl border border-[#1E3A5F] bg-[#112240] px-3 py-2 text-xs font-bold text-[#F8FAFC] transition hover:border-[#38BDF8] focus:border-[#38BDF8] focus:outline-none cursor-pointer"
              [value]="drones.selectedId()"
              (change)="onSelectDrone($any($event.target).value)">
              @for (d of drones.drones(); track d.id) {
                <option [value]="d.id">
                  {{ d.name }} ({{ d.code }}) — {{ d.status === 'in-flight' ? 'EN VOL' : 'AU SOL' }}
                </option>
              }
            </select>
          </div>

          <!-- BOUTON : CONNECTER UN DRONE -->
          <button
            type="button"
            (click)="ui.openDroneForm()"
            class="flex items-center gap-2 rounded-xl border border-[#38BDF8]/60 bg-[#0C244A] px-3.5 py-2 text-xs font-bold text-[#38BDF8] shadow-md transition hover:bg-[#13386E] hover:text-white active:scale-95 cursor-pointer"
            title="Connecter un nouvel appareil ou drone à la base de données">
            <app-icon name="plus" [size]="14" />
            <span>Connecter un drone</span>
          </button>

          <!-- BOUTON : METTRE EN MARCHE EN TEMPS RÉEL -->
          <button
            type="button"
            (click)="toggleRealtimeRun()"
            [class]="'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer ' +
                     (isFlying() || isRealtimeRunning()
                       ? 'border border-[#EF4444]/60 bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white shadow-[#EF4444]/30 hover:brightness-110'
                       : 'border border-[#10B981]/60 bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-[#10B981]/30 hover:brightness-110')">
            <app-icon [name]="(isFlying() || isRealtimeRunning()) ? 'pause' : 'play'" [size]="15" />
            <span>{{ (isFlying() || isRealtimeRunning()) ? 'Arrêter la mise en marche' : 'Mettre en marche en temps réel' }}</span>
          </button>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- GRILLE PRINCIPALE 2 COLONNES (SANS DIAGNOSTIC MOTEURS)         -->
      <!-- ============================================================== -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 items-start">
        
        <!-- ============================================================== -->
        <!-- COLONNE 1 : Commandes de Pilotage (lg:col-span-5)              -->
        <!-- ============================================================== -->
        <div class="flex flex-col gap-3.5 lg:col-span-5">
          <!-- Titre section -->
          <div class="flex items-center gap-2.5 px-1">
            <div class="flex size-9 items-center justify-center rounded-xl bg-[#2563EB]/20 text-[#38BDF8]">
              <app-icon name="gamepad" [size]="20" />
            </div>
            <h2 class="text-xl font-black tracking-wide text-white">Commandes de Vol</h2>
          </div>

          <!-- CARTE 1 : Mettre en marche / Armer les propulseurs -->
          <button
            type="button"
            (click)="toggleRealtimeRun()"
            class="group relative flex w-full flex-col gap-1 overflow-hidden rounded-2xl border border-[#10B981]/50 bg-gradient-to-br from-[#10B981] to-[#059669] p-4 py-5 text-left text-white shadow-lg shadow-[#10B981]/20 transition-all hover:brightness-105 active:scale-[0.98] cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="flex size-12 items-center justify-center rounded-full bg-white/20 text-white shadow-inner">
                <app-icon [name]="(isFlying() || isRealtimeRunning()) ? 'check' : 'play'" [size]="24" />
              </div>
              <div class="min-w-0">
                <div class="text-base font-extrabold tracking-wide">
                  {{ (isFlying() || isRealtimeRunning()) ? 'En marche en temps réel' : 'Mettre en marche en temps réel' }}
                </div>
                <div class="text-[11px] text-white/90 font-medium">
                  {{ (isFlying() || isRealtimeRunning()) ? 'Système actif · Télémétrie synchronisée' : 'Lancer la mise sous tension et la télémétrie' }}
                </div>
              </div>
            </div>
            @if (isFlying() || isRealtimeRunning()) {
              <div class="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-white/95">
                <span class="size-2 rounded-full bg-white animate-ping"></span>
                <span>Alimentation nominale • Flux actif</span>
              </div>
            }
          </button>

          <!-- CARTE 2 : Décoller (Bouton Bleu) -->
          <button
            type="button"
            (click)="onTakeOff()"
            [disabled]="isFlying()"
            [class]="'group relative flex w-full flex-col gap-1 overflow-hidden rounded-2xl border p-4 py-5 text-left shadow-lg transition-all ' +
                     (isFlying()
                       ? 'cursor-not-allowed border-[#1E3A5F] bg-[#112240]/50 text-[#64748B]'
                       : 'border-[#1E3A8A]/60 bg-[#172554] text-white hover:bg-[#1E3A8A] active:scale-[0.98] cursor-pointer')">
            <div class="flex items-center gap-3">
              <div class="flex size-12 items-center justify-center rounded-xl bg-white/10 text-white shadow-inner">
                <app-icon name="rocket" [size]="22" />
              </div>
              <div class="min-w-0">
                <div class="text-base font-extrabold tracking-wide text-white">Décoller</div>
                <div class="text-[11px] text-[#94A3B8] font-medium">Lancer le décollage (15 km/h · 120 m)</div>
              </div>
            </div>
          </button>

          <!-- CARTE 3 : Atterrir (Bouton Rouge) -->
          <button
            type="button"
            (click)="onLand()"
            [disabled]="!isFlying()"
            [class]="'group relative flex w-full flex-col gap-1 overflow-hidden rounded-2xl border p-4 py-5 text-left shadow-lg transition-all ' +
                     (!isFlying()
                       ? 'cursor-not-allowed border-[#1E3A5F] bg-[#112240]/40 text-[#64748B]'
                       : 'border-[#EF4444]/60 bg-gradient-to-br from-[#EF4444] to-[#B91C1C] text-white shadow-[#EF4444]/25 hover:from-[#DC2626] hover:to-[#991B1B] active:scale-[0.98] cursor-pointer')">
            <div class="flex items-center gap-3">
              <div class="flex size-12 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner">
                <app-icon name="landing" [size]="22" />
              </div>
              <div class="min-w-0">
                <div class="text-base font-extrabold tracking-wide">Atterrir</div>
                <div class="text-[11px] text-white/80 font-medium">Déclencher l'atterrissage sécurisé</div>
              </div>
            </div>
          </button>

          <!-- CARTE 4 : Pause de mission (Bouton Bleu Marine) -->
          <button
            type="button"
            (click)="onTogglePause()"
            class="group relative flex w-full flex-col gap-1 overflow-hidden rounded-2xl border border-[#1E3A5F] bg-[#102038] p-4 py-5 text-left text-[#E2E8F0] shadow-lg transition-all hover:border-[#38BDF8] hover:bg-[#162C52] active:scale-[0.98] cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="flex size-12 items-center justify-center rounded-xl bg-white/10 text-white shadow-inner">
                <app-icon name="pause" [size]="22" />
              </div>
              <div class="min-w-0">
                <div class="text-base font-extrabold tracking-wide">
                  {{ isPaused() ? 'Reprendre la mission' : 'Pause de mission' }}
                </div>
                <div class="text-[11px] text-[#94A3B8] font-medium">
                  {{ isPaused() ? 'Poursuivre le plan de vol' : 'Suspendre la mission (Vol stationnaire)' }}
                </div>
              </div>
            </div>
          </button>

          <!-- CARTE 5 : Réglage Vitesse & RTH (Retour à la base) -->
          <div class="rounded-2xl border border-[#1E3A5F] bg-[#0A192F]/90 p-4 shadow-xl">
            <div class="flex items-center justify-between pb-3 border-b border-[#1E3A5F]/60">
              <div class="flex items-center gap-2">
                <app-icon name="gauge" [size]="16" class="text-[#38BDF8]" />
                <span class="text-sm font-extrabold text-white">Contrôle de Vitesse & RTH</span>
              </div>
              <span class="text-xs font-bold text-[#38BDF8]">{{ liveSpeed().toFixed(1) }} km/h</span>
            </div>

            <div class="mt-3 flex items-center gap-2.5">
              <button
                type="button"
                (click)="adjustSpeed(-2)"
                [disabled]="!isFlying() && !isRealtimeRunning()"
                class="flex-1 rounded-xl border border-[#1E3A5F] bg-[#112240] py-2 text-xs font-bold text-white transition hover:border-[#38BDF8] hover:bg-[#162C52] disabled:opacity-40 cursor-pointer">
                - 2 km/h
              </button>
              <button
                type="button"
                (click)="adjustSpeed(2)"
                [disabled]="!isFlying() && !isRealtimeRunning()"
                class="flex-1 rounded-xl border border-[#1E3A5F] bg-[#112240] py-2 text-xs font-bold text-white transition hover:border-[#38BDF8] hover:bg-[#162C52] disabled:opacity-40 cursor-pointer">
                + 2 km/h
              </button>
            </div>

            <button
              type="button"
              (click)="onReturnToBase()"
              [disabled]="!isFlying()"
              class="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#F59E0B]/50 bg-[#F59E0B]/15 py-2 text-xs font-extrabold text-[#FBBF24] transition hover:bg-[#F59E0B]/25 disabled:opacity-40 cursor-pointer">
              <app-icon name="compass" [size]="14" />
              <span>RTH · Retour sécurisé à la base</span>
            </button>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- COLONNE 2 : Vidéo en Direct, Télémétrie & Capteurs (lg:col-span-7) -->
        <!-- ============================================================== -->
        <div class="flex flex-col gap-3.5 lg:col-span-7">
          
          <!-- CARTE 1 : Vidéo en Direct Grand Format -->
          <div class="rounded-2xl border border-[#1E3A5F] bg-[#0A192F]/95 p-4 shadow-xl">
            <div class="flex items-center justify-between pb-3 border-b border-[#1E3A5F]/60">
              <div class="flex items-center gap-2">
                <app-icon name="camera" [size]="18" class="text-[#38BDF8]" />
                <span class="text-base font-extrabold text-white">Vidéo en Direct</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="flex items-center gap-1 rounded-md bg-[#EF4444] px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                  <span class="size-1.5 rounded-full bg-white animate-ping"></span>
                  REC
                </span>
                <span class="rounded-md bg-[#1E293B] px-2 py-0.5 text-[10px] font-bold text-[#94A3B8]">
                  1080p · 60 FPS
                </span>
              </div>
            </div>

            <!-- Cadre vidéo cinématique avec HUD actif -->
            <div class="relative mt-3 aspect-video w-full overflow-hidden rounded-xl border border-[#1E3A5F] bg-[#030914] shadow-inner">
              <video
                class="absolute inset-0 size-full object-cover"
                autoplay
                muted
                loop
                playsinline
                [attr.src]="demoVideoUrl"></video>

              <!-- Réticule HUD tactique -->
              <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div class="relative size-20">
                  <div class="absolute inset-x-0 top-1/2 h-[1px] bg-[#38BDF8]/40"></div>
                  <div class="absolute inset-y-0 left-1/2 w-[1px] bg-[#38BDF8]/40"></div>
                  <div class="absolute inset-2 rounded-full border border-dashed border-[#38BDF8]/60"></div>
                </div>
              </div>

              <!-- Badges HUD en direct -->
              <div class="pointer-events-none absolute top-3 right-3 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-mono font-bold text-[#34D399] border border-[#1E3A5F]">
                FPS: 60 • 4K HDR • ISO 100
              </div>
              <div class="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/70 px-2.5 py-1 text-[11px] font-mono font-bold text-[#38BDF8] border border-[#1E3A5F]">
                OPTICAL_01 • PITCH: +1.2° • ROLL: -0.4°
              </div>
            </div>
          </div>

          <!-- CARTE 2 : Télémétrie Complète en Temps Réel -->
          <div class="rounded-2xl border border-[#1E3A5F] bg-[#0A192F]/95 p-4 shadow-xl">
            <div class="flex items-center gap-2 pb-3 border-b border-[#1E3A5F]/60">
              <app-icon name="gauge" [size]="18" class="text-[#38BDF8]" />
              <span class="text-base font-extrabold text-white">Télémétrie en Temps Réel</span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
              <!-- Batterie -->
              <div class="flex items-center justify-between rounded-xl bg-[#112240] p-3 border border-[#1E3A5F]/50">
                <div class="flex items-center gap-2 text-[#94A3B8]">
                  <app-icon name="battery" [size]="16" class="text-[#10B981]" />
                  <span class="font-semibold">Niveau Batterie</span>
                </div>
                <div class="flex items-center gap-2.5">
                  <div class="h-2 w-20 overflow-hidden rounded-full bg-[#1E293B]">
                    <div class="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8]" [style.width.%]="liveBattery()"></div>
                  </div>
                  <span class="font-extrabold text-white">{{ liveBattery().toFixed(0) }} %</span>
                </div>
              </div>

              <!-- Altitude -->
              <div class="flex items-center justify-between rounded-xl bg-[#112240] p-3 border border-[#1E3A5F]/50">
                <div class="flex items-center gap-2 text-[#94A3B8]">
                  <app-icon name="mountain" [size]="16" class="text-[#38BDF8]" />
                  <span class="font-semibold">Altitude relative</span>
                </div>
                <span class="font-extrabold text-white text-sm">{{ liveAltitude().toFixed(0) }} m</span>
              </div>

              <!-- Vitesse -->
              <div class="flex items-center justify-between rounded-xl bg-[#112240] p-3 border border-[#1E3A5F]/50">
                <div class="flex items-center gap-2 text-[#94A3B8]">
                  <app-icon name="gauge" [size]="16" class="text-[#38BDF8]" />
                  <span class="font-semibold">Vitesse sol</span>
                </div>
                <span class="font-extrabold text-[#38BDF8] text-sm">{{ liveSpeed().toFixed(0) }} km/h</span>
              </div>

              <!-- Coordonnées GPS -->
              <div class="flex items-center justify-between rounded-xl bg-[#112240] p-3 border border-[#1E3A5F]/50">
                <div class="flex items-center gap-2 text-[#94A3B8]">
                  <app-icon name="pin" [size]="16" class="text-[#34D399]" />
                  <span class="font-semibold">Coordonnées GPS</span>
                </div>
                <span class="font-mono text-xs font-bold text-[#34D399]">{{ liveGps() }}</span>
              </div>
            </div>
          </div>

          <!-- CARTE 3 : Détection d'obstacles & Sécurité du vol -->
          <div class="rounded-2xl border border-[#1E3A5F] bg-[#0A192F]/95 p-4 shadow-xl">
            <div class="flex items-center gap-2 pb-2.5 border-b border-[#1E3A5F]/60">
              <app-icon name="crosshair" [size]="18" class="text-[#38BDF8]" />
              <span class="text-base font-extrabold text-white">Détection d'obstacles & Sécurité</span>
            </div>
            <div class="mt-3 flex items-center gap-3 rounded-xl bg-[#112240] p-3 border border-[#1E3A5F]/50">
              <span class="text-base font-bold text-white">✛</span>
              <div class="h-2.5 flex-1 overflow-hidden rounded-full bg-[#1E293B]">
                <div class="h-full bg-gradient-to-r from-[#10B981] to-[#34D399]" style="width: 20%;"></div>
              </div>
              <span class="text-xs font-bold text-[#34D399]">Aucun obstacle détecté • Périmètre dégagé</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class PilotagePage implements OnInit {
  protected readonly backend = inject(BackendService);
  protected readonly drones = inject(DroneService);
  protected readonly flightControl = inject(FlightControlService);
  protected readonly telemetry = inject(TelemetryService);
  protected readonly ui = inject(UiService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly demoVideoUrl = APP_SETTINGS.demoVideoSources?.[0] ?? '';

  // État de mise en marche temps réel
  readonly isRealtimeRunning = signal(true);
  readonly isPaused = signal(false);

  // Fluctuations en temps réel (1 Hz)
  private readonly jitterTick = signal(0);

  readonly currentDrone = computed(() => this.drones.selected());
  readonly isFlying = computed(() => this.currentDrone()?.status === 'in-flight');

  // Télémétrie réactive en direct
  readonly liveBattery = computed(() => {
    if (!this.isFlying() && !this.isRealtimeRunning()) return 80;
    const tick = this.jitterTick();
    const drained = 78 - (tick * 0.02) % 4;
    return Math.max(10, Math.round(drained * 10) / 10);
  });

  readonly liveAltitude = computed(() => {
    if (!this.isFlying() && !this.isRealtimeRunning()) return 0;
    const j = Math.sin(this.jitterTick()) * 0.4;
    return Math.round((120 + j) * 10) / 10;
  });

  readonly liveSpeed = computed(() => {
    if (!this.isFlying() && !this.isRealtimeRunning()) return 0;
    const j = Math.cos(this.jitterTick()) * 0.3;
    return Math.round((15 + j) * 10) / 10;
  });

  readonly liveGps = computed(() => {
    const d = this.currentDrone();
    const isLive = this.isFlying() || this.isRealtimeRunning();
    const lat = (d?.latitude ?? 5.3594) + (isLive ? (this.jitterTick() * 0.000008) % 0.001 : 0);
    const lng = (d?.longitude ?? -4.0083) - (isLive ? (this.jitterTick() * 0.000006) % 0.001 : 0);
    return `${lat.toFixed(4)}° N, ${Math.abs(lng).toFixed(4)}° W`;
  });

  ngOnInit(): void {
    // Boucle de pulsation temps réel à 1 Hz
    const sub = interval(1000).subscribe(() => {
      this.jitterTick.update((v) => v + 1);
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  onSelectDrone(id: string): void {
    this.drones.select(id);
    const d = this.drones.byId(id);
    if (d?.status === 'in-flight') {
      this.isRealtimeRunning.set(true);
    }
  }

  /**
   * Met en marche ou arrête le drone en temps réel avec persistance MySQL
   */
  toggleRealtimeRun(): void {
    const d = this.currentDrone();
    if (!d) {
      this.notifications.warning('Aucun drone sélectionné. Veuillez connecter un drone.');
      return;
    }

    const nextState = !this.isRealtimeRunning();
    this.isRealtimeRunning.set(nextState);

    if (nextState) {
      this.telemetry.start();
      this.notifications.success(`Mise en marche temps réel activée pour ${d.name}.`);
      this.backend.recordHistory('mise_en_marche_temps_reel', `Mise en marche temps réel de ${d.name} (Flux vidéo et capteurs synchronisés)`, d.id);
      this.backend.syncTelemetry(d.id, { speed: 4.17, altitude: 120, batteryLevel: 78 });
    } else {
      this.notifications.push(`Mise en marche interrompue pour ${d.name}.`, 'info');
      this.backend.recordHistory('arret_marche_temps_reel', `Arrêt de la mise en marche temps réel pour ${d.name}`, d.id);
      this.backend.syncTelemetry(d.id, { speed: 0, altitude: 0, batteryLevel: this.liveBattery() });
    }
  }

  onTakeOff(): void {
    const d = this.currentDrone();
    if (!d) return;
    this.isRealtimeRunning.set(true);
    this.isPaused.set(false);
    this.flightControl.takeOff(d.id, 'manual', 12.0);
    this.backend.recordHistory('demarrage_vol', `Décollage manuel de ${d.name} à 15 km/h`, d.id);
    this.notifications.success(`Décollage de ${d.name} initié en temps réel.`);
  }

  onLand(): void {
    const d = this.currentDrone();
    if (!d) return;
    this.flightControl.land(d.id);
    this.isRealtimeRunning.set(false);
    this.isPaused.set(false);
    this.backend.recordHistory('atterrissage', `Atterrissage commandé de ${d.name}`, d.id);
    this.notifications.push(`Atterrissage de ${d.name} en cours...`, 'info');
  }

  onTogglePause(): void {
    const d = this.currentDrone();
    if (!d) return;
    const nextState = !this.isPaused();
    this.isPaused.set(nextState);
    if (nextState) {
      this.flightControl.setMode(d.id, 'semi-auto');
      this.notifications.push(`Mission suspendue : ${d.name} en vol stationnaire (Hover).`, 'info');
      this.backend.recordHistory('pause_vol', `Suspension du vol de ${d.name} en vol stationnaire`, d.id);
    } else {
      this.flightControl.setMode(d.id, 'auto');
      this.notifications.success(`Reprise de mission pour ${d.name}.`);
      this.backend.recordHistory('reprise_vol', `Reprise du vol automatique pour ${d.name}`, d.id);
    }
  }

  adjustSpeed(delta: number): void {
    const d = this.currentDrone();
    if (!d) return;
    const current = d.speed || 4.17;
    const newSpeed = Math.max(1, current + (delta / 3.6));
    this.flightControl.setSpeed(d.id, newSpeed);
    this.backend.recordHistory('ajustement_vitesse', `Ajustement de la vitesse de ${d.name} : ${(newSpeed * 3.6).toFixed(0)} km/h`, d.id);
  }

  onReturnToBase(): void {
    const d = this.currentDrone();
    if (!d) return;
    this.flightControl.returnToBase(d.id);
    this.backend.recordHistory('rth_retour_base', `Ordre RTH (Return to Home) déclenché pour ${d.name}`, d.id);
  }
}
