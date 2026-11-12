import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { APP_SETTINGS } from '../../core/config/app-settings';
import { BackendService } from '../../core/services/backend.service';
import { DroneService } from '../../core/services/drone.service';
import { FlightControlService } from '../../core/services/flight-control.service';
import { NotificationService } from '../../core/services/notification.service';
import { TelemetryService } from '../../core/services/telemetry.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-pilotage-page',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-[1700px] flex-col gap-4 p-1">
      <!-- Grille Principale 3 Colonnes identique à la maquette de référence -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 items-start">
        
        <!-- ============================================================== -->
        <!-- COLONNE 1 : Commandes de Pilotage (lg:col-span-3)              -->
        <!-- ============================================================== -->
        <div class="flex flex-col gap-3.5 lg:col-span-3">
          <!-- Titre section avec sélecteur de drone discret -->
          <div class="flex items-center justify-between px-1">
            <div class="flex items-center gap-2.5">
              <div class="flex size-9 items-center justify-center rounded-xl bg-[#2563EB]/20 text-[#38BDF8]">
                <app-icon name="gamepad" [size]="20" />
              </div>
              <h1 class="text-xl font-black tracking-wide text-white">Pilotage</h1>
            </div>
            <!-- Sélecteur compact de drone -->
            <select
              class="rounded-lg border border-[#1E3A5F] bg-[#112240] px-2.5 py-1 text-[11px] font-bold text-[#F8FAFC] transition hover:border-[#38BDF8] focus:border-[#38BDF8] focus:outline-none cursor-pointer"
              [value]="drones.selectedId()"
              (change)="onSelectDrone($any($event.target).value)">
              @for (d of drones.drones(); track d.id) {
                <option [value]="d.id">{{ d.name }}</option>
              }
            </select>
          </div>

          <!-- CARTE 1 : Armer les moteurs (Bouton Vert) -->
          <button
            type="button"
            (click)="toggleArm()"
            class="group relative flex w-full flex-col gap-1 overflow-hidden rounded-2xl border border-[#10B981]/50 bg-gradient-to-br from-[#10B981] to-[#059669] p-4 py-5 text-left text-white shadow-lg shadow-[#10B981]/20 transition-all hover:brightness-105 active:scale-[0.98] cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="flex size-12 items-center justify-center rounded-full bg-white/20 text-white shadow-inner">
                <app-icon name="play" [size]="24" />
              </div>
              <div class="min-w-0">
                <div class="text-base font-extrabold tracking-wide">
                  {{ isArmed() || isFlying() ? 'Désarmer les moteurs' : 'Armer les moteurs' }}
                </div>
                <div class="text-[11px] text-white/90 font-medium">
                  {{ isArmed() || isFlying() ? 'Moteurs sous tension' : 'Préparer le démarrage' }}
                </div>
              </div>
            </div>
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
                <div class="text-[11px] text-[#94A3B8] font-medium">Lancer le décollage</div>
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
                <div class="text-[11px] text-white/80 font-medium">Déclencher l'atterrissage</div>
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
                  {{ isPaused() ? 'Poursuivre le plan de vol' : 'Suspendre la mission' }}
                </div>
              </div>
            </div>
          </button>
        </div>

        <!-- ============================================================== -->
        <!-- COLONNE 2 : Diagnostic des moteurs (Centre - lg:col-span-5)    -->
        <!-- ============================================================== -->
        <div class="flex flex-col gap-3 rounded-2xl border border-[#1E3A5F] bg-[#0A192F]/95 p-4 shadow-xl lg:col-span-5">
          <!-- En-tête de la carte -->
          <div class="flex items-center justify-between border-b border-[#1E3A5F]/70 pb-3">
            <div class="flex items-center gap-2">
              <div class="flex size-8 items-center justify-center rounded-lg border border-[#1E3A5F] bg-[#112240] text-[#38BDF8]">
                <app-icon name="camera" [size]="16" />
              </div>
              <span class="text-base font-extrabold text-white tracking-wide">Diagnostic des moteurs</span>
            </div>
            <!-- Badge statut moteur en vert vif -->
            <span class="inline-flex items-center gap-1.5 rounded bg-[#10B981] px-2.5 py-0.5 text-xs font-black text-black shadow-xs">
              EN MARCHE
            </span>
          </div>

          <!-- VISUEL DU DRONE VUE DU DESSUS & HÉLICES ROTATIVES -->
          <div class="relative flex min-h-[350px] items-center justify-center overflow-hidden rounded-xl border border-[#1E3A5F]/60 bg-[#071326] p-4">
            <!-- Cercles concentriques radar de fond -->
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-20">
              <div class="size-72 rounded-full border border-dashed border-[#38BDF8]/40"></div>
              <div class="absolute size-48 rounded-full border border-[#38BDF8]/20"></div>
              <div class="absolute size-24 rounded-full border border-[#38BDF8]/30"></div>
            </div>

            <!-- OVERLAYS DES 4 MOTEURS AUX 4 COINS -->
            <!-- Moteur 1 (Haut-Gauche) -->
            <div class="absolute top-3 left-3 z-10 w-36 rounded-lg border border-[#1E3A5F] bg-[#0A192F]/85 p-2 backdrop-blur-xs">
              <div class="text-[11px] font-black text-white">Moteur 1</div>
              <div class="text-[9px] font-semibold text-[#38BDF8]">EN MARCHE - {{ m1().rpm }} RPM</div>
              <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1E293B]">
                <div class="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8] transition-all duration-300" [style.width.%]="m1().pct"></div>
              </div>
            </div>

            <!-- Moteur 2 (Haut-Droit) -->
            <div class="absolute top-3 right-3 z-10 w-36 rounded-lg border border-[#1E3A5F] bg-[#0A192F]/85 p-2 backdrop-blur-xs text-right">
              <div class="flex items-center justify-end gap-1">
                <app-icon name="rotate" [size]="11" class="text-[#38BDF8]" />
                <span class="text-[11px] font-black text-white">Moteur 2</span>
              </div>
              <div class="text-[9px] font-semibold text-[#38BDF8]">EN MARCHE - {{ m2().rpm }} RPM</div>
              <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1E293B]">
                <div class="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8] transition-all duration-300" [style.width.%]="m2().pct"></div>
              </div>
            </div>

            <!-- Moteur 3 (Bas-Gauche) -->
            <div class="absolute bottom-3 left-3 z-10 w-36 rounded-lg border border-[#1E3A5F] bg-[#0A192F]/85 p-2 backdrop-blur-xs">
              <div class="text-[11px] font-black text-white">Moteur 3</div>
              <div class="text-[9px] font-semibold text-[#38BDF8]">EN MARCHE - {{ m3().rpm }} RPM</div>
              <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1E293B]">
                <div class="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8] transition-all duration-300" [style.width.%]="m3().pct"></div>
              </div>
            </div>

            <!-- Moteur 4 (Bas-Droit) -->
            <div class="absolute bottom-3 right-3 z-10 w-36 rounded-lg border border-[#1E3A5F] bg-[#0A192F]/85 p-2 backdrop-blur-xs text-right">
              <div class="flex items-center justify-end gap-1">
                <app-icon name="rotate" [size]="11" class="text-[#38BDF8]" />
                <span class="text-[11px] font-black text-white">Moteur 4</span>
              </div>
              <div class="text-[9px] font-semibold text-[#38BDF8]">EN MARCHE - {{ m4().rpm }} RPM</div>
              <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1E293B]">
                <div class="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8] transition-all duration-300" [style.width.%]="m4().pct"></div>
              </div>
            </div>

            <!-- DRONE SVG DESSINÉ AVEC EFFET HÉLICES VORTEX -->
            <div class="relative z-0 size-64">
              <!-- Hélice 1 (Haut-Gauche) avec vortex tournant -->
              <div class="absolute top-1 left-1 size-24">
                <div class="size-full rounded-full border border-[#38BDF8]/40 bg-[#38BDF8]/15 animate-spin duration-300">
                  <div class="size-full rounded-full border-t-2 border-b-2 border-[#38BDF8] opacity-80 blur-[0.5px]"></div>
                </div>
              </div>

              <!-- Hélice 2 (Haut-Droit) avec vortex tournant -->
              <div class="absolute top-1 right-1 size-24">
                <div class="size-full rounded-full border border-[#38BDF8]/40 bg-[#38BDF8]/15 animate-spin duration-300">
                  <div class="size-full rounded-full border-t-2 border-b-2 border-[#38BDF8] opacity-80 blur-[0.5px]"></div>
                </div>
              </div>

              <!-- Hélice 3 (Bas-Gauche) avec vortex tournant -->
              <div class="absolute bottom-1 left-1 size-24">
                <div class="size-full rounded-full border border-[#38BDF8]/40 bg-[#38BDF8]/15 animate-spin duration-300">
                  <div class="size-full rounded-full border-t-2 border-b-2 border-[#38BDF8] opacity-80 blur-[0.5px]"></div>
                </div>
              </div>

              <!-- Hélice 4 (Bas-Droit) avec vortex tournant -->
              <div class="absolute bottom-1 right-1 size-24">
                <div class="size-full rounded-full border border-[#38BDF8]/40 bg-[#38BDF8]/15 animate-spin duration-300">
                  <div class="size-full rounded-full border-t-2 border-b-2 border-[#38BDF8] opacity-80 blur-[0.5px]"></div>
                </div>
              </div>

              <!-- Châssis Central du Quadricoptère DISDP -->
              <svg viewBox="0 0 200 200" class="absolute inset-0 size-full filter drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                <!-- Bras diagonaux en fibre de carbone -->
                <line x1="45" y1="45" x2="155" y2="155" stroke="#1E293B" stroke-width="12" stroke-linecap="round" />
                <line x1="155" y1="45" x2="45" y2="155" stroke="#1E293B" stroke-width="12" stroke-linecap="round" />
                <line x1="45" y1="45" x2="155" y2="155" stroke="#38BDF8" stroke-width="2" opacity="0.6" />
                <line x1="155" y1="45" x2="45" y2="155" stroke="#38BDF8" stroke-width="2" opacity="0.6" />

                <!-- Moteurs Brushless aux 4 extrémités -->
                <circle cx="45" cy="45" r="11" fill="#0F172A" stroke="#38BDF8" stroke-width="2.5" />
                <circle cx="155" cy="45" r="11" fill="#0F172A" stroke="#38BDF8" stroke-width="2.5" />
                <circle cx="45" cy="155" r="11" fill="#0F172A" stroke="#38BDF8" stroke-width="2.5" />
                <circle cx="155" cy="155" r="11" fill="#0F172A" stroke="#38BDF8" stroke-width="2.5" />

                <!-- Fuselage Carbone Central Aérodynamique -->
                <rect x="74" y="55" width="52" height="90" rx="22" fill="#1E293B" stroke="#475569" stroke-width="2" />
                <!-- Verrière / Cockpit supérieur -->
                <rect x="84" y="65" width="32" height="45" rx="12" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5" />
                <circle cx="100" cy="80" r="5" fill="#38BDF8" class="animate-pulse" />
                <!-- Capteur Caméra avant -->
                <circle cx="100" cy="58" r="4" fill="#10B981" />
                <!-- LED statut arrière -->
                <circle cx="100" cy="138" r="3.5" fill="#10B981" />
              </svg>
            </div>
          </div>

          <!-- LISTE DES 4 MOTEURS SOUS LE VISUEL -->
          <div class="flex flex-col gap-2 pt-1">
            <!-- Moteur 1 -->
            <div class="flex items-center justify-between rounded-xl border border-[#1E3A5F] bg-[#112240] px-3.5 py-2.5">
              <div class="flex items-center gap-3">
                <!-- Icône vortex spirale cyan identique à la maquette -->
                <svg viewBox="0 0 36 36" fill="none" class="size-6 text-[#38BDF8] shrink-0">
                  <path d="M18 4 C24 4, 30 9, 31 16 C32 23, 27 30, 20 31 C13 32, 6 27, 5 20 C4 14, 8 8, 14 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                  <path d="M18 9 C22 9, 26 12, 27 16 C28 21, 24 25, 20 26 C15 27, 11 23, 10 19 C9 15, 12 11, 16 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <circle cx="18" cy="18" r="2.5" fill="currentColor"/>
                </svg>
                <div>
                  <div class="text-xs font-bold text-white">Moteur 1 - Tourne</div>
                  <div class="text-[10px] text-[#94A3B8] font-medium">{{ m1().rpm }} RPM • Temp: {{ m1().temp }}°C</div>
                </div>
              </div>
              <span class="size-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></span>
            </div>

            <!-- Moteur 2 -->
            <div class="flex items-center justify-between rounded-xl border border-[#1E3A5F] bg-[#112240] px-3.5 py-2.5">
              <div class="flex items-center gap-3">
                <svg viewBox="0 0 36 36" fill="none" class="size-6 text-[#38BDF8] shrink-0">
                  <path d="M18 4 C24 4, 30 9, 31 16 C32 23, 27 30, 20 31 C13 32, 6 27, 5 20 C4 14, 8 8, 14 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                  <path d="M18 9 C22 9, 26 12, 27 16 C28 21, 24 25, 20 26 C15 27, 11 23, 10 19 C9 15, 12 11, 16 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <circle cx="18" cy="18" r="2.5" fill="currentColor"/>
                </svg>
                <div>
                  <div class="text-xs font-bold text-white">Moteur 2 - Tourne</div>
                  <div class="text-[10px] text-[#94A3B8] font-medium">{{ m2().rpm }} RPM • Temp: {{ m2().temp }}°C</div>
                </div>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></span>
                <span class="size-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></span>
              </div>
            </div>

            <!-- Moteur 3 -->
            <div class="flex items-center justify-between rounded-xl border border-[#1E3A5F] bg-[#112240] px-3.5 py-2.5">
              <div class="flex items-center gap-3">
                <svg viewBox="0 0 36 36" fill="none" class="size-6 text-[#38BDF8] shrink-0">
                  <path d="M18 4 C24 4, 30 9, 31 16 C32 23, 27 30, 20 31 C13 32, 6 27, 5 20 C4 14, 8 8, 14 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                  <path d="M18 9 C22 9, 26 12, 27 16 C28 21, 24 25, 20 26 C15 27, 11 23, 10 19 C9 15, 12 11, 16 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <circle cx="18" cy="18" r="2.5" fill="currentColor"/>
                </svg>
                <div>
                  <div class="text-xs font-bold text-white">Moteur 3 - Tourne</div>
                  <div class="text-[10px] text-[#94A3B8] font-medium">{{ m3().rpm }} RPM • Temp: {{ m3().temp }}°C</div>
                </div>
              </div>
              <span class="size-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></span>
            </div>

            <!-- Moteur 4 -->
            <div class="flex items-center justify-between rounded-xl border border-[#1E3A5F] bg-[#112240] px-3.5 py-2.5">
              <div class="flex items-center gap-3">
                <svg viewBox="0 0 36 36" fill="none" class="size-6 text-[#38BDF8] shrink-0">
                  <path d="M18 4 C24 4, 30 9, 31 16 C32 23, 27 30, 20 31 C13 32, 6 27, 5 20 C4 14, 8 8, 14 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                  <path d="M18 9 C22 9, 26 12, 27 16 C28 21, 24 25, 20 26 C15 27, 11 23, 10 19 C9 15, 12 11, 16 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <circle cx="18" cy="18" r="2.5" fill="currentColor"/>
                </svg>
                <div>
                  <div class="text-xs font-bold text-white">Moteur 4 - Tourne</div>
                  <div class="text-[10px] text-[#94A3B8] font-medium">{{ m4().rpm }} RPM • Temp: {{ m4().temp }}°C</div>
                </div>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="size-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></span>
                <span class="size-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]"></span>
              </div>
            </div>
          </div>

          <!-- BANNIÈRE PIED DE CARTE ÉTAT GÉNÉRAL -->
          <div class="mt-auto flex items-center justify-between rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 px-3.5 py-2 text-xs font-bold text-white">
            <span class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-[#10B981] animate-pulse"></span>
              État général : Moteurs en rotation — Système propulsé
            </span>
            <span class="rounded-md bg-[#10B981] px-2 py-0.5 text-[10px] font-black text-slate-900 shadow-xs">
              OK
            </span>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- COLONNE 3 : Vidéo, Télémétrie, Diagnostics (lg:col-span-4)     -->
        <!-- ============================================================== -->
        <div class="flex flex-col gap-3.5 lg:col-span-4">
          
          <!-- CARTE 1 : Vidéo en Direct -->
          <div class="rounded-2xl border border-[#1E3A5F] bg-[#0A192F]/95 p-3.5 shadow-xl">
            <div class="flex items-center justify-between pb-2.5">
              <div class="flex items-center gap-2">
                <app-icon name="camera" [size]="16" class="text-[#38BDF8]" />
                <span class="text-sm font-extrabold text-white">Vidéo en Direct</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="flex items-center gap-1 rounded-md bg-[#EF4444] px-1.5 py-0.5 text-[9px] font-black text-white shadow-xs">
                  <span class="size-1.5 rounded-full bg-white animate-ping"></span>
                  REC
                </span>
                <span class="rounded-md bg-[#1E293B] px-1.5 py-0.5 text-[9px] font-bold text-[#94A3B8]">
                  1080p
                </span>
              </div>
            </div>

            <!-- Cadre vidéo avec flux actif du drone -->
            <div class="relative aspect-video w-full overflow-hidden rounded-xl border border-[#1E3A5F] bg-[#030914] shadow-inner">
              <video
                class="absolute inset-0 size-full object-cover"
                autoplay
                muted
                loop
                playsinline
                [attr.src]="demoVideoUrl"></video>

              <!-- Réticule HUD tactique -->
              <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div class="relative size-16">
                  <div class="absolute inset-x-0 top-1/2 h-[1px] bg-[#38BDF8]/40"></div>
                  <div class="absolute inset-y-0 left-1/2 w-[1px] bg-[#38BDF8]/40"></div>
                  <div class="absolute inset-2 rounded-full border border-dashed border-[#38BDF8]/60"></div>
                </div>
              </div>

              <!-- Badges HUD en direct -->
              <div class="pointer-events-none absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-mono font-bold text-[#34D399]">
                FPS: 60 • 4K HDR
              </div>
              <div class="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-mono font-bold text-[#38BDF8]">
                CAM_01 • PITCH: +1.2°
              </div>
            </div>
          </div>

          <!-- CARTE 2 : Télémétrie -->
          <div class="rounded-2xl border border-[#1E3A5F] bg-[#0A192F]/95 p-3.5 shadow-xl">
            <div class="flex items-center gap-2 pb-2.5">
              <app-icon name="gauge" [size]="16" class="text-[#38BDF8]" />
              <span class="text-sm font-extrabold text-white">Télémétrie</span>
            </div>
            <div class="space-y-2 text-xs">
              <!-- Batterie -->
              <div class="flex items-center justify-between rounded-lg bg-[#112240] px-3 py-1.5">
                <span class="text-[#94A3B8] font-medium">Batterie</span>
                <div class="flex items-center gap-2">
                  <div class="h-2 w-24 overflow-hidden rounded-full bg-[#1E293B]">
                    <div class="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8]" style="width: 78%;"></div>
                  </div>
                  <span class="font-bold text-white">78 %</span>
                </div>
              </div>

              <!-- Altitude -->
              <div class="flex items-center justify-between rounded-lg bg-[#112240] px-3 py-1.5">
                <span class="text-[#94A3B8] font-medium">Altitude</span>
                <span class="font-bold text-white">120 m</span>
              </div>

              <!-- Vitesse -->
              <div class="flex items-center justify-between rounded-lg bg-[#112240] px-3 py-1.5">
                <span class="text-[#94A3B8] font-medium">Vitesse</span>
                <span class="font-bold text-[#38BDF8]">15 km/h</span>
              </div>

              <!-- Coordonnées GPS -->
              <div class="flex items-center justify-between rounded-lg bg-[#112240] px-3 py-1.5">
                <span class="text-[#94A3B8] font-medium">Coordonnées GPS</span>
                <span class="font-mono text-[11px] font-bold text-[#34D399]">5.3594° N, -4.0083° W</span>
              </div>
            </div>
          </div>

          <!-- CARTE 3 : Diagnostic des moteurs (Résumé) -->
          <div class="rounded-2xl border border-[#1E3A5F] bg-[#0A192F]/95 p-3.5 shadow-xl">
            <div class="flex items-center justify-between pb-2">
              <div class="flex items-center gap-2">
                <app-icon name="wrench" [size]="16" class="text-[#38BDF8]" />
                <span class="text-sm font-extrabold text-white">Diagnostic des moteurs</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold text-[#94A3B8]">État Moteurs</span>
                <span class="rounded bg-[#10B981] px-2 py-0.5 text-[10px] font-black text-black">
                  OK
                </span>
              </div>
            </div>
            <!-- Ligne de statut -->
            <div class="mb-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1E293B]">
              <div class="h-full bg-[#38BDF8]" style="width: 70%;"></div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-[11px]">
              <div class="flex items-center gap-1.5 rounded-lg bg-[#112240] p-2 text-slate-200">
                <app-icon name="rotate" [size]="12" class="text-[#38BDF8]" />
                <span>Moteur 1 - Nominal</span>
              </div>
              <div class="flex items-center gap-1.5 rounded-lg bg-[#112240] p-2 text-slate-200">
                <app-icon name="rotate" [size]="12" class="text-[#38BDF8]" />
                <span>Moteur 2 - Nominal</span>
              </div>
              <div class="flex items-center gap-1.5 rounded-lg bg-[#112240] p-2 text-slate-200">
                <app-icon name="rotate" [size]="12" class="text-[#38BDF8]" />
                <span>Moteur 3 - Nominal</span>
              </div>
              <div class="flex items-center gap-1.5 rounded-lg bg-[#112240] p-2 text-slate-200">
                <app-icon name="rotate" [size]="12" class="text-[#38BDF8]" />
                <span>Moteur 4 - Nominal</span>
              </div>
            </div>
          </div>

          <!-- CARTE 4 : Détection d'obstacles -->
          <div class="rounded-2xl border border-[#1E3A5F] bg-[#0A192F]/95 p-3.5 shadow-xl">
            <div class="flex items-center gap-2 pb-2">
              <app-icon name="crosshair" [size]="16" class="text-[#38BDF8]" />
              <span class="text-sm font-extrabold text-white">Détection d'obstacles</span>
            </div>
            <div class="flex items-center gap-3 rounded-lg bg-[#112240] p-2.5">
              <span class="text-sm font-bold text-white">✛</span>
              <div class="h-2 flex-1 overflow-hidden rounded-full bg-[#1E293B]">
                <div class="h-full bg-gradient-to-r from-[#10B981] to-[#34D399]" style="width: 25%;"></div>
              </div>
              <span class="text-xs font-semibold text-[#34D399]">Aucun obstacle détecté</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class PilotagePage {
  protected readonly backend = inject(BackendService);
  protected readonly drones = inject(DroneService);
  protected readonly flightControl = inject(FlightControlService);
  protected readonly telemetry = inject(TelemetryService);
  private readonly notifications = inject(NotificationService);

  readonly demoVideoUrl = APP_SETTINGS.demoVideoSources?.[0] ?? '';

  readonly isArmed = signal(true);
  readonly isPaused = signal(false);

  // Drone actuellement sélectionné
  readonly currentDrone = computed(() => this.drones.selected());
  readonly isFlying = computed(() => this.currentDrone()?.status === 'in-flight');
  readonly motorsRunning = computed(() => true);

  // Valeurs exactes 2400, 2380, 2410, 2395 RPM comme sur la maquette
  readonly m1 = computed(() => ({ rpm: 2400, temp: 42, pct: 75 }));
  readonly m2 = computed(() => ({ rpm: 2380, temp: 41, pct: 74 }));
  readonly m3 = computed(() => ({ rpm: 2410, temp: 43, pct: 76 }));
  readonly m4 = computed(() => ({ rpm: 2395, temp: 42, pct: 75 }));

  onSelectDrone(id: string): void {
    this.drones.select(id);
  }

  toggleArm(): void {
    const d = this.currentDrone();
    if (!d) return;

    if (this.isArmed()) {
      this.isArmed.set(false);
      this.notifications.push(`Moteurs de ${d.name} désarmés.`, 'info');
      this.backend.recordHistory('desarmement_moteurs', `Désarmement des propulseurs pour ${d.name}`, d.id);
    } else {
      this.isArmed.set(true);
      this.notifications.success(`Moteurs de ${d.name} armés : régime nominal engagé.`);
      this.backend.recordHistory('armement_moteurs', `Armement des propulseurs (2400 RPM) pour ${d.name}`, d.id);
    }
  }

  onTakeOff(): void {
    const d = this.currentDrone();
    if (!d) return;
    this.isArmed.set(true);
    this.isPaused.set(false);
    this.flightControl.takeOff(d.id, 'manual', 12.0);
    this.backend.recordHistory('demarrage_vol', `Décollage manuel de ${d.name} à 15 km/h`, d.id);
    this.notifications.success(`Décollage de ${d.name} initié.`);
  }

  onLand(): void {
    const d = this.currentDrone();
    if (!d) return;
    this.flightControl.land(d.id);
    this.isArmed.set(false);
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
      this.notifications.push(`Mission suspendue : ${d.name} en vol stationnaire.`, 'info');
      this.backend.recordHistory('pause_vol', `Suspension du vol de ${d.name} en vol stationnaire (Hover)`, d.id);
    } else {
      this.flightControl.setMode(d.id, 'auto');
      this.notifications.success(`Reprise de mission pour ${d.name}.`);
      this.backend.recordHistory('reprise_vol', `Reprise du vol automatique pour ${d.name}`, d.id);
    }
  }
}
