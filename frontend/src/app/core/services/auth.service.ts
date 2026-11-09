import { Injectable, computed, inject, signal } from '@angular/core';
import { NotificationService } from './notification.service';
import { OpResult } from '../models/models';
import { StorageService } from './storage.service';

export interface AuthUser {
  name: string;
  email: string;
  role: string;
  organization: string;
  initials: string;
  permissions: string[];
}

interface Session { email: string | null; since: string | null }

export const DEFAULT_USER: AuthUser = {
  name: 'Admin FabLab',
  email: 'admin@fablab.ci',
  role: 'Administrateur',
  organization: 'UVCI FabLab',
  initials: 'AF',
  permissions: ['Gérer la flotte', 'Créer des missions', 'Programmer des vols', 'Traiter les alertes', 'Paramètres'],
};

export const DEMO_ACCOUNTS: (AuthUser & { password: string })[] = [
  { ...DEFAULT_USER, password: 'password' },
];

/** Gestion de session utilisateur connecté. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(StorageService);
  private readonly notifications = inject(NotificationService);

  private readonly session = signal<Session>(
    this.storage.get<Session>('session', { email: DEFAULT_USER.email, since: new Date().toISOString() }),
  );
  readonly loading = signal(false);

  readonly user = computed<AuthUser | null>(() => {
    const email = this.session().email;
    if (!email) return null;
    return DEFAULT_USER;
  });
  readonly connectedSince = computed(() => this.session().since);

  login(email: string, _password: string): Promise<OpResult> {
    this.loading.set(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        this.loading.set(false);
        if (email.trim().toLowerCase() === DEFAULT_USER.email.toLowerCase()) {
          this.set({ email: DEFAULT_USER.email, since: new Date().toISOString() });
          this.notifications.success(`Bienvenue, ${DEFAULT_USER.name}.`);
          resolve({ ok: true });
          return;
        }
        resolve({ ok: false, error: 'Identifiants incorrects (compte MySQL admin@fablab.ci).' });
      }, 300);
    });
  }

  logout(): void {
    this.set({ email: null, since: null });
  }

  private set(s: Session): void {
    this.session.set(s);
    this.storage.set('session', s);
  }
}
