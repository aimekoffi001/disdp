import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AlertService } from '../../core/services/alert.service';
import { AuthService } from '../../core/services/auth.service';
import { UiService } from '../../core/services/ui.service';
import { DetailModalComponent } from '../../shared/components/modal/detail-modal.component';
import { FloatingCameraComponent } from '../../shared/components/floating-camera/floating-camera.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { NotificationToastComponent } from '../../shared/components/notification-toast/notification-toast.component';
import { DroneFormComponent } from '../forms/drone-form.component';
import { MissionFormComponent } from '../forms/mission-form.component';
import { ScheduleFormComponent } from '../forms/schedule-form.component';
import { LoginComponent } from '../login/login.component';
import { NAV_ITEMS } from '../nav-items';

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, LoginComponent, IconComponent,
    DetailModalComponent, NotificationToastComponent, DroneFormComponent, MissionFormComponent, ScheduleFormComponent,
    FloatingCameraComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (auth.user()) {
      <div class="flex h-[100dvh] w-full overflow-hidden bg-[#071326] text-[#F8FAFC]">
        
        <!-- ============================================================== -->
        <!-- BARRE LATÉRALE VERTICALE STYLE MAQUETTE DISDP FABLAB UVCI       -->
        <!-- ============================================================== -->
        <aside class="flex w-[230px] shrink-0 flex-col justify-between border-r border-[#1E3A5F]/60 bg-[#081528] p-3.5 select-none shadow-2xl">
          <div class="flex flex-col gap-4">
            <!-- Logo DISDP FabLab UVCI -->
            <a routerLink="/dashboard" class="flex flex-col items-center gap-1.5 pt-1 text-center group cursor-pointer">
              <div class="flex size-11 items-center justify-center rounded-2xl border border-[#38BDF8]/40 bg-[#112240] text-[#38BDF8] shadow-md transition group-hover:scale-105">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-6">
                  <path d="M12 2a4 4 0 0 0-4 4c0 2 2 3 4 5 2-2 4-3 4-5a4 4 0 0 0-4-4z" />
                  <circle cx="12" cy="14" r="3" />
                  <path d="M4 14h3m10 0h3M5 19l2-2m10 0 2 2" />
                </svg>
              </div>
              <div>
                <span class="block text-sm font-black tracking-widest text-[#F8FAFC]">DISDP</span>
                <span class="block text-[10px] font-semibold tracking-wide text-[#94A3B8]">FabLab UVCI</span>
              </div>
            </a>

            <!-- Navigation Principale Verticale -->
            <nav class="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-250px)] pr-1 custom-scrollbar" aria-label="Navigation principale">
              @for (item of items; track item.path) {
                <a
                  [routerLink]="item.path"
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
                  class="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-semibold text-[#94A3B8] transition-all
                         hover:bg-[#112240] hover:text-[#F8FAFC]
                         [&.active]:bg-[#2563EB] [&.active]:text-white [&.active]:shadow-lg [&.active]:shadow-[#2563EB]/30">
                  <app-icon [name]="item.icon" [size]="16" class="shrink-0 transition group-[.active]:scale-110" />
                  <span class="truncate">{{ item.label }}</span>
                  @if (item.badge && alerts.unresolvedCount() > 0) {
                    <span class="ml-auto flex size-4 items-center justify-center rounded-full bg-[#EF4444] text-[9px] font-bold text-white">
                      {{ alerts.unresolvedCount() }}
                    </span>
                  }
                </a>
              }
            </nav>
          </div>

          <!-- Bas de la barre latérale : Compte, Déconnexion & Logo UVCI -->
          <div class="flex flex-col gap-2 border-t border-[#1E3A5F]/60 pt-3">
            <button
              type="button"
              (click)="ui.toggleFloatingCamera()"
              class="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-[#94A3B8] transition hover:bg-[#112240] hover:text-[#38BDF8]">
              <app-icon name="video" [size]="14" />
              <span>Caméra Flottante</span>
            </button>

            <button
              type="button"
              (click)="auth.logout()"
              class="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-[11px] font-semibold text-[#F87171] transition hover:bg-[#EF4444]/15">
              <app-icon name="x" [size]="14" />
              <span>Déconnexion</span>
            </button>

            <!-- Emblème UVCI -->
            <div class="mt-2 flex flex-col items-center justify-center gap-1 border-t border-[#1E3A5F]/40 pt-2 text-center text-[#94A3B8]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="size-6 text-[#38BDF8]">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span class="text-[10px] font-black tracking-widest text-[#F8FAFC]">UVCI</span>
            </div>
          </div>
        </aside>

        <!-- ============================================================== -->
        <!-- CONTENU PRINCIPAL DYNAMIQUE                                   -->
        <!-- ============================================================== -->
        <main class="min-w-0 flex-1 overflow-y-auto bg-[#071326] p-3 sm:p-5">
          <router-outlet />
        </main>
      </div>

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
  private readonly router = inject(Router);
}
