import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BackendService } from '../../../../core/services/backend.service';
import { DroneService } from '../../../../core/services/drone.service';
import { FlightControlService } from '../../../../core/services/flight-control.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TelemetryService } from '../../../../core/services/telemetry.service';
import { UiService } from '../../../../core/services/ui.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-pilotage-panel',
  standalone: true,
  imports: [CommonModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel h-full flex flex-col gap-3">
      <!-- En-tête du panneau de Pilotage -->
      <div class="panel-title flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#1E3A5F]/70">
        <div class="flex items-center gap-2">
          <div class="flex size-7 items-center justify-center rounded-lg bg-[#2563EB]/20 text-[#38BDF8]">
            <app-icon name="gamepad" [size]="16" />
          </div>
          <span class="text-sm font-extrabold text-[#F8FAFC]">Commandes de Pilotage</span>
          @if (isFlying() || isRealtimeRunning()) {
            <span class="inline-flex items-center gap-1 rounded-full border border-[#10B981]/50 bg-[#10B981]/20 px-2 py-0.5 text-[10px] font-black text-[#34D399]">
              <span class="size-1.5 rounded-full bg-[#10B981] animate-ping"></span>
              EN MARCHE
            </span>
          } @else {
            <span class="rounded-full border border-[#64748B]/40 bg-[#1E293B] px-2 py-0.5 text-[10px] font-semibold text-[#94A3B8]">
              AU REPOS
            </span>
          }
        </div>

        <!-- Bouton Connecter un drone -->
        <button
          type="button"
          (click)="ui.openDroneForm()"
          class="inline-flex items-center gap-1.5 rounded-lg border border-[#38BDF8]/50 bg-[#0C244A] px-2.5 py-1 text-[11px] font-bold text-[#38BDF8] transition hover:bg-[#13386E] hover:text-white cursor-pointer shadow-xs">
          <app-icon name="plus" [size]="12" />
          <span>Connecter un drone</span>
        </button>
      </div>

      <!-- Informations de liaison du drone actuel -->
      <div class="flex items-center justify-between rounded-xl bg-[#081528] px-3 py-2 border border-[#1E3A5F]/50 text-xs">
        <div class="flex items-center gap-2">
          <span class="size-2 rounded-full bg-[#10B981]"></span>
          <span class="text-[#94A3B8]">Drone ciblé :</span>
          <span class="font-extrabold text-[#F8FAFC]">{{ currentDrone()?.name ?? 'Aucun drone' }}</span>
        </div>
        <span class="text-[10px] font-semibold text-[#34D399]">Liaison 5.8 GHz Active</span>
      </div>

      <!-- Grille des 4 Grandes Commandes Tactiles -->
      <div class="flex flex-col gap-2.5">
        <!-- 1. Mettre en marche / Arrêter -->
        <button
          type="button"
          (click)="toggleRealtimeRun()"
          class="group relative flex w-full flex-col gap-0.5 overflow-hidden rounded-xl border border-[#10B981]/50 bg-gradient-to-br from-[#10B981] to-[#059669] p-3 text-left text-white shadow-md shadow-[#10B981]/20 transition-all hover:brightness-105 active:scale-[0.98] cursor-pointer">
          <div class="flex items-center gap-2.5">
            <div class="flex size-9 items-center justify-center rounded-full bg-white/20 text-white shadow-inner">
              <app-icon [name]="(isFlying() || isRealtimeRunning()) ? 'check' : 'play'" [size]="18" />
            </div>
            <div class="min-w-0">
              <div class="text-xs font-black tracking-wide">
                {{ (isFlying() || isRealtimeRunning()) ? 'Arrêter la mise en marche' : 'Mettre en marche en temps réel' }}
              </div>
              <div class="text-[10px] text-white/90 font-medium">
                {{ (isFlying() || isRealtimeRunning()) ? 'Propulseurs armés • Télémétrie 1 Hz' : 'Préparer le démarrage des propulseurs' }}
              </div>
            </div>
          </div>
        </button>

        <!-- 2. Décoller -->
        <button
          type="button"
          (click)="onTakeOff()"
          [disabled]="isFlying()"
          [class]="'group relative flex w-full flex-col gap-0.5 overflow-hidden rounded-xl border p-3 text-left shadow-sm transition-all ' +
                   (isFlying()
                     ? 'cursor-not-allowed border-[#1E3A5F] bg-[#112240]/50 text-[#64748B]'
                     : 'border-[#1E3A8A]/60 bg-[#172554] text-white hover:bg-[#1E3A8A] active:scale-[0.98] cursor-pointer')">
          <div class="flex items-center gap-2.5">
            <div class="flex size-9 items-center justify-center rounded-xl bg-white/10 text-white shadow-inner">
              <app-icon name="rocket" [size]="18" />
            </div>
            <div class="min-w-0">
              <div class="text-xs font-black tracking-wide text-white">Décoller</div>
              <div class="text-[10px] text-[#94A3B8] font-medium">Lancer le décollage (15 km/h · 120 m)</div>
            </div>
          </div>
        </button>

        <!-- 3. Atterrir -->
        <button
          type="button"
          (click)="onLand()"
          [disabled]="!isFlying()"
          [class]="'group relative flex w-full flex-col gap-0.5 overflow-hidden rounded-xl border p-3 text-left shadow-sm transition-all ' +
                   (!isFlying()
                     ? 'cursor-not-allowed border-[#1E3A5F] bg-[#112240]/40 text-[#64748B]'
                     : 'border-[#EF4444]/60 bg-gradient-to-br from-[#EF4444] to-[#B91C1C] text-white shadow-[#EF4444]/25 hover:from-[#DC2626] hover:to-[#991B1B] active:scale-[0.98] cursor-pointer')">
          <div class="flex items-center gap-2.5">
            <div class="flex size-9 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner">
              <app-icon name="landing" [size]="18" />
            </div>
            <div class="min-w-0">
              <div class="text-xs font-black tracking-wide">Atterrir</div>
              <div class="text-[10px] text-white/80 font-medium">Déclencher l'atterrissage sécurisé</div>
            </div>
          </div>
        </button>

        <!-- 4. Pause de mission -->
        <button
          type="button"
          (click)="onTogglePause()"
          class="group relative flex w-full flex-col gap-0.5 overflow-hidden rounded-xl border border-[#1E3A5F] bg-[#102038] p-3 text-left text-[#E2E8F0] shadow-sm transition-all hover:border-[#38BDF8] hover:bg-[#162C52] active:scale-[0.98] cursor-pointer">
          <div class="flex items-center gap-2.5">
            <div class="flex size-9 items-center justify-center rounded-xl bg-white/10 text-white shadow-inner">
              <app-icon name="pause" [size]="18" />
            </div>
            <div class="min-w-0">
              <div class="text-xs font-black tracking-wide">
                {{ isPaused() ? 'Reprendre la mission' : 'Pause de mission' }}
              </div>
              <div class="text-[10px] text-[#94A3B8] font-medium">
                {{ isPaused() ? 'Poursuivre le plan de vol' : 'Suspendre en vol stationnaire (Hover)' }}
              </div>
            </div>
          </div>
        </button>
      </div>

      <!-- Réglage rapide Vitesse & RTH -->
      <div class="rounded-xl border border-[#1E3A5F] bg-[#0A192F]/80 p-3 shadow-inner">
        <div class="flex items-center justify-between pb-2 border-b border-[#1E3A5F]/60 text-xs">
          <span class="flex items-center gap-1.5 text-[#38BDF8] font-bold">
            <app-icon name="gauge" [size]="13" />
            <span>Vitesse actuelle</span>
          </span>
          <span class="font-extrabold text-white">{{ currentSpeedKmh().toFixed(1) }} km/h</span>
        </div>
        <div class="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            (click)="adjustSpeed(-2)"
            [disabled]="!isFlying() && !isRealtimeRunning()"
            class="flex-1 rounded-lg border border-[#1E3A5F] bg-[#112240] py-1.5 text-xs font-bold text-white transition hover:border-[#38BDF8] hover:bg-[#162C52] disabled:opacity-40 cursor-pointer">
            - 2 km/h
          </button>
          <button
            type="button"
            (click)="adjustSpeed(2)"
            [disabled]="!isFlying() && !isRealtimeRunning()"
            class="flex-1 rounded-lg border border-[#1E3A5F] bg-[#112240] py-1.5 text-xs font-bold text-white transition hover:border-[#38BDF8] hover:bg-[#162C52] disabled:opacity-40 cursor-pointer">
            + 2 km/h
          </button>
          <button
            type="button"
            (click)="onReturnToBase()"
            [disabled]="!isFlying()"
            class="flex-1 rounded-lg border border-[#F59E0B]/50 bg-[#F59E0B]/15 py-1.5 text-xs font-bold text-[#FBBF24] transition hover:bg-[#F59E0B]/25 disabled:opacity-40 cursor-pointer">
            RTH Base
          </button>
        </div>
      </div>

      <!-- Détection d'obstacles -->
      <div class="mt-auto flex items-center gap-2.5 rounded-xl border border-[#1E3A5F]/70 bg-[#0C1E3D] p-2.5 text-xs">
        <app-icon name="crosshair" [size]="15" class="text-[#38BDF8]" />
        <div class="h-2 flex-1 overflow-hidden rounded-full bg-[#1E293B]">
          <div class="h-full bg-gradient-to-r from-[#10B981] to-[#34D399]" style="width: 20%;"></div>
        </div>
        <span class="text-[11px] font-bold text-[#34D399]">Obstacles : OK</span>
      </div>
    </section>
  `,
})
export class PilotagePanelComponent {
  protected readonly backend = inject(BackendService);
  protected readonly drones = inject(DroneService);
  protected readonly flightControl = inject(FlightControlService);
  protected readonly telemetry = inject(TelemetryService);
  protected readonly ui = inject(UiService);
  private readonly notifications = inject(NotificationService);

  readonly isRealtimeRunning = signal(true);
  readonly isPaused = signal(false);

  readonly currentDrone = computed(() => this.drones.selected());
  readonly isFlying = computed(() => this.currentDrone()?.status === 'in-flight');

  readonly currentSpeedKmh = computed(() => {
    const d = this.currentDrone();
    if (this.isFlying()) return (d?.speed ?? 4.17) * 3.6;
    if (this.isRealtimeRunning()) return 15.0;
    return 0;
  });

  toggleRealtimeRun(): void {
    const d = this.currentDrone();
    if (!d) {
      this.notifications.warning('Aucun drone sélectionné.');
      return;
    }
    const nextState = !this.isRealtimeRunning();
    this.isRealtimeRunning.set(nextState);

    if (nextState) {
      this.telemetry.start();
      this.notifications.success(`Pilotage temps réel activé pour ${d.name}.`);
      this.backend.recordHistory('mise_en_marche_temps_reel', `Mise en marche temps réel de ${d.name} depuis le tableau de bord`, d.id);
      this.backend.syncTelemetry(d.id, { speed: 4.17, altitude: 120, batteryLevel: 78 });
    } else {
      this.notifications.push(`Mise en marche interrompue pour ${d.name}.`, 'info');
      this.backend.recordHistory('arret_marche_temps_reel', `Arrêt de la mise en marche de ${d.name}`, d.id);
      this.backend.syncTelemetry(d.id, { speed: 0, altitude: 0, batteryLevel: 80 });
    }
  }

  onTakeOff(): void {
    const d = this.currentDrone();
    if (!d) return;
    this.isRealtimeRunning.set(true);
    this.isPaused.set(false);
    this.flightControl.takeOff(d.id, 'manual', 12.0);
    this.backend.recordHistory('demarrage_vol', `Décollage manuel de ${d.name} (15 km/h) depuis le tableau de bord`, d.id);
  }

  onLand(): void {
    const d = this.currentDrone();
    if (!d) return;
    this.flightControl.land(d.id);
    this.isRealtimeRunning.set(false);
    this.isPaused.set(false);
    this.backend.recordHistory('atterrissage', `Atterrissage commandé de ${d.name} depuis le tableau de bord`, d.id);
  }

  onTogglePause(): void {
    const d = this.currentDrone();
    if (!d) return;
    const next = !this.isPaused();
    this.isPaused.set(next);
    if (next) {
      this.flightControl.setMode(d.id, 'semi-auto');
      this.notifications.push(`Mission suspendue : ${d.name} en vol stationnaire.`, 'info');
      this.backend.recordHistory('pause_vol', `Suspension du vol de ${d.name} en vol stationnaire`, d.id);
    } else {
      this.flightControl.setMode(d.id, 'auto');
      this.notifications.success(`Reprise de mission pour ${d.name}.`);
      this.backend.recordHistory('reprise_vol', `Reprise du vol pour ${d.name}`, d.id);
    }
  }

  adjustSpeed(deltaKmh: number): void {
    const d = this.currentDrone();
    if (!d) return;
    const current = d.speed || 4.17;
    const newSpeed = Math.max(1, current + (deltaKmh / 3.6));
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

