import { Injectable, computed, inject, signal } from '@angular/core';
import { Alert, AlertSeverity, AlertStatus } from '../models/models';
import { BackendService } from './backend.service';
import { NotificationService } from './notification.service';

/** Gestion des alertes connectée à 100% à la base MySQL via l'API Laravel. */
@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly notifications = inject(NotificationService);
  private readonly backend = inject(BackendService);

  private readonly _alerts = signal<Alert[]>([]);
  readonly loading = signal<boolean>(true);
  readonly alerts = computed(() => [...this._alerts()].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
  readonly unresolvedCount = computed(() => this._alerts().filter((a) => a.status !== 'resolved').length);

  constructor() {
    this.loadFromBackend();
  }

  async loadFromBackend(): Promise<void> {
    this.loading.set(true);
    try {
      const mapped = await this.backend.getAlerts();
      this._alerts.set(mapped);
    } finally {
      this.loading.set(false);
    }
  }

  byId(id: string): Alert | undefined {
    return this._alerts().find((a) => a.id === id);
  }

  async setStatus(id: string, status: AlertStatus): Promise<void> {
    if (status === 'resolved') {
      await this.backend.resolveAlert(id);
      this.notifications.success('Alerte résolue en base de données.');
    }
    await this.loadFromBackend();
  }

  async remove(id: string): Promise<void> {
    await this.backend.deleteAlert(id);
    await this.loadFromBackend();
    this.notifications.success('Alerte supprimée.');
  }

  raise(droneId: string, type: string, severity: AlertSeverity, details: string): void {
    if (this._alerts().some((a) => a.droneId === droneId && a.type === type && a.status !== 'resolved')) return;
    const alert: Alert = { id: String(Date.now()), timestamp: new Date().toISOString(), droneId, type, severity, status: 'new', details };
    this._alerts.update((l) => [alert, ...l]);
  }
}
