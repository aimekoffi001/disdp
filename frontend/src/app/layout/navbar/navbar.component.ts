import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AlertService } from '../../core/services/alert.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { TelemetryService } from '../../core/services/telemetry.service';
import { UiService } from '../../core/services/ui.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SearchBoxComponent } from '../../shared/components/search-box/search-box.component';
import { fmtDateTime, fmtTime } from '../../shared/utils/labels';
import { NAV_ITEMS } from '../nav-items';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, IconComponent, SearchBoxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Header BLEU MARINE avec bordure inférieure #1E3A5F -->
    <header class="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-[#1E3A5F] bg-[#0A192F]/95 px-3 backdrop-blur-xl sm:px-4 shadow-[0_4px_12px_rgba(2,12,27,0.3)]">
      <button type="button" class="icon-btn !size-8 lg:!hidden" aria-label="Ouvrir le menu" (click)="ui.menuOpen.set(true)"><app-icon name="menu" [size]="18" /></button>

      <!-- Logo & Titre BLEU MARINE PRO -->
      <a routerLink="/dashboard" class="flex items-center gap-2.5">
        <span class="flex size-8 items-center justify-center rounded-lg border border-[#1E3A5F] bg-[#112240] text-[#38BDF8]"><app-icon name="drone" [size]="18" /></span>
        <span class="hidden leading-tight sm:block">
          <span class="block text-[13px] font-bold tracking-wider text-[#F8FAFC]">FABLAB_DRONE</span>
          <span class="block text-[9px] tracking-wide text-[#94A3B8]">Supervision de drones intelligents</span>
        </span>
      </a>

      <!-- Menu Principal Style BLEU MARINE PRO -->
      <nav class="ml-3 hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
        @for (item of items; track item.path) {
          <a
            [routerLink]="item.path" routerLinkActive="active" [title]="item.label"
            class="group relative flex h-8 items-center gap-2 rounded-lg px-2.5 text-[12px] font-medium text-[#94A3B8] transition hover:bg-[#172A4D] hover:text-[#F8FAFC] [&.active]:bg-[#172A4D] [&.active]:text-[#38BDF8] [&.active]:border [&.active]:border-[#1E3A5F]">
            <app-icon [name]="item.icon" [size]="15" />
            <span class="hidden group-[.active]:inline 2xl:inline">{{ item.label }}</span>
            @if (item.badge && alerts.unresolvedCount() > 0) {
              <span class="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444]/20 px-1 text-[9px] font-bold text-[#F87171]">{{ alerts.unresolvedCount() }}</span>
            }
          </a>
        }
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <app-search-box class="hidden w-52 xl:block 2xl:w-64" />

        <!-- Bouton Caméra Flottante (PiP) -->
        <button type="button"
                [class]="'icon-btn relative !size-8 transition ' + (ui.floatingCameraOpen() ? '!border-[#38BDF8] !bg-[#172A4D] !text-[#38BDF8]' : 'hover:bg-[#172A4D] text-[#94A3B8]')"
                aria-label="Caméra Flottante (PiP)"
                title="Ouvrir la Caméra Flottante (PiP)"
                (click)="ui.toggleFloatingCamera()">
          <app-icon name="video" [size]="15" />
          @if (ui.floatingCameraOpen()) {
            <span class="absolute top-1 right-1 size-1.5 rounded-full bg-[#34D399]"></span>
          }
        </button>

        @if (telemetry.demoMode) {
          <span class="hidden items-center gap-1.5 rounded-full border border-[#1E3A5F] bg-[#0C1E3D] px-2.5 py-1 text-[10px] font-medium text-[#94A3B8] md:flex" title="Données et télémétrie simulées">
            <span [class]="'size-1.5 rounded-full bg-[#F59E0B] ' + (telemetry.running() ? 'animate-pulse' : 'opacity-40')"></span>
            DÉMO{{ telemetry.running() ? '' : ' · PAUSE' }}
          </span>
        }

        <div class="relative">
          <button type="button" class="icon-btn relative !size-8 hover:bg-[#172A4D]" aria-label="Notifications" (click)="toggle('notifs')">
            <app-icon name="bell" [size]="16" />
            @if (notifications.unreadCount() > 0) {
              <span class="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-[#38BDF8] ring-2 ring-[#0A192F]"></span>
            }
          </button>
          @if (open() === 'notifs') {
            <div class="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border border-[#1E3A5F] bg-[#112240] p-2 shadow-2xl">
              <div class="mb-1 px-2 pt-1 text-[11px] font-medium tracking-[0.05em] text-[#94A3B8] uppercase">Notifications</div>
              <div class="max-h-72 overflow-y-auto">
                @for (n of notifications.history(); track n.id) {
                  <div class="rounded-lg px-2 py-1.5 text-[11px] hover:bg-[#172A4D]">
                    <div class="text-[#F8FAFC] font-medium">{{ n.message }}</div>
                    <div class="text-[10px] text-[#94A3B8]">{{ time(n.timestamp) }}</div>
                  </div>
                } @empty { <div class="px-2 py-4 text-center text-[11px] text-[#94A3B8]">Aucune notification.</div> }
              </div>
            </div>
          }
        </div>

        @if (auth.user(); as u) {
          <div class="relative">
            <button type="button" class="flex items-center gap-2 rounded-full border border-[#1E3A5F] bg-[#112240] py-1 pr-3 pl-1 transition hover:bg-[#172A4D] shadow-xs" aria-haspopup="dialog" (click)="toggle('account')">
              <span class="flex size-6 items-center justify-center rounded-full border border-[#1E3A5F] bg-[#0C1E3D] text-[10px] font-semibold text-[#38BDF8]">{{ u.initials }}</span>
              <span class="hidden text-left leading-tight sm:block">
                <span class="block text-xs font-semibold text-[#F8FAFC]">{{ u.name }}</span>
                <span class="block text-[9px] text-[#94A3B8]">{{ u.role }}</span>
              </span>
            </button>
            @if (open() === 'account') {
              <div class="absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-[#1E3A5F] bg-[#112240] shadow-2xl" role="dialog" aria-label="Mon compte">
                <div class="border-b border-[#1E3A5F] bg-[#0C1E3D] p-3.5">
                  <div class="flex items-center gap-3">
                    <span class="flex size-10 items-center justify-center rounded-full border border-[#1E3A5F] bg-[#112240] text-xs font-semibold text-[#38BDF8] shadow-xs">{{ u.initials }}</span>
                    <div class="min-w-0">
                      <div class="truncate text-xs font-semibold text-[#F8FAFC]">{{ u.name }}</div>
                      <div class="truncate text-[10px] text-[#94A3B8]">{{ u.email }}</div>
                      <span class="mt-1 inline-flex items-center gap-1 rounded-full border border-[#10B981]/30 bg-[#10B981]/15 px-1.5 py-0.5 text-[9px] font-medium text-[#34D399]">
                        <span class="size-1 rounded-full bg-[#10B981]"></span>Connecté
                      </span>
                    </div>
                  </div>
                </div>
                <div class="p-2 text-xs">
                  <div class="px-2 py-1.5 text-[11px] text-[#94A3B8]">Dernière connexion : {{ date(auth.connectedSince() ?? '') }}</div>
                  <button type="button" class="w-full rounded-lg px-2.5 py-2 text-left text-[#F87171] hover:bg-[#172A4D] font-medium transition cursor-pointer" (click)="logout()">
                    Se déconnecter
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </header>
  `,
})
export class NavbarComponent {
  protected readonly ui = inject(UiService);
  protected readonly auth = inject(AuthService);
  protected readonly alerts = inject(AlertService);
  protected readonly notifications = inject(NotificationService);
  protected readonly telemetry = inject(TelemetryService);
  private readonly router = inject(Router);

  protected readonly items = NAV_ITEMS;
  protected readonly open = signal<'notifs' | 'account' | null>(null);

  protected toggle(kind: 'notifs' | 'account'): void {
    this.open.update((v) => (v === kind ? null : kind));
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent): void {
    if (!(ev.target as HTMLElement).closest('.relative')) this.open.set(null);
  }

  protected time(iso: string): string {
    return fmtTime(iso);
  }
  protected date(iso: string): string {
    return fmtDateTime(iso);
  }
  protected logout(): void {
    this.open.set(null);
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
