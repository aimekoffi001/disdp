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

/** Comptes de démonstration. Aucune authentification réelle : à remplacer par un vrai fournisseur d'identité. */
export const DEMO_ACCOUNTS: (AuthUser & { password: string })[] = [
  { name: 'Admin', email: 'admin@dispd.demo', password: 'demo1234', role: 'Administrateur', organization: 'DISPD Operations', initials: 'AD', permissions: ['Gérer la flotte', 'Créer des missions', 'Programmer des vols', 'Traiter les alertes', 'Paramètres'] },
  { name: 'Opérateur', email: 'operateur@dispd.demo', password: 'demo1234', role: 'Opérateur de vol', organization: 'DISPD Operations', initials: 'OP', permissions: ['Consulter la flotte', 'Créer des missions', 'Traiter les alertes'] },
];

/** Connexion / déconnexion simulées (état conservé dans le navigateur). */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(StorageService);
  private readonly notifications = inject(NotificationService);

  private readonly session = signal<Session>(
    this.storage.get<Session>('session', { email: DEMO_ACCOUNTS[0].email, since: new Date().toISOString() }),
  );
  readonly loading = signal(false);

  readonly user = computed<AuthUser | null>(() => {
    const email = this.session().email;
    const acc = DEMO_ACCOUNTS.find((a) => a.email === email);
    if (!acc) return null;
    const { password: _pw, ...user } = acc;
    return user;
  });
  readonly connectedSince = computed(() => this.session().since);

  login(email: string, password: string): Promise<OpResult> {
    this.loading.set(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        this.loading.set(false);
        const acc = DEMO_ACCOUNTS.find((a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password);
        if (!acc) {
          resolve({ ok: false, error: 'Identifiants incorrects.' });
          return;
        }
        this.set({ email: acc.email, since: new Date().toISOString() });
        this.notifications.success(`Bienvenue, ${acc.name}.`);
        resolve({ ok: true });
      }, 600);
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
