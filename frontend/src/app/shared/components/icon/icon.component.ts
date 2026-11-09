import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  LucideActivity, LucideAlertTriangle, LucideBatteryFull, LucideBell, LucideCalendarClock, LucideCalendarDays,
  LucideCamera, LucideCheck, LucideChevronDown, LucideClipboardCheck, LucideClock, LucideCog, LucideCompass,
  LucideDrone, LucideDroplets, LucideDynamicIcon, LucideEye, LucideFileText, LucideGauge, LucideHistory,
  LucideLayoutDashboard, LucideMap, LucideMapPin, LucideMaximize, LucideMenu, LucideMountain, LucidePause,
  LucidePencil, LucidePlay, LucidePlus, LucideRadio, LucideRoute, LucideSearch, LucideSettings, LucideShieldCheck,
  LucideThermometer, LucideTrash2, LucideUser, LucideVideo, LucideWind, LucideX, LucideZap,
} from '@lucide/angular';

const ICONS = {
  activity: LucideActivity, alert: LucideAlertTriangle, battery: LucideBatteryFull, bell: LucideBell,
  schedule: LucideCalendarClock, calendar: LucideCalendarDays, camera: LucideCamera, check: LucideCheck,
  chevron: LucideChevronDown, missions: LucideClipboardCheck, clock: LucideClock, cog: LucideCog,
  compass: LucideCompass, drone: LucideDrone, droplets: LucideDroplets, eye: LucideEye, file: LucideFileText,
  gauge: LucideGauge, history: LucideHistory, dashboard: LucideLayoutDashboard, map: LucideMap, pin: LucideMapPin,
  maximize: LucideMaximize, menu: LucideMenu, mountain: LucideMountain, pause: LucidePause, pencil: LucidePencil,
  play: LucidePlay, plus: LucidePlus, radio: LucideRadio, route: LucideRoute, search: LucideSearch,
  settings: LucideSettings, shield: LucideShieldCheck, thermometer: LucideThermometer, trash: LucideTrash2,
  user: LucideUser, video: LucideVideo, wind: LucideWind, x: LucideX, zap: LucideZap,
} as const;

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-icon',
  imports: [LucideDynamicIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex shrink-0' },
  template: `<svg [lucideIcon]="icon()" [size]="size()" [strokeWidth]="1.8"></svg>`,
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(14);
  protected readonly icon = computed(() => ICONS[this.name()]);
}
