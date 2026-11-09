import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiService } from '../../core/services/ui.service';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
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
import { SensorsPanelComponent } from './components/sensors-panel/sensors-panel.component';
import { StatisticsComponent } from './components/statistics/statistics.component';

type Tab = 'live' | 'telemetry' | 'map' | 'activity';

@Component({
  selector: 'app-dashboard',
  imports: [
    IconComponent, PageHeaderComponent, DroneControlComponent, StatisticsComponent, LiveCameraComponent, BatteryPanelComponent,
    MotorsPanelComponent, FlightDataComponent, SensorsPanelComponent, MissionsTableComponent, AlertsTableComponent,
    FlightHistoryComponent, DroneMapComponent, FlightSchedulerComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-[1500px] flex-col gap-4">
      <app-page-header title="Tableau de bord" subtitle="Vue d'ensemble de la flotte et du drone sélectionné">
        <app-drone-control />
      </app-page-header>

      <!-- Cartes statistiques en Bleu Marine avec bordure #1E3A5F -->
      <app-statistics />

      <!-- Onglets Style BLEU MARINE PRO : Sobre, fond navy, accent bleu #38BDF8 -->
      <div class="flex w-full sm:w-auto gap-1.5 self-start overflow-x-auto no-scrollbar rounded-[12px] border border-[#1E3A5F] bg-[#112240] p-1.5 shadow-md" role="tablist" aria-label="Sections du tableau de bord">
        @for (t of tabs; track t.id) {
          <button
            type="button" role="tab" [attr.aria-selected]="ui.dashboardTab() === t.id" (click)="ui.dashboardTab.set(t.id)"
            [class]="'flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ' + (ui.dashboardTab() === t.id ? 'bg-[#172A4D] text-[#38BDF8] border border-[#1E3A5F]' : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#172A4D]')">
            <app-icon [name]="t.icon" [size]="14" /><span>{{ t.label }}</span>
          </button>
        }
      </div>

      @switch (ui.dashboardTab()) {
        @case ('live') {
          <div class="grid gap-4 lg:grid-cols-12">
            <div class="flex flex-col gap-4 lg:col-span-7"><app-live-camera /><app-battery-panel /></div>
            <div class="lg:col-span-5"><app-motors-panel /></div>
          </div>
        }
        @case ('telemetry') {
          <div class="grid gap-4 lg:grid-cols-12">
            <div class="lg:col-span-8"><app-flight-data /></div>
            <div class="lg:col-span-4"><app-sensors-panel /></div>
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
  protected readonly tabs: { id: Tab; label: string; icon: IconName }[] = [
    { id: 'live', label: 'Direct & Caméra', icon: 'video' },
    { id: 'telemetry', label: 'Télémétrie complète', icon: 'activity' },
    { id: 'map', label: 'Carte & Périmètres', icon: 'map' },
    { id: 'activity', label: 'Missions & Alertes', icon: 'missions' },
  ];
}
