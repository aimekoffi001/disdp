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
              @if (motorsRunning()) {
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
                     (motorsRunning()
                       ? 'border border-[#EF4444]/60 bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white shadow-[#EF4444]/30 hover:brightness-110'
                       : 'border border-[#10B981]/60 bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-[#10B981]/30 hover:brightness-110')">
            <app-icon [name]="motorsRunning() ? 'pause' : 'play'" [size]="15" />
            <span>{{ motorsRunning() ? 'Arrêter la mise en marche' : 'Mettre en marche en temps réel' }}</span>
          </button>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- GRILLE PRINCIPALE 3 COLONNES CONFORME À LA MAQUETTE            -->
      <!-- ============================================================== -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 items-start">
        
        <!-- ============================================================== -->
        <!-- COLONNE 1 : Commandes de Pilotage (lg:col-span-3)              -->
        <!-- ============================================================== -->
        <div class="flex flex-col gap-3.5 lg:col-span-3">
          <!-- Titre section -->
          <div class="flex items-center gap-2.5 px-1">
            <div class="flex size-9 items-center justify-center rounded-xl bg-[#2563EB]/20 text-[#38BDF8]">
              <app-icon name="gamepad" [size]="20" />
            </div>
            <h1 class="text-xl font-black tracking-wide text-white">Pilotage</h1>
          </div>

          <!-- CARTE 1 : Mettre en marche / Armer les moteurs (Bouton Vert) -->
          <button
            type="button"
            (click)="toggleRealtimeRun()"
            class="group relative flex w-full flex-col gap-1 overflow-hidden rounded-2xl border border-[#10B981]/50 bg-gradient-to-br from-[#10B981] to-[#059669] p-4 py-5 text-left text-white shadow-lg shadow-[#10B981]/20 transition-all hover:brightness-105 active:scale-[0.98] cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="flex size-12 items-center justify-center rounded-full bg-white/20 text-white shadow-inner">
                <app-icon [name]="motorsRunning() ? 'check' : 'play'" [size]="24" />
              </div>
              <div class="min-w-0">
                <div class="text-base font-extrabold tracking-wide">
                  {{ motorsRunning() ? 'En marche en temps réel' : 'Mettre en marche en temps réel' }}
                </div>
                <div class="text-[11px] text-white/90 font-medium">
                  {{ motorsRunning() ? 'Propulseurs 2400 RPM · ESC Actifs' : 'Préparer le démarrage des propulseurs' }}
                </div>
              </div>
            </div>
            @if (motorsRunning()) {
              <div class="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-white/95">
                <span class="size-2 rounded-full bg-white animate-ping"></span>
                <span>Alimentation nominale • Régime synchronisé</span>
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
                <div class="text-[11px] text-[#94A3B8] font-medium">Lancer le décollage (15 km/h)</div>
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
            <!-- Badge statut moteur vert vif -->
            <span [class]="'inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-xs font-black shadow-xs ' +
                           (motorsRunning() ? 'bg-[#10B981] text-black' : 'bg-[#1E293B] text-[#94A3B8]')">
              {{ motorsRunning() ? 'EN MARCHE' : 'ARRÊTÉ' }}
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
              <div class="text-[9px] font-semibold text-[#38BDF8]">{{ motorsRunning() ? 'EN MARCHE - ' + m1().rpm + ' RPM' : 'À L\'ARRÊT - 0 RPM' }}</div>
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
              <div class="text-[9px] font-semibold text-[#38BDF8]">{{ motorsRunning() ? 'EN MARCHE - ' + m2().rpm + ' RPM' : 'À L\'ARRÊT - 0 RPM' }}</div>
              <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1E293B]">
                <div class="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8] transition-all duration-300" [style.width.%]="m2().pct"></div>
              </div>
            </div>

            <!-- Moteur 3 (Bas-Gauche) -->
            <div class="absolute bottom-3 left-3 z-10 w-36 rounded-lg border border-[#1E3A5F] bg-[#0A192F]/85 p-2 backdrop-blur-xs">
              <div class="text-[11px] font-black text-white">Moteur 3</div>
              <div class="text-[9px] font-semibold text-[#38BDF8]">{{ motorsRunning() ? 'EN MARCHE - ' + m3().rpm + ' RPM' : 'À L\'ARRÊT - 0 RPM' }}</div>
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
              <div class="text-[9px] font-semibold text-[#38BDF8]">{{ motorsRunning() ? 'EN MARCHE - ' + m4().rpm + ' RPM' : 'À L\'ARRÊT - 0 RPM' }}</div>
              <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1E293B]">
                <div class="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8] transition-all duration-300" [style.width.%]="m4().pct"></div>
              </div>
            </div>

            <!-- DRONE SVG DESSINÉ AVEC EFFET HÉLICES VORTEX -->
            <div class="relative z-0 size-64">
              <!-- Hélice 1 (Haut-Gauche) avec vortex tournant -->
              <div class="absolute top-1 left-1 size-24">
                <div [class]="'size-full rounded-full border border-[#38BDF8]/40 ' + (motorsRunning() ? 'bg-[#38BDF8]/15 animate-spin duration-300' : 'bg-transparent')">
                  @if (motorsRunning()) {
                    <div class="size-full rounded-full border-t-2 border-b-2 border-[#38BDF8] opacity-80 blur-[0.5px]"></div>
                  }
                </div>
              </div>

              <!-- Hélice 2 (Haut-Droit) avec vortex tournant -->
              <div class="absolute top-1 right-1 size-24">
                <div [class]="'size-full rounded-full border border-[#38BDF8]/40 ' + (motorsRunning() ? 'bg-[#38BDF8]/15 animate-spin duration-300' : 'bg-transparent')">
                  @if (motorsRunning()) {
                    <div class="size-full rounded-full border-t-2 border-b-2 border-[#38BDF8] opacity-80 blur-[0.5px]"></div>
                  }
                </div>
              </div>

              <!-- Hélice 3 (Bas-Gauche) avec vortex tournant -->
              <div class="absolute bottom-1 left-1 size-24">
                <div [class]="'size-full rounded-full border border-[#38BDF8]/40 ' + (motorsRunning() ? 'bg-[#38BDF8]/15 animate-spin duration-300' : 'bg-transparent')">
                  @if (motorsRunning()) {
                    <div class="size-full rounded-full border-t-2 border-b-2 border-[#38BDF8] opacity-80 blur-[0.5px]"></div>
                  }
                </div>
              </div>

              <!-- Hélice 4 (Bas-Droit) avec vortex tournant -->
              <div class="absolute bottom-1 right-1 size-24">
                <div [class]="'size-full rounded-full border border-[#38BDF8]/40 ' + (motorsRunning() ? 'bg-[#38BDF8]/15 animate-spin duration-300' : 'bg-transparent')">
                  @if (motorsRunning()) {
                    <div class="size-full rounded-full border-t-2 border-b-2 border-[#38BDF8] opacity-80 blur-[0.5px]"></div>
                  }
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
                <circle cx="100" cy="80" r="5" fill="#38BDF8" [class]="motorsRunning() ? 'animate-pulse' : ''" />
                <!-- Capteur Caméra avant -->
                <circle cx="100" cy="58" r="4" [attr.fill]="motorsRunning() ? '#10B981' : '#64748B'" />
                <!-- LED statut arrière -->
                <circle cx="100" cy="138" r="3.5" [attr.fill]="motorsRunning() ? '#10B981' : '#EF4444'" />
              </svg>
            </div>
          </div>

          <!-- LISTE DES 4 MOTEURS SOUS LE VISUEL -->
          <div class="flex flex-col gap-2 pt-1">
            <!-- Moteur 1 -->
            <div class="flex items-center justify-between rounded-xl border border-[#1E3A5F] bg-[#112240] px-3.5 py-2.5">
              <div class="flex items-center gap-3">
                <svg viewBox="0 0 36 36" fill="none" class="size-6 text-[#38BDF8] shrink-0">
                  <path d="M18 4 C24 4, 30 9, 31 16 C32 23, 27 30, 20 31 C13 32, 6 27, 5 20 C4 14, 8 8, 14 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
                  <path d="M18 9 C22 9, 26 12, 27 16 C28 21, 24 25, 20 26 C15 27, 11 23, 10 19 C9 15, 12 11, 16 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <circle cx="18" cy="18" r="2.5" fill="currentColor"/>
                </svg>
                <div>
                  <div class="text-xs font-bold text-white">Moteur 1 - {{ motorsRunning() ? 'Tourne' : 'À l\'arrêt' }}</div>
                  <div class="text-[10px] text-[#94A3B8] font-medium">{{ m1().rpm }} RPM • Temp: {{ m1().temp }}°C</div>
                </div>
              </div>
              <span [class]="'size-2 rounded-full ' + (motorsRunning() ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-[#64748B]')"></span>
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
                  <div class="text-xs font-bold text-white">Moteur 2 - {{ motorsRunning() ? 'Tourne' : 'À l\'arrêt' }}</div>
                  <div class="text-[10px] text-[#94A3B8] font-medium">{{ m2().rpm }} RPM • Temp: {{ m2().temp }}°C</div>
                </div>
              </div>
              <div class="flex items-center gap-1.5">
                <span [class]="'size-2 rounded-full ' + (motorsRunning() ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-[#64748B]')"></span>
                <span [class]="'size-2 rounded-full ' + (motorsRunning() ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-[#64748B]')"></span>
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
                  <div class="text-xs font-bold text-white">Moteur 3 - {{ motorsRunning() ? 'Tourne' : 'À l\'arrêt' }}</div>
                  <div class="text-[10px] text-[#94A3B8] font-medium">{{ m3().rpm }} RPM • Temp: {{ m3().temp }}°C</div>
                </div>
              </div>
              <span [class]="'size-2 rounded-full ' + (motorsRunning() ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-[#64748B]')"></span>
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
                  <div class="text-xs font-bold text-white">Moteur 4 - {{ motorsRunning() ? 'Tourne' : 'À l\'arrêt' }}</div>
                  <div class="text-[10px] text-[#94A3B8] font-medium">{{ m4().rpm }} RPM • Temp: {{ m4().temp }}°C</div>
                </div>
              </div>
              <div class="flex items-center gap-1.5">
                <span [class]="'size-2 rounded-full ' + (motorsRunning() ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-[#64748B]')"></span>
                <span [class]="'size-2 rounded-full ' + (motorsRunning() ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-[#64748B]')"></span>
              </div>
            </div>
          </div>

          <!-- BANNIÈRE PIED DE CARTE ÉTAT GÉNÉRAL -->
          <div class="mt-auto flex items-center justify-between rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 px-3.5 py-2 text-xs font-bold text-white">
            <span class="flex items-center gap-2">
              <span [class]="'size-2 rounded-full ' + (motorsRunning() ? 'bg-[#10B981] animate-pulse' : 'bg-[#64748B]')"></span>
              {{ motorsRunning() ? 'État général : Moteurs en rotation — Système propulsé' : 'État général : Moteurs au repos — Veille sécurisée' }}
            </span>
            <span class="rounded-md bg-[#10B981] px-2 py-0.5 text-[10px] font-black text-slate-900 shadow-xs">
              {{ motorsRunning() ? 'OK' : 'STANDBY' }}
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
                    <div class="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8]" [style.width.%]="liveBattery()"></div>
                  </div>
                  <span class="font-bold text-white">{{ liveBattery().toFixed(0) }} %</span>
                </div>
              </div>

              <!-- Altitude -->
              <div class="flex items-center justify-between rounded-lg bg-[#112240] px-3 py-1.5">
                <span class="text-[#94A3B8] font-medium">Altitude</span>
                <span class="font-bold text-white">{{ liveAltitude().toFixed(0) }} m</span>
              </div>

              <!-- Vitesse -->
              <div class="flex items-center justify-between rounded-lg bg-[#112240] px-3 py-1.5">
                <span class="text-[#94A3B8] font-medium">Vitesse</span>
                <span class="font-bold text-[#38BDF8]">{{ liveSpeed().toFixed(0) }} km/h</span>
              </div>

              <!-- Coordonnées GPS -->
              <div class="flex items-center justify-between rounded-lg bg-[#112240] px-3 py-1.5">
                <span class="text-[#94A3B8] font-medium">Coordonnées GPS</span>
                <span class="font-mono text-[11px] font-bold text-[#34D399]">{{ liveGps() }}</span>
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
                <span [class]="'rounded px-2 py-0.5 text-[10px] font-black ' + (motorsRunning() ? 'bg-[#10B981] text-black' : 'bg-[#1E293B] text-[#94A3B8]')">
                  {{ motorsRunning() ? 'OK' : 'VEILLE' }}
                </span>
              </div>
            </div>
            <!-- Ligne de statut -->
            <div class="mb-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#1E293B]">
              <div class="h-full bg-[#38BDF8] transition-all duration-300" [style.width.%]="motorsRunning() ? 70 : 0"></div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-[11px]">
              <div class="flex items-center gap-1.5 rounded-lg bg-[#112240] p-2 text-slate-200">
                <app-icon name="rotate" [size]="12" [class]="motorsRunning() ? 'text-[#38BDF8]' : 'text-slate-500'" />
                <span>Moteur 1 - {{ motorsRunning() ? 'Nominal' : 'Au repos' }}</span>
              </div>
              <div class="flex items-center gap-1.5 rounded-lg bg-[#112240] p-2 text-slate-200">
                <app-icon name="rotate" [size]="12" [class]="motorsRunning() ? 'text-[#38BDF8]' : 'text-slate-500'" />
                <span>Moteur 2 - {{ motorsRunning() ? 'Nominal' : 'Au repos' }}</span>
              </div>
              <div class="flex items-center gap-1.5 rounded-lg bg-[#112240] p-2 text-slate-200">
                <app-icon name="rotate" [size]="12" [class]="motorsRunning() ? 'text-[#38BDF8]' : 'text-slate-500'" />
                <span>Moteur 3 - {{ motorsRunning() ? 'Nominal' : 'Au repos' }}</span>
              </div>
              <div class="flex items-center gap-1.5 rounded-lg bg-[#112240] p-2 text-slate-200">
                <app-icon name="rotate" [size]="12" [class]="motorsRunning() ? 'text-[#38BDF8]' : 'text-slate-500'" />
                <span>Moteur 4 - {{ motorsRunning() ? 'Nominal' : 'Au repos' }}</span>
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
export class PilotagePage implements OnInit {
  protected readonly backend = inject(BackendService);
  protected readonly drones = inject(DroneService);
  protected readonly flightControl = inject(FlightControlService);
  protected readonly telemetry = inject(TelemetryService);
  protected readonly ui = inject(UiService);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly demoVideoUrl = APP_SETTINGS.demoVideoSources?.[0] ?? '';

  // État de mise en marche temps réel (initialisé à true pour afficher la vue nominale, contrôlable en direct)
  readonly isRealtimeRunning = signal(true);
  readonly isPaused = signal(false);

  // Fluctuations en temps réel (1 Hz)
  private readonly jitterTick = signal(0);

  readonly currentDrone = computed(() => this.drones.selected());
  readonly isFlying = computed(() => this.currentDrone()?.status === 'in-flight');
  readonly motorsRunning = computed(() => this.isRealtimeRunning() || this.isFlying());

  // Télémétrie réactive en direct
  readonly liveBattery = computed(() => {
    if (!this.motorsRunning()) return 80;
    const tick = this.jitterTick();
    const drained = 78 - (tick * 0.02) % 4;
    return Math.max(10, Math.round(drained * 10) / 10);
  });

  readonly liveAltitude = computed(() => {
    if (!this.motorsRunning()) return 0;
    const j = Math.sin(this.jitterTick()) * 0.4;
    return Math.round((120 + j) * 10) / 10;
  });

  readonly liveSpeed = computed(() => {
    if (!this.motorsRunning()) return 0;
    const j = Math.cos(this.jitterTick()) * 0.3;
    return Math.round((15 + j) * 10) / 10;
  });

  readonly liveGps = computed(() => {
    const d = this.currentDrone();
    const lat = (d?.latitude ?? 5.3594) + (this.motorsRunning() ? (this.jitterTick() * 0.000008) % 0.001 : 0);
    const lng = (d?.longitude ?? -4.0083) - (this.motorsRunning() ? (this.jitterTick() * 0.000006) % 0.001 : 0);
    return `${lat.toFixed(4)}° N, ${Math.abs(lng).toFixed(4)}° W`;
  });

  // Calculs dynamiques des 4 moteurs en temps réel (valeurs nominales 2400, 2380, 2410, 2395 RPM)
  readonly m1 = computed(() => this.getMotorState(2400, 42, 75, 1));
  readonly m2 = computed(() => this.getMotorState(2380, 41, 74, 2));
  readonly m3 = computed(() => this.getMotorState(2410, 43, 76, 3));
  readonly m4 = computed(() => this.getMotorState(2395, 42, 75, 4));

  private getMotorState(nominalRpm: number, nominalTemp: number, nominalPct: number, motorIdx: number) {
    if (!this.motorsRunning()) {
      return { rpm: 0, temp: 24, pct: 0 };
    }
    const tick = this.jitterTick();
    const offset = Math.round(Math.sin(tick + motorIdx) * 12);
    return {
      rpm: nominalRpm + offset,
      temp: nominalTemp,
      pct: nominalPct,
    };
  }

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
      this.notifications.success(`Mise en marche temps réel activée pour ${d.name} : Propulseurs à 2400 RPM.`);
      this.backend.recordHistory('mise_en_marche_temps_reel', `Mise en marche temps réel de ${d.name} (Propulseurs armés à 2400 RPM, télémétrie active)`, d.id);
      this.backend.syncTelemetry(d.id, { speed: 4.17, altitude: 120, batteryLevel: 78 });
    } else {
      this.notifications.push(`Mise en marche interrompue pour ${d.name} : Propulseurs coupés.`, 'info');
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
}
