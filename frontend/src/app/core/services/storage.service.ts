import { Injectable } from '@angular/core';
import { APP_SETTINGS } from '../config/app-settings';

/** Accès localStorage isolé : remplaçable par un appel API sans toucher aux composants. */
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
