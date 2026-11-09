import { Injectable, computed, inject, signal } from '@angular/core';
import { createMockAlerts } from '../data/mock-data';
import { Alert, AlertSeverity, AlertStatus } from '../models/models';
import { BackendService } from './backend.service';
import { NotificationService } from './notification.service';
import { StorageService } from './storage.service';

/** Gestion des alertes connectée au backend Laravel & BDD MySQL. */
@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly storage = inject(StorageService);
  private readonly notifications = inject(NotificationService);
  private readonly backend = inject(BackendService);

  private readonly _alerts = signal<Alert[]>(this.storage.get('alerts', createMockAlerts()));
  readonly alerts = computed(() => [...this._alerts()].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
  /** Alertes non résolues : alimente le badge de la sidebar. */
  readonly unresolvedCount = computed(() => this._alerts().filter((a) => a.status !== 'resolved').length);

  constructor() {
    this.loadFromBackend();
  }

  async loadFromBackend(): Promise<void> {
    const data = await this.backend.fetchDashboard();
    const alerts = data?.alertes || data?.incidents;
    if (alerts && alerts.length > 0) {
      const mapped = this.backend.mapAlerts(alerts);
      this._alerts.set(mapped);
      this.persist();
    }
  }

  byId(id: string): Alert | undefined {
    return this._alerts().find((a) => a.id === id);
  }

  setStatus(id: string, status: AlertStatus): void {
    this._alerts.update((l) => l.map((a) => (a.id === id ? { ...a, status } : a)));
    this.persist();
    if (status === 'resolved') {
      this.notifications.success('Alerte marquée comme traitée.');
      this.backend.resolveAlert(id);
    }
  }

  /** Crée une alerte sauf s'il en existe déjà une non résolue du même type pour ce drone. */
  raise(droneId: string, type: string, severity: AlertSeverity, details: string): void {
    if (this._alerts().some((a) => a.droneId === droneId && a.type === type && a.status !== 'resolved')) return;
    const alert: Alert = { id: 'a' + Date.now().toString(36), timestamp: new Date().toISOString(), droneId, type, severity, status: 'new', details };
    this._alerts.update((l) => [alert, ...l]);
    this.persist();
    this.notifications.warning(`Nouvelle alerte : ${type}`);
  }

  reset(): void {
    this._alerts.set(createMockAlerts());
    this.persist();
  }

  private persist(): void {
    this.storage.set('alerts', this._alerts());
  }
}
