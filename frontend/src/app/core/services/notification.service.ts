import { Injectable, computed, signal } from '@angular/core';
import { AppNotification, NotificationType } from '../models/models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private nextId = 1;
  /** Historique (cloche de la topbar). */
  readonly history = signal<AppNotification[]>([]);
  /** Toasts visibles. */
  readonly toasts = signal<AppNotification[]>([]);
  readonly unreadCount = computed(() => this.history().filter((n) => !n.read).length);

  push(message: string, type: NotificationType = 'info'): void {
    const n: AppNotification = { id: this.nextId++, message, type, timestamp: new Date().toISOString(), read: false };
    this.history.update((h) => [n, ...h].slice(0, 30));
    this.toasts.update((t) => [...t, n]);
    setTimeout(() => this.dismiss(n.id), 4000);
  }

  success(m: string) { this.push(m, 'success'); }
  error(m: string) { this.push(m, 'error'); }
  warning(m: string) { this.push(m, 'warning'); }

  dismiss(id: number): void {
    this.toasts.update((t) => t.filter((x) => x.id !== id));
  }

  markAllRead(): void {
    this.history.update((h) => h.map((n) => ({ ...n, read: true })));
  }
}
