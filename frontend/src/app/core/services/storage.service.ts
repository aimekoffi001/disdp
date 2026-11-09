import { Injectable } from '@angular/core';
import { APP_SETTINGS } from '../config/app-settings';

/** Accès stockage local isolé pour les préférences et la session active. */
@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(APP_SETTINGS.storagePrefix + key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(APP_SETTINGS.storagePrefix + key, JSON.stringify(value));
    } catch (e) {
      console.warn('[Storage] écriture impossible', e);
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(APP_SETTINGS.storagePrefix + key);
    } catch {}
  }

  clearAll(): void {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(APP_SETTINGS.storagePrefix))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* stockage indisponible */
    }
  }
}
