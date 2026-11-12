import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', title: 'DISPD — Tableau de bord', loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent) },
  { path: 'drones', title: 'DISPD — Drones', loadComponent: () => import('./features/drones/drones.page').then((m) => m.DronesPage) },
  { path: 'pilotage', title: 'DISPD — Pilotage', loadComponent: () => import('./features/pilotage/pilotage.page').then((m) => m.PilotagePage) },
  { path: 'missions', title: 'DISPD — Missions', loadComponent: () => import('./features/missions/missions.page').then((m) => m.MissionsPage) },
  { path: 'surveillance-zones', title: 'DISPD — Zones de surveillance', loadComponent: () => import('./features/surveillance-zones/surveillance-zones.page').then((m) => m.SurveillanceZonesPage) },
  { path: 'flight-planning', title: 'DISPD — Planification des vols', loadComponent: () => import('./features/flight-planning/flight-planning.page').then((m) => m.FlightPlanningPage) },
  { path: 'cameras', title: 'DISPD — Caméras & Surveillance en direct', loadComponent: () => import('./features/cameras/cameras.page').then((m) => m.CamerasPage) },
  { path: 'telemetrie', title: 'DISPD — Capteurs & Télémétrie', loadComponent: () => import('./features/telemetrie/telemetrie.page').then((m) => m.TelemetriePage) },
  { path: 'detections', title: 'DISPD — Détection des pannes & Obstacles', loadComponent: () => import('./features/detections/detections.page').then((m) => m.DetectionsPage) },
  { path: 'inspections', title: 'DISPD — Inspections techniques', loadComponent: () => import('./features/inspections/inspections.page').then((m) => m.InspectionsPage) },
  { path: 'alerts', title: 'DISPD — Alertes & Incidents', loadComponent: () => import('./features/alerts/alerts.page').then((m) => m.AlertsPage) },
  { path: 'reports', title: 'DISPD — Rapports', loadComponent: () => import('./features/reports/reports.page').then((m) => m.ReportsPage) },
  { path: 'settings', title: 'DISPD — Paramètres', loadComponent: () => import('./features/settings/settings.page').then((m) => m.SettingsPage) },
  { path: '**', redirectTo: 'dashboard' },
];
