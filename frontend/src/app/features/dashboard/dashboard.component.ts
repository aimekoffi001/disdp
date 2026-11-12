import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, timer } from 'rxjs';
import { UiService } from '../../core/services/ui.service';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { AlertsTableComponent } from './components/alerts-table/alerts-table.component';
import { BatteryPanelComponent } from './components/battery-panel/battery-panel.component';
import { DroneControlComponent } from './components/drone-control/drone-control.component';
import { DroneMapComponent } from './components/drone-map/drone-map.component';
import { FlightDataComponent } from './components/flight-data/flight-data.component';
import { FlightHistoryComponent } from './components/flight-history/flight-history.component';
import { FlightSchedulerComponent } from './components/flight-scheduler/flight-scheduler.component';
import { LiveCameraComponent } from './components/live-camera/live-camera.component';
import { MissionsTableComponent } from './components/missions-table/missions-table.component';
import { MotorsPanelComponent } from './components/motors-panel/motors-panel.component';
import { PilotagePanelComponent } from './components/pilotage-panel/pilotage-panel.component';
import { SensorsPanelComponent } from './components/sensors-panel/sensors-panel.component';
import { StatisticsComponent } from './components/statistics/statistics.component';

const dateFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

type Tab = 'live' | 'pilotage' | 'telemetry' | 'map' | 'activity';

@Component({
  selector: 'app-dashboard',
  imports: [
    IconComponent, DroneControlComponent, StatisticsComponent, LiveCameraComponent, BatteryPanelComponent,
    PilotagePanelComponent, FlightDataComponent, SensorsPanelComponent, MotorsPanelComponent, MissionsTableComponent, AlertsTableComponent,
    FlightHistoryComponent, DroneMapComponent, FlightSchedulerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-[1500px] flex-col gap-4">
      <!-- Barre d'actions & Contrôle du drone sélectionné -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <app-drone-control class="w-full sm:w-auto" />
        <div class="hidden sm:flex items-center gap-2 rounded-xl border border-[#1E3A5F] bg-[#112240] px-3.5 py-2 text-[11px] text-[#94A3B8] shadow-sm ml-auto">
          <app-icon name="calendar" [size]="13" class="text-[#38BDF8]" />
          <span>{{ date() }}</span>
          <span class="text-[#1E3A5F]">·</span>
          <app-icon name="clock" [size]="13" class="text-[#38BDF8]" />
          <span class="font-semibold text-[#F8FAFC] tabular-nums">{{ time() }}</span>
        </div>
      </div>

      <!-- Cartes statistiques en Bleu Marine avec bordure #1E3A5F -->
      <app-statistics />

      <!-- Barre d'onglets parfaitement alignée -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E3A5F]/70 pb-2">
        <div class="grid grid-cols-2 sm:grid-cols-5 lg:inline-flex items-center gap-1.5 rounded-xl border border-[#1E3A5F] bg-[#112240] p-1.5 shadow-sm" role="tablist" aria-label="Sections du tableau de bord">
          @for (t of tabs; track t.id) {
            <button
              type="button" role="tab" [attr.aria-selected]="ui.dashboardTab() === t.id" (click)="ui.dashboardTab.set(t.id)"
              [class]="'flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ' + (ui.dashboardTab() === t.id ? 'bg-[#172A4D] text-[#38BDF8] border border-[#1E3A5F] shadow-xs' : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172A4D]')">
              <app-icon [name]="t.icon" [size]="14" /><span>{{ t.label }}</span>
            </button>
          }
        </div>
        <div class="hidden md:flex items-center gap-2 text-[11px] text-[#94A3B8]">
          <span class="size-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
          <span>Cockpit opérationnel · Données en temps réel</span>
        </div>
      </div>

      @switch (ui.dashboardTab()) {
        @case ('live') {
          <div class="grid gap-4 lg:grid-cols-12">
            <div class="flex flex-col gap-4 lg:col-span-7"><app-live-camera /><app-battery-panel /></div>
            <div class="lg:col-span-5"><app-pilotage-panel /></div>
          </div>
        }
        @case ('pilotage') {
          <div class="grid gap-4 lg:grid-cols-12">
            <div class="lg:col-span-5"><app-pilotage-panel /></div>
            <div class="flex flex-col gap-4 lg:col-span-7"><app-live-camera /><app-flight-data /></div>
          </div>
        }
        @case ('telemetry') {
          <div class="grid gap-4 lg:grid-cols-12">
            <div class="lg:col-span-7"><app-flight-data /></div>
            <div class="flex flex-col gap-4 lg:col-span-5">
              <app-motors-panel />
              <app-sensors-panel />
            </div>
          </div>
        }
        @case ('map') { <app-drone-map [controls]="true" /> }
        @case ('activity') {
          <div class="grid gap-4 lg:grid-cols-2">
            <app-missions-table />
            <app-alerts-table />
            <app-flight-history />
            <app-flight-scheduler />
          </div>
        }
      }
    </div>
  `,
})
export class DashboardComponent {
  protected readonly ui = inject(UiService);
  private readonly now = toSignal(timer(0, 1000).pipe(map(() => new Date())), { initialValue: new Date() });
  protected readonly date = computed(() => {
    const s = dateFmt.format(this.now());
    return s.charAt(0).toUpperCase() + s.slice(1);
  });
  protected readonly time = computed(() => timeFmt.format(this.now()));

  protected readonly tabs: { id: Tab; label: string; icon: IconName }[] = [
    { id: 'live', label: 'Direct & Caméra', icon: 'video' },
    { id: 'pilotage', label: 'Pilotage & Vol', icon: 'gamepad' },
    { id: 'telemetry', label: 'Télémétrie complète', icon: 'activity' },
    { id: 'map', label: 'Carte & Périmètres', icon: 'map' },
    { id: 'activity', label: 'Missions & Alertes', icon: 'missions' },
  ];
}
