import { IconName } from '../shared/components/icon/icon.component';

export interface NavItem { label: string; path: string; icon: IconName; badge?: boolean }

export const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', path: '/dashboard', icon: 'dashboard' },
  { label: 'Drones', path: '/drones', icon: 'drone' },
  { label: 'Missions', path: '/missions', icon: 'missions' },
  { label: 'Zones', path: '/surveillance-zones', icon: 'shield' },
  { label: 'Planification', path: '/flight-planning', icon: 'schedule' },
  { label: 'Caméras', path: '/cameras', icon: 'video' },
  { label: 'Alertes', path: '/alerts', icon: 'bell', badge: true },
  { label: 'Rapports', path: '/reports', icon: 'file' },
  { label: 'Paramètres', path: '/settings', icon: 'settings' },
];
