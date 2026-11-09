import { Injectable, computed, inject, signal } from '@angular/core';
import { NotificationService } from './notification.service';
import { OpResult } from '../models/models';
import { StorageService } from './storage.service';
import { BackendService } from './backend.service';

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  initials: string;
  permissions: string[];
}

interface Session { email: string | null; since: string | null }

export const DEFAULT_USER: AuthUser = {
  id: '1',
  name: 'Admin FabLab',
  email: 'admin@fablab.ci',
  role: 'Administrateur',
  organization: 'UVCI FabLab',
  initials: 'AF',
  permissions: ['Gérer la flotte', 'Créer des missions', 'Programmer des vols', 'Traiter les alertes', 'Paramètres'],
};

export const DB_ACCOUNTS: (AuthUser & { password: string })[] = [
  {
    ...DEFAULT_USER,
    password: 'password123',
  },
  {
    id: '2',
    name: 'Ibrahim Koné',
    email: 'pilote.kone@fablab.ci',
    password: 'password123',
    role: 'Opérateur de vol',
    organization: 'UVCI FabLab',
    initials: 'IK',
    permissions: ['Consulter la flotte', 'Créer des missions', 'Traiter les alertes'],
  },
];

export const DEMO_ACCOUNTS = DB_ACCOUNTS;

/** Gestion de l'authentification et de la session connectée à MySQL via /api/login */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(StorageService);
  private readonly notifications = inject(NotificationService);
  private readonly backend = inject(BackendService);

  private readonly session = signal<Session>(
    this.storage.get<Session>('session', { email: DEFAULT_USER.email, since: new Date().toISOString() }),
  );
  private readonly currentUser = signal<AuthUser | null>(
    this.storage.get<AuthUser | null>('logged_user', DEFAULT_USER),
  );

  readonly loading = signal(false);

  readonly user = computed<AuthUser | null>(() => {
    if (!this.session().email) return null;
    return this.currentUser() ?? DEFAULT_USER;
  });

  readonly connectedSince = computed(() => this.session().since);

  async login(email: string, password: string): Promise<OpResult> {
    this.loading.set(true);
    try {
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      const res = await fetch(`${this.backend.baseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = data.message || (data.errors ? Object.values(data.errors).flat().join(' ') : `Erreur ${res.status}`);
        return { ok: false, error: errorMsg };
      }

      const user: AuthUser = data.user || {
        name: cleanEmail.split('@')[0],
        email: cleanEmail,
        role: 'Utilisateur',
        organization: 'UVCI FabLab',
        initials: cleanEmail.substring(0, 2).toUpperCase(),
        permissions: ['Consulter la flotte'],
      };

      this.currentUser.set(user);
      this.set({ email: user.email, since: new Date().toISOString() });
      this.storage.set('logged_user', user);
      this.notifications.success(`Bienvenue, ${user.name}.`);
      return { ok: true, data: user };
    } catch (err: any) {
      return { ok: false, error: `Impossible de contacter le serveur : ${err.message}` };
    } finally {
      this.loading.set(false);
    }
  }

  logout(): void {
    this.currentUser.set(null);
    this.set({ email: null, since: null });
    this.storage.remove('logged_user');
    this.notifications.push('Vous avez été déconnecté.', 'info');
  }

  private set(s: Session): void {
    this.session.set(s);
    this.storage.set('session', s);
  }
}
