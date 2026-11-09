import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FlightMode } from '../../../../core/models/models';
import { DroneService } from '../../../../core/services/drone.service';
import { FlightControlService } from '../../../../core/services/flight-control.service';
import { UiService } from '../../../../core/services/ui.service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { DRONE_STATUS, FLIGHT_MODE } from '../../../../shared/utils/labels';

/** Contrôle opérationnel du drone sélectionné style BLEU MARINE PRO. */
@Component({
  selector: 'app-drone-control',
  imports: [IconComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (drone(); as d) {
      <div class="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-start gap-2 sm:gap-2.5 rounded-[12px] border border-[#1E3A5F] bg-[#112240] p-2 sm:px-3 sm:py-1.5 shadow-md">
        <div class="flex items-center gap-2">
          <span class="relative flex size-8 items-center justify-center rounded-lg border border-[#1E3A5F] bg-[#0C1E3D] text-[#38BDF8]">
            <app-icon name="drone" [size]="17" />
            <span [class]="'absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2 ring-[#0C1E3D] ' + dot(d.status)"></span>
          </span>
          <div class="leading-tight">
            <div class="text-xs font-bold text-[#F8FAFC]">{{ d.name }}</div>
            <div class="flex items-center gap-1.5 mt-0.5">
              <app-status-badge [tone]="meta[d.status].tone">{{ meta[d.status].label }}</app-status-badge>
              <!-- Pourcentages batterie en vert doux sur fond bleu marine -->
              <span class="rounded-full border border-[#10B981]/30 bg-[#10B981]/15 px-1.5 py-0.2 text-[10px] font-bold text-[#34D399] tabular-nums">{{ round(d.batteryLevel) }}%</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 ml-auto sm:ml-0">
          @if (d.status === 'in-flight') {
            @if (d.rthActive) {
              <span class="rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/15 px-2 py-0.5 text-[10px] font-bold text-[#FBBF24] flex items-center gap-1 shadow-xs">
                <span class="size-1.5 rounded-full bg-[#F59E0B] animate-pulse"></span>RTH {{ d.rthAltitude }}m (Slot #{{ d.rthSlot }})
              </span>
            } @else {
              <button type="button" class="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#38BDF8]/40 bg-[#172A4D] px-2.5 sm:px-3 py-1.5 text-[11px] font-semibold text-[#38BDF8] transition hover:bg-[#1E3A5F] shadow-xs" (click)="rth(d.id)" title="Planifier le retour à la base avec séparation verticale anti-collision">
                <app-icon name="schedule" [size]="12" /> <span class="hidden xs:inline">RTH Sécurisé</span>
              </button>
            }
            <label class="sr-only" for="dc-mode">Mode de vol</label>
            <select id="dc-mode" class="field !w-auto !rounded-lg !py-1 !pr-6 !text-[11px]" [value]="d.flightMode" (change)="setMode(d.id, $any($event.target).value)">
              @for (m of modes; track m.value) { <option [value]="m.value" [selected]="m.value === d.flightMode">{{ m.label }}</option> }
            </select>
            <button type="button" class="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/15 px-3 py-1.5 text-[11px] font-semibold text-[#F87171] transition hover:bg-[#EF4444]/25" (click)="stop(d.id, d.name)">
              <app-icon name="pause" [size]="12" /> <span class="hidden xs:inline">Arrêter</span>
            </button>
          } @else {
            <button type="button" class="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#1E3A5F] bg-[#0C1E3D] px-2.5 sm:px-3 py-1.5 text-[11px] font-medium text-[#F8FAFC] transition hover:border-[#38BDF8]/40 hover:bg-[#172A4D] shadow-xs" (click)="connect(d.id)" title="Connecter le drone à la Station de Base FabLab UVCI">
              <app-icon name="radio" [size]="12" class="text-[#38BDF8]" /> Connexion
            </button>
            <button type="button" class="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-[8px] bg-[#2563EB] px-2.5 sm:px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#1D4ED8] active:scale-[0.98] shadow-sm disabled:opacity-40 disabled:cursor-not-allowed" [disabled]="d.status !== 'available'" [attr.title]="d.status === 'available' ? 'Démarrer le drone et décoller' : 'Drone indisponible'" (click)="start(d.id)">
              <app-icon name="play" [size]="12" /> Démarrer
            </button>
          }
        </div>
      </div>
    }
  `,
})
export class DroneControlComponent {
  private readonly drones = inject(DroneService);
  private readonly control = inject(FlightControlService);
  private readonly ui = inject(UiService);
  protected readonly drone = this.drones.selected;
  protected readonly meta = DRONE_STATUS;
  protected readonly round = Math.round;
  protected readonly modes = (Object.keys(FLIGHT_MODE) as FlightMode[]).map((value) => ({ value, label: FLIGHT_MODE[value].label }));

  protected dot(s: keyof typeof DRONE_STATUS): string {
    return {
      'in-flight': 'bg-[#34D399]',
      available: 'bg-[#38BDF8]',
      maintenance: 'bg-[#F87171]',
      offline: 'bg-[#64748B]',
    }[s];
  }
  protected connect(id: string): void {
    this.control.connectStation(id);
  }
  protected start(id: string): void {
    this.control.takeOff(id, 'manual');
  }
  protected stop(id: string, name: string): void {
    this.ui.askConfirm({ message: `Arrêter ${name} ? Le drone atterrit et la mission en cours est interrompue.`, confirmLabel: 'Arrêter', onConfirm: () => this.control.land(id) });
  }
  protected rth(id: string): void {
    this.control.returnToBase(id);
  }
  protected setMode(id: string, mode: FlightMode): void {
    this.control.setMode(id, mode);
  }
}
