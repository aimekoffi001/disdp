import { IconName } from '../shared/components/icon/icon.component';

export interface NavItem { label: string; path: string; icon: IconName; badge?: boolean }

export const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', path: '/dashboard', icon: 'dashboard' },
  { label: 'Gestion des drones', path: '/drones', icon: 'drone' },
  { label: 'Pilotage', path: '/pilotage', icon: 'gamepad' },
  { label: 'Planification des vols', path: '/flight-planning', icon: 'schedule' },
  { label: 'Surveillance en direct', path: '/cameras', icon: 'camera' },
  { label: 'Capteurs et télémétrie', path: '/telemetrie', icon: 'gauge' },
  { label: 'Détection des pannes', path: '/detections', icon: 'alert' },
  { label: 'Alertes et incidents', path: '/alerts', icon: 'bell', badge: true },
  { label: 'Inspections techniques', path: '/inspections', icon: 'missions' },
  { label: 'Historique et rapports', path: '/reports', icon: 'file' },
  { label: 'Paramètres', path: '/settings', icon: 'settings' },
];
