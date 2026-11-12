import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
    <div class="mx-auto flex max-w-[1700px] flex-col gap-4 p-1 sm:p-2">
      <!-- Barre supérieure de sélection du drone -->
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E3A5F] bg-[#0A192F]/90 p-3 shadow-xl backdrop-blur-md">
        <div class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-xl border border-[#38BDF8]/40 bg-[#112240] text-[#38BDF8] shadow-inner">
            <app-icon name="gamepad" [size]="22" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base font-extrabold tracking-wide text-[#F8FAFC]">Cockpit de Pilotage Tactique</span>
              <span class="rounded-full border border-[#38BDF8]/40 bg-[#38BDF8]/15 px-2 py-0.5 text-[10px] font-semibold text-[#38BDF8]">
                TEMPS RÉEL
              </span>
            </div>
            <p class="text-xs text-[#94A3B8]">Contrôle direct des propulseurs, diagnostic des moteurs et télémétrie embarquée</p>
          </div>
        </div>

        <!-- Sélecteur de drone -->
        <div class="flex items-center gap-2.5">
          <span class="text-xs font-semibold text-[#94A3B8]">Drone ciblé :</span>
          <select
            class="rounded-xl border border-[#1E3A5F] bg-[#112240] px-3 py-1.5 text-xs font-bold text-[#F8FAFC] shadow-sm transition hover:border-[#38BDF8] focus:border-[#38BDF8] focus:outline-none"
            [value]="drones.selectedId()"
            (change)="onSelectDrone($any($event.target).value)">
            @for (d of drones.drones(); track d.id) {
              <option [value]="d.id">
                {{ d.name }} ({{ d.code }}) — {{ d.status === 'in-flight' ? 'EN VOL' : 'AU SOL' }} ({{ d.batteryLevel.toFixed(0) }}%)
              </option>
            }
          </select>
        </div>
      </div>

      <!-- Grille Principale 3 Colonnes comme sur la maquette -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        
        <!-- ============================================================== -->
        <!-- COLONNE 1 : Commandes de Pilotage (lg:col-span-3)              -->
        <!-- ============================================================== -->
        <div class="flex flex-col gap-3.5 lg:col-span-3">
          <!-- Titre section -->
          <div class="flex items-center gap-2.5 px-1">
            <app-icon name="gamepad" [size]="20" class="text-[#38BDF8]" />
            <h1 class="text-xl font-black tracking-wide text-white">Pilotage</h1>
          </div>

          <!-- CARTE 1 : Armer les moteurs -->
          <button
            type="button"
            (click)="toggleArm()"
            [class]="'group relative flex w-full flex-col gap-1 overflow-hidden rounded-2xl p-4 text-left shadow-lg transition-all active:scale-[0.98] ' +
                     (motorsRunning()
                       ? 'border border-[#10B981]/50 bg-gradient-to-br from-[#10B981] to-[#047857] text-white shadow-[#10B981]/25 ring-2 ring-[#10B981]/30'
                       : 'border border-[#10B981]/40 bg-[#112240] text-[#E2E8F0] hover:border-[#10B981] hover:bg-[#162C52]')">
            <div class="flex items-center gap-3">
              <div class="flex size-11 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner">
                <app-icon name="play" [size]="22" />
              </div>
              <div class="min-w-0">
                <div class="text-base font-extrabold tracking-wide">
                  {{ isArmed() || isFlying() ? 'Désarmer les moteurs' : 'Armer les moteurs' }}
                </div>
                <div class="text-[11px] text-white/80 font-medium">
                  {{ isArmed() || isFlying() ? 'Régime ralenti engagé' : 'Préparer le démarrage' }}
                </div>
              </div>
            </div>
            @if (motorsRunning()) {
              <div class="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-white/90">
                <span class="size-2 rounded-full bg-white animate-ping"></span>
                <span>Moteurs sous tension • ESC Actifs</span>
              </div>
            }
          </button>

          <!-- CARTE 2 : Décoller -->
          <button
            type="button"
            (click)="onTakeOff()"
            [disabled]="isFlying()"
            [class]="'group relative flex w-full flex-col gap-1 overflow-hidden rounded-2xl border p-4 text-left shadow-lg transition-all ' +
                     (isFlying()
                       ? 'cursor-not-allowed border-[#1E3A5F] bg-[#112240]/50 text-[#64748B]'
                       : 'border-[#38BDF8]/40 bg-[#162C52] text-white hover:border-[#38BDF8] hover:bg-[#1C3B72] active:scale-[0.98]')">
            <div class="flex items-center gap-3">
              <div class="flex size-11 items-center justify-center rounded-xl bg-[#38BDF8]/20 text-[#38BDF8] shadow-inner">
                <app-icon name="rocket" [size]="22" />
              </div>
              <div class="min-w-0">
                <div class="text-base font-extrabold tracking-wide text-white">Décoller</div>
                <div class="text-[11px] text-[#94A3B8] font-medium">Lancer le décollage</div>
              </div>
            </div>
          </button>

          <!-- CARTE 3 : Atterrir -->
          <button
            type="button"
            (click)="onLand()"
            [disabled]="!isFlying()"
            [class]="'group relative flex w-full flex-col gap-1 overflow-hidden rounded-2xl border p-4 text-left shadow-lg transition-all ' +
                     (!isFlying()
                       ? 'cursor-not-allowed border-[#1E3A5F] bg-[#112240]/40 text-[#64748B]'
                       : 'border-[#EF4444]/60 bg-gradient-to-br from-[#EF4444] to-[#B91C1C] text-white shadow-[#EF4444]/25 hover:from-[#DC2626] hover:to-[#991B1B] active:scale-[0.98]')">
            <div class="flex items-center gap-3">
              <div class="flex size-11 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner">
                <app-icon name="landing" [size]="22" />
              </div>
              <div class="min-w-0">
                <div class="text-base font-extrabold tracking-wide">Atterrir</div>
                <div class="text-[11px] text-white/80 font-medium">Déclencher l'atterrissage</div>
              </div>
            </div>
          </button>

          <!-- CARTE 4 : Pause de mission -->
          <button
            type="button"
            (click)="onTogglePause()"
            [class]="'group relative flex w-full flex-col gap-1 overflow-hidden rounded-2xl border p-4 text-left shadow-lg transition-all ' +
                     (isPaused()
                       ? 'border-[#F59E0B]/60 bg-gradient-to-br from-[#F59E0B] to-[#D97706] text-white'
                       : 'border-[#1E3A5F] bg-[#112240] text-[#E2E8F0] hover:border-[#38BDF8] hover:bg-[#162C52] active:scale-[0.98]')">
            <div class="flex items-center gap-3">
              <div class="flex size-11 items-center justify-center rounded-xl bg-white/10 text-white shadow-inner">
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

          <!-- Réglage vitesse rapide -->
          <div class="mt-1 rounded-2xl border border-[#1E3A5F] bg-[#0A192F]/80 p-3.5 shadow-md">
            <div class="flex items-center justify-between text-xs font-bold text-[#F8FAFC]">
              <span class="flex items-center gap-1.5 text-[#38BDF8]">
                <app-icon name="gauge" [size]="14" />
                Vitesse cible
              </span>
              <span class="text-sm font-extrabold text-[#38BDF8]">{{ currentSpeed().toFixed(1) }} m/s ({{ (currentSpeed() * 3.6).toFixed(0) }} km/h)</span>
            </div>
            <div class="mt-2.5 flex items-center gap-2">
              <button
                type="button"
                (click)="adjustSpeed(-2)"
                [disabled]="!isFlying()"
                class="flex-1 rounded-lg border border-[#1E3A5F] bg-[#112240] py-1.5 text-xs font-bold text-white transition hover:border-[#38BDF8] hover:bg-[#162C52] disabled:opacity-40">
                - 2 m/s
              </button>
              <button
                type="button"
                (click)="adjustSpeed(2)"
                [disabled]="!isFlying()"
                class="flex-1 rounded-lg border border-[#1E3A5F] bg-[#112240] py-1.5 text-xs font-bold text-white transition hover:border-[#38BDF8] hover:bg-[#162C52] disabled:opacity-40">
                + 2 m/s
              </button>
            </div>
          </div>
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
            <!-- Badge statut moteur -->
            <span
              [class]="'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black tracking-wider shadow-sm ' +
                       (motorsRunning()
                         ? 'border border-[#10B981]/50 bg-[#10B981]/20 text-[#34D399]'
                         : 'border border-[#64748B]/40 bg-[#1E293B] text-[#94A3B8]')">
              <span [class]="'size-2 rounded-full ' + (motorsRunning() ? 'bg-[#10B981] animate-pulse' : 'bg-[#64748B]')"></span>
              {{ motorsRunning() ? 'EN MARCHE' : 'ARRÊTÉ' }}
            </span>
          </div>

          <!-- VISUEL DU DRONE VUE DU DESSUS & HÉLICES ROTATIVES -->
          <div class="relative flex min-h-[340px] items-center justify-center overflow-hidden rounded-xl border border-[#1E3A5F]/60 bg-[#071326] p-4">
            <!-- Cercles concentriques radar de fond -->
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-25">
              <div class="size-64 rounded-full border border-dashed border-[#38BDF8]/40"></div>
              <div class="absolute size-44 rounded-full border border-[#38BDF8]/20"></div>
              <div class="absolute size-24 rounded-full border border-[#38BDF8]/30"></div>
            </div>

            <!-- OVERLAYS DES 4 MOTEURS AUX 4 COINS -->
            <!-- Moteur 1 (Haut-Gauche) -->
            <div class="absolute top-3 left-3 z-10 w-36 rounded-lg border border-[#1E3A5F] bg-[#0A192F]/85 p-2 backdrop-blur-xs">
              <div class="text-[11px] font-black text-white">Moteur 1</div>
              <div class="text-[9px] font-semibold text-[#38BDF8]">{{ m1().label }}</div>
              <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1E293B]">
                <div class="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8] transition-all duration-300" [style.width.%]="m1().pct"></div>
              </div>
            </div>

            <!-- Moteur 2 (Haut-Droit) -->
            <div class="absolute top-3 right-3 z-10 w-36 rounded-lg border border-[#1E3A5F] bg-[#0A192F]/85 p-2 backdrop-blur-xs text-right">
              <div class="flex items-center justify-end gap-1">
                <span class="text-[11px] font-black text-white">Moteur 2</span>
                <app-icon name="rotate" [size]="11" class="text-[#38BDF8]" />
              </div>
              <div class="text-[9px] font-semibold text-[#38BDF8]">{{ m2().label }}</div>
              <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1E293B]">
                <div class="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8] transition-all duration-300" [style.width.%]="m2().pct"></div>
              </div>
            </div>

            <!-- Moteur 3 (Bas-Gauche) -->
            <div class="absolute bottom-3 left-3 z-10 w-36 rounded-lg border border-[#1E3A5F] bg-[#0A192F]/85 p-2 backdrop-blur-xs">
              <div class="text-[11px] font-black text-white">Moteur 3</div>
              <div class="text-[9px] font-semibold text-[#38BDF8]">{{ m3().label }}</div>
              <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1E293B]">
                <div class="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8] transition-all duration-300" [style.width.%]="m3().pct"></div>
              </div>
            </div>

            <!-- Moteur 4 (Bas-Droit) -->
            <div class="absolute bottom-3 right-3 z-10 w-36 rounded-lg border border-[#1E3A5F] bg-[#0A192F]/85 p-2 backdrop-blur-xs text-right">
              <div class="flex items-center justify-end gap-1">
                <span class="text-[11px] font-black text-white">Moteur 4</span>
                <app-icon name="rotate" [size]="11" class="text-[#38BDF8]" />
              </div>
              <div class="text-[9px] font-semibold text-[#38BDF8]">{{ m4().label }}</div>
              <div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#1E293B]">
                <div class="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8] transition-all duration-300" [style.width.%]="m4().pct"></div>
              </div>
            </div>

            <!-- DRONE SVG DESSINÉ AVEC EFFET HÉLICES VORTEX -->
            <div class="relative z-0 size-60">
              <!-- Bras 1 (Haut-Gauche) avec Hélice -->
              <div class="absolute top-2 left-2 size-20">
                <div [class]="'size-full rounded-full border border-[#38BDF8]/40 ' + (motorsRunning() ? 'bg-[#38BDF8]/15 animate-spin duration-300' : 'bg-transparent')">
                  @if (motorsRunning()) {
                    <div class="size-full rounded-full border-t-2 border-b-2 border-[#38BDF8] opacity-80 blur-[0.5px]"></div>
                  }
                </div>
              </div>

              <!-- Bras 2 (Haut-Droit) avec Hélice -->
              <div class="absolute top-2 right-2 size-20">
                <div [class]="'size-full rounded-full border border-[#38BDF8]/40 ' + (motorsRunning() ? 'bg-[#38BDF8]/15 animate-spin duration-300' : 'bg-transparent')">
                  @if (motorsRunning()) {
                    <div class="size-full rounded-full border-t-2 border-b-2 border-[#38BDF8] opacity-80 blur-[0.5px]"></div>
                  }
                </div>
              </div>

              <!-- Bras 3 (Bas-Gauche) avec Hélice -->
              <div class="absolute bottom-2 left-2 size-20">
                <div [class]="'size-full rounded-full border border-[#38BDF8]/40 ' + (motorsRunning() ? 'bg-[#38BDF8]/15 animate-spin duration-300' : 'bg-transparent')">
                  @if (motorsRunning()) {
                    <div class="size-full rounded-full border-t-2 border-b-2 border-[#38BDF8] opacity-80 blur-[0.5px]"></div>
                  }
                </div>
              </div>

              <!-- Bras 4 (Bas-Droit) avec Hélice -->
              <div class="absolute bottom-2 right-2 size-20">
                <div [class]="'size-full rounded-full border border-[#38BDF8]/40 ' + (motorsRunning() ? 'bg-[#38BDF8]/15 animate-spin duration-300' : 'bg-transparent')">
                  @if (motorsRunning()) {
                    <div class="size-full rounded-full border-t-2 border-b-2 border-[#38BDF8] opacity-80 blur-[0.5px]"></div>
                  }
                </div>
              </div>

              <!-- Châssis Central du Drone (Fuselage Carbone) -->
              <svg viewBox="0 0 200 200" class="absolute inset-0 size-full filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
                <!-- Bras en X -->
                <line x1="45" y1="45" x2="155" y2="155" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
                <line x1="155" y1="45" x2="45" y2="155" stroke="#1E293B" stroke-width="10" stroke-linecap="round" />
                <line x1="45" y1="45" x2="155" y2="155" stroke="#38BDF8" stroke-width="2" opacity="0.4" />
                <line x1="155" y1="45" x2="45" y2="155" stroke="#38BDF8" stroke-width="2" opacity="0.4" />

                <!-- Moteurs Brushless -->
                <circle cx="45" cy="45" r="10" fill="#0F172A" stroke="#38BDF8" stroke-width="2.5" />
                <circle cx="155" cy="45" r="10" fill="#0F172A" stroke="#38BDF8" stroke-width="2.5" />
                <circle cx="45" cy="155" r="10" fill="#0F172A" stroke="#38BDF8" stroke-width="2.5" />
                <circle cx="155" cy="155" r="10" fill="#0F172A" stroke="#38BDF8" stroke-width="2.5" />

                <!-- Corps aérodynamique principal -->
                <rect x="75" y="60" width="50" height="80" rx="20" fill="#1E293B" stroke="#334155" stroke-width="2" />
                <!-- Verrière / Canopy -->
                <rect x="85" y="70" width="30" height="40" rx="10" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5" />
                <circle cx="100" cy="85" r="4" fill="#38BDF8" class="animate-pulse" />
                <!-- LED statut arrière -->
                <circle cx="100" cy="130" r="3" [attr.fill]="motorsRunning() ? '#10B981' : '#EF4444'" />
              </svg>
            </div>
          </div>

          <!-- LISTE DES 4 MOTEURS SOUS LE VISUEL -->
          <div class="flex flex-col gap-2 pt-1">
            <!-- Moteur 1 -->
            <div class="flex items-center justify-between rounded-xl border border-[#1E3A5F] bg-[#112240] px-3.5 py-2.5">
              <div class="flex items-center gap-2.5">
                <div [class]="'size-5 text-[#38BDF8] ' + (motorsRunning() ? 'animate-spin' : '')">
                  <app-icon name="rotate" [size]="18" />
                </div>
                <div>
                  <div class="text-xs font-bold text-white">Moteur 1 - {{ motorsRunning() ? 'Tourne' : 'À l\'arrêt' }}</div>
                  <div class="text-[10px] text-[#94A3B8] font-medium">{{ m1().rpm }} RPM • Temp: {{ m1().temp }}°C</div>
                </div>
              </div>
              <span [class]="'size-2.5 rounded-full ' + (motorsRunning() ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-[#64748B]')"></span>
            </div>

            <!-- Moteur 2 -->
            <div class="flex items-center justify-between rounded-xl border border-[#1E3A5F] bg-[#112240] px-3.5 py-2.5">
              <div class="flex items-center gap-2.5">
                <div [class]="'size-5 text-[#38BDF8] ' + (motorsRunning() ? 'animate-spin' : '')">
                  <app-icon name="rotate" [size]="18" />
                </div>
                <div>
                  <div class="text-xs font-bold text-white">Moteur 2 - {{ motorsRunning() ? 'Tourne' : 'À l\'arrêt' }}</div>
                  <div class="text-[10px] text-[#94A3B8] font-medium">{{ m2().rpm }} RPM • Temp: {{ m2().temp }}°C</div>
                </div>
              </div>
              <span [class]="'size-2.5 rounded-full ' + (motorsRunning() ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-[#64748B]')"></span>
            </div>

            <!-- Moteur 3 -->
            <div class="flex items-center justify-between rounded-xl border border-[#1E3A5F] bg-[#112240] px-3.5 py-2.5">
              <div class="flex items-center gap-2.5">
                <div [class]="'size-5 text-[#38BDF8] ' + (motorsRunning() ? 'animate-spin' : '')">
                  <app-icon name="rotate" [size]="18" />
                </div>
                <div>
                  <div class="text-xs font-bold text-white">Moteur 3 - {{ motorsRunning() ? 'Tourne' : 'À l\'arrêt' }}</div>
                  <div class="text-[10px] text-[#94A3B8] font-medium">{{ m3().rpm }} RPM • Temp: {{ m3().temp }}°C</div>
                </div>
              </div>
              <span [class]="'size-2.5 rounded-full ' + (motorsRunning() ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-[#64748B]')"></span>
            </div>

            <!-- Moteur 4 -->
            <div class="flex items-center justify-between rounded-xl border border-[#1E3A5F] bg-[#112240] px-3.5 py-2.5">
              <div class="flex items-center gap-2.5">
                <div [class]="'size-5 text-[#38BDF8] ' + (motorsRunning() ? 'animate-spin' : '')">
                  <app-icon name="rotate" [size]="18" />
                </div>
                <div>
                  <div class="text-xs font-bold text-white">Moteur 4 - {{ motorsRunning() ? 'Tourne' : 'À l\'arrêt' }}</div>
                  <div class="text-[10px] text-[#94A3B8] font-medium">{{ m4().rpm }} RPM • Temp: {{ m4().temp }}°C</div>
                </div>
              </div>
              <span [class]="'size-2.5 rounded-full ' + (motorsRunning() ? 'bg-[#10B981] shadow-[0_0_8px_#10B981]' : 'bg-[#64748B]')"></span>
            </div>
          </div>

          <!-- BANNIÈRE PIED DE CARTE ÉTAT GÉNÉRAL -->
          <div class="mt-auto flex items-center justify-between rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 px-3.5 py-2 text-xs font-bold text-white">
            <span class="flex items-center gap-2">
              <span class="size-2 rounded-full bg-[#10B981] animate-pulse"></span>
              {{ motorsRunning() ? 'État général: Moteurs en rotation — Système propulsé' : 'État général: Système au repos — Veille sécurisée' }}
            </span>
            <span class="rounded-md bg-[#10B981] px-2 py-0.5 text-[10px] font-black text-slate-900 shadow-xs">
              {{ motorsRunning() ? 'OK' : 'STANDBY' }}
            </span>
          </div>
        </div>

        <!-- ============================================================== -->
        <!-- COLONNE 3 : Vidéo, Télémétrie, Diagnostics (lg:col-span-4)     -->
        <!-- ============================================================== -->
        <div class="flex flex-col gap-3 lg:col-span-4">
          
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

            <!-- Cadre d'aperçu caméra avec HUD embarqué -->
            <div class="relative aspect-video w-full overflow-hidden rounded-xl border border-[#1E3A5F] bg-[#030914] shadow-inner">
              <!-- Grille / Réticule de visée central -->
              <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div class="relative size-16">
                  <div class="absolute inset-x-0 top-1/2 h-[1px] bg-[#38BDF8]/40"></div>
                  <div class="absolute inset-y-0 left-1/2 w-[1px] bg-[#38BDF8]/40"></div>
                  <div class="absolute inset-2 rounded-full border border-dashed border-[#38BDF8]/60"></div>
                </div>
              </div>

              <!-- Horizon artificiel simplifié -->
              <div class="pointer-events-none absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-mono font-bold text-[#34D399]">
                FPS: 60 • 4K HDR
              </div>
              <div class="pointer-events-none absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] font-mono font-bold text-[#38BDF8]">
                CAM_01 • PITCH: +1.2° • ROLL: -0.4°
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
                  <div class="h-2 w-20 overflow-hidden rounded-full bg-[#1E293B]">
                    <div class="h-full bg-gradient-to-r from-[#10B981] to-[#38BDF8]" [style.width.%]="battery()"></div>
                  </div>
                  <span class="font-bold text-white">{{ battery().toFixed(0) }} %</span>
                </div>
              </div>

              <!-- Altitude -->
              <div class="flex items-center justify-between rounded-lg bg-[#112240] px-3 py-1.5">
                <span class="text-[#94A3B8] font-medium">Altitude</span>
                <span class="font-bold text-white">{{ altitude().toFixed(0) }} m</span>
              </div>

              <!-- Vitesse -->
              <div class="flex items-center justify-between rounded-lg bg-[#112240] px-3 py-1.5">
                <span class="text-[#94A3B8] font-medium">Vitesse</span>
                <span class="font-bold text-[#38BDF8]">{{ speedKmh().toFixed(0) }} km/h</span>
              </div>

              <!-- Coordonnées GPS -->
              <div class="flex items-center justify-between rounded-lg bg-[#112240] px-3 py-1.5">
                <span class="text-[#94A3B8] font-medium">Coordonnées GPS</span>
                <span class="font-mono text-[11px] font-bold text-[#34D399]">{{ gpsCoords() }}</span>
              </div>
            </div>
          </div>

          <!-- CARTE 3 : Diagnostic des moteurs (Résumé) -->
          <div class="rounded-2xl border border-[#1E3A5F] bg-[#0A192F]/95 p-3.5 shadow-xl">
            <div class="flex items-center justify-between pb-2.5">
              <div class="flex items-center gap-2">
                <app-icon name="wrench" [size]="16" class="text-[#38BDF8]" />
                <span class="text-sm font-extrabold text-white">Diagnostic des moteurs</span>
              </div>
              <span class="rounded bg-[#10B981]/20 px-2 py-0.5 text-[10px] font-black text-[#34D399] border border-[#10B981]/30">
                OK
              </span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-[11px]">
              <div class="flex items-center gap-1.5 rounded-lg bg-[#112240] p-2 text-slate-200">
                <app-icon name="rotate" [size]="12" class="text-[#10B981]" />
                <span>Moteur 1 - Nominal</span>
              </div>
              <div class="flex items-center gap-1.5 rounded-lg bg-[#112240] p-2 text-slate-200">
                <app-icon name="rotate" [size]="12" class="text-[#10B981]" />
                <span>Moteur 2 - Nominal</span>
              </div>
              <div class="flex items-center gap-1.5 rounded-lg bg-[#112240] p-2 text-slate-200">
                <app-icon name="rotate" [size]="12" class="text-[#10B981]" />
                <span>Moteur 3 - Nominal</span>
              </div>
              <div class="flex items-center gap-1.5 rounded-lg bg-[#112240] p-2 text-slate-200">
                <app-icon name="rotate" [size]="12" class="text-[#10B981]" />
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
              <div class="h-2 w-28 overflow-hidden rounded-full bg-[#1E293B]">
                <div class="h-full bg-gradient-to-r from-[#10B981] to-[#34D399]" style="width: 85%;"></div>
              </div>
              <span class="text-xs font-bold text-[#34D399]">Aucun obstacle détecté</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class PilotagePage {
  protected readonly drones = inject(DroneService);
  protected readonly flightControl = inject(FlightControlService);
  protected readonly telemetry = inject(TelemetryService);
  private readonly notifications = inject(NotificationService);

  readonly isArmed = signal(false);
  readonly isPaused = signal(false);

  // Drone actuellement sélectionné
  readonly currentDrone = computed(() => this.drones.selected());
  readonly isFlying = computed(() => this.currentDrone()?.status === 'in-flight');
  readonly motorsRunning = computed(() => this.isFlying() || this.isArmed());

  readonly currentSpeed = computed(() => {
    const d = this.currentDrone();
    return (d && this.isFlying()) ? (d.speed || 12.0) : 0;
  });

  readonly speedKmh = computed(() => this.currentSpeed() * 3.6);
  readonly battery = computed(() => this.currentDrone()?.batteryLevel ?? 85);
  readonly altitude = computed(() => {
    const d = this.currentDrone();
    return this.isFlying() ? (d?.altitude && d.altitude > 0 ? d.altitude : 120) : 0;
  });

  readonly gpsCoords = computed(() => {
    const d = this.currentDrone();
    if (d?.latitude && d?.longitude) {
      return `${d.latitude.toFixed(4)}° N, ${Math.abs(d.longitude).toFixed(4)}° W`;
    }
    return '5.3594° N, -4.0083° W';
  });

  // Calculs dynamiques des 4 moteurs
  readonly m1 = computed(() => this.calcMotor(1, 10, 42));
  readonly m2 = computed(() => this.calcMotor(2, -15, 41));
  readonly m3 = computed(() => this.calcMotor(3, 15, 43));
  readonly m4 = computed(() => this.calcMotor(4, 0, 42));

  private calcMotor(index: number, rpmOffset: number, baseTemp: number) {
    if (!this.motorsRunning()) {
      return { rpm: 0, temp: 24, label: 'À L\'ARRÊT - 0 RPM', pct: 0 };
    }
    const isFlight = this.isFlying();
    const speed = this.currentSpeed();
    const baseRpm = isFlight ? Math.round(2300 + speed * 20) : 850;
    const rpm = baseRpm + rpmOffset;
    const temp = isFlight ? Math.round(baseTemp + (speed / 10) * 1.5) : 28;
    const pct = Math.min(100, Math.round((rpm / 3200) * 100));
    return {
      rpm,
      temp,
      label: `EN MARCHE - ${rpm} RPM`,
      pct,
    };
  }

  onSelectDrone(id: string): void {
    this.drones.select(id);
    const d = this.drones.byId(id);
    if (d?.status === 'in-flight') {
      this.isArmed.set(true);
    } else {
      this.isArmed.set(false);
    }
  }

  toggleArm(): void {
    const d = this.currentDrone();
    if (!d) return;

    if (this.isFlying()) {
      this.notifications.push('Le drone est en plein vol : impossible de couper les moteurs directement.', 'warning');
      return;
    }

    if (this.isArmed()) {
      this.isArmed.set(false);
      this.notifications.push(`Moteurs de ${d.name} désarmés.`, 'info');
    } else {
      this.isArmed.set(true);
      this.notifications.success(`Moteurs de ${d.name} armés : régime ralenti engagé (850 RPM). Prêt pour le décollage.`);
    }
  }

  onTakeOff(): void {
    const d = this.currentDrone();
    if (!d) return;
    this.isArmed.set(true);
    this.isPaused.set(false);
    this.flightControl.takeOff(d.id, 'manual', 12.0);
  }

  onLand(): void {
    const d = this.currentDrone();
    if (!d) return;
    this.flightControl.land(d.id);
    this.isArmed.set(false);
    this.isPaused.set(false);
  }

  onTogglePause(): void {
    const d = this.currentDrone();
    if (!d) return;
    const nextState = !this.isPaused();
    this.isPaused.set(nextState);
    if (nextState) {
      this.flightControl.setMode(d.id, 'semi-auto');
      this.notifications.push(`Mission suspendue : ${d.name} en vol stationnaire (Hover / Semi-Auto).`, 'info');
    } else {
      this.flightControl.setMode(d.id, 'auto');
      this.notifications.success(`Reprise de mission pour ${d.name}.`);
    }
  }

  adjustSpeed(delta: number): void {
    const d = this.currentDrone();
    if (!d || !this.isFlying()) return;
    if (delta > 0) {
      this.flightControl.increaseSpeed(d.id, delta);
    } else {
      this.flightControl.decreaseSpeed(d.id, Math.abs(delta));
    }
  }
}
