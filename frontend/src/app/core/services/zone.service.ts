import { Injectable, inject, signal } from '@angular/core';
import { SurveillanceZone } from '../models/models';
import { BackendService } from './backend.service';

@Injectable({ providedIn: 'root' })
export class ZoneService {
  private readonly backend = inject(BackendService);
  private readonly _zones = signal<SurveillanceZone[]>([]);
  readonly zones = this._zones.asReadonly();
  readonly loading = signal<boolean>(true);

  constructor() {
    this.loadFromBackend();
  }

  async loadFromBackend(): Promise<void> {
    this.loading.set(true);
    try {
      const zones = await this.backend.getZones();
      this._zones.set(zones);
    } finally {
      this.loading.set(false);
    }
  }

  byId(id: string): SurveillanceZone | undefined {
    return this._zones().find((z) => z.id === id);
  }
}
