import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AlertService } from '../../core/services/alert.service';
import { AuthService } from '../../core/services/auth.service';
import { UiService } from '../../core/services/ui.service';
import { DetailModalComponent } from '../../shared/components/modal/detail-modal.component';
import { FloatingCameraComponent } from '../../shared/components/floating-camera/floating-camera.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { NotificationToastComponent } from '../../shared/components/notification-toast/notification-toast.component';
import { SearchBoxComponent } from '../../shared/components/search-box/search-box.component';
import { DroneFormComponent } from '../forms/drone-form.component';
import { MissionFormComponent } from '../forms/mission-form.component';
import { ScheduleFormComponent } from '../forms/schedule-form.component';
import { FleetRailComponent } from '../fleet-rail/fleet-rail.component';
import { LoginComponent } from '../login/login.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { NAV_ITEMS } from '../nav-items';

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, NavbarComponent, FleetRailComponent, LoginComponent, IconComponent, SearchBoxComponent,
    DetailModalComponent, NotificationToastComponent, DroneFormComponent, MissionFormComponent, ScheduleFormComponent,
    FloatingCameraComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (auth.user()) {
      <!-- Fond principal BLEU MARINE #0A192F -->
      <div class="flex h-[100dvh] min-h-screen flex-col bg-[#0A192F] text-[#F8FAFC]">
        <app-navbar />
        <div class="flex min-h-0 flex-1">
          <aside class="hidden w-[290px] shrink-0 xl:block"><app-fleet-rail /></aside>
          <main class="min-w-0 flex-1 overflow-y-auto p-2.5 sm:p-4">
            <div class="mx-auto mb-3 max-w-[1500px] xl:hidden"><app-fleet-rail [strip]="true" /></div>
            <router-outlet />
          </main>
        </div>
      </div>

      <!-- Menu mobile / tablette -->
      @if (ui.menuOpen()) {
        <div class="fixed inset-0 z-50 lg:hidden">
          <div class="absolute inset-0 bg-[#020C1B]/80 backdrop-blur-xs transition-opacity" (click)="ui.menuOpen.set(false)" role="presentation"></div>
          <aside class="absolute inset-y-0 left-0 flex w-[85vw] max-w-[300px] flex-col gap-3 border-r border-[#1E3A5F] bg-[#0A192F] p-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-[#1E3A5F] pb-3">
              <div class="flex items-center gap-2">
                <span class="flex size-7 items-center justify-center rounded-lg border border-[#1E3A5F] bg-[#112240] text-[#38BDF8]"><app-icon name="drone" [size]="16" /></span>
                <span class="text-xs font-bold tracking-wider text-[#F8FAFC]">FABLAB_DRONE</span>
              </div>
              <button type="button" class="icon-btn !size-8" aria-label="Fermer le menu" (click)="ui.menuOpen.set(false)"><app-icon name="x" [size]="16" /></button>
            </div>
            <app-search-box />
            <nav class="flex flex-col gap-1 overflow-y-auto" aria-label="Navigation mobile">
              @for (item of items; track item.path) {
                <a [routerLink]="item.path" routerLinkActive="active" (click)="ui.menuOpen.set(false)"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-[#94A3B8] transition hover:bg-[#172A4D] hover:text-[#F8FAFC] [&.active]:bg-[#172A4D] [&.active]:text-[#38BDF8] [&.active]:border [&.active]:border-[#1E3A5F]">
                  <app-icon [name]="item.icon" [size]="16" /><span class="flex-1">{{ item.label }}</span>
                  @if (item.badge && alerts.unresolvedCount() > 0) {
                    <span class="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444]/20 px-1 text-[9px] font-bold text-[#F87171]">{{ alerts.unresolvedCount() }}</span>
                  }
                </a>
              }
            </nav>
          </aside>
        </div>
      }

      <app-drone-form />
      <app-mission-form />
      <app-schedule-form />
      <app-detail-modal />
      <app-floating-camera />
    } @else {
      <app-login />
    }
    <app-notification-toast />
  `,
})
export class MainLayoutComponent {
  protected readonly ui = inject(UiService);
  protected readonly auth = inject(AuthService);
  protected readonly alerts = inject(AlertService);
  protected readonly items = NAV_ITEMS;
}
