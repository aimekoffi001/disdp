import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', title: 'DISPD — Tableau de bord', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
  { path: 'drones', title: 'DISPD — Drones', loadComponent: () => import('./features/drones/drones.page').then((m) => m.DronesPage) },
  { path: 'missions', title: 'DISPD — Missions', loadComponent: () => import('./features/missions/missions.page').then((m) => m.MissionsPage) },
  { path: 'surveillance-zones', title: 'DISPD — Zones de surveillance', loadComponent: () => import('./features/surveillance-zones/surveillance-zones.page').then((m) => m.SurveillanceZonesPage) },
  { path: 'flight-planning', title: 'DISPD — Planification des vols', loadComponent: () => import('./features/flight-planning/flight-planning.page').then((m) => m.FlightPlanningPage) },
  { path: 'cameras', title: 'DISPD — Caméras', loadComponent: () => import('./features/cameras/cameras.page').then((m) => m.CamerasPage) },
  { path: 'alerts', title: 'DISPD — Alertes', loadComponent: () => import('./features/alerts/alerts.page').then((m) => m.AlertsPage) },
  { path: 'reports', title: 'DISPD — Rapports', loadComponent: () => import('./features/reports/reports.page').then((m) => m.ReportsPage) },
  { path: 'settings', title: 'DISPD — Paramètres', loadComponent: () => import('./features/settings/settings.page').then((m) => m.SettingsPage) },
  { path: '**', redirectTo: 'dashboard' },
];
