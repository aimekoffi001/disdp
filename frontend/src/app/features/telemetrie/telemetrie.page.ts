import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BackendService } from '../../core/services/backend.service';
import { DroneService } from '../../core/services/drone.service';
import { NotificationService } from '../../core/services/notification.service';
import { TelemetryService } from '../../core/services/telemetry.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-telemetrie-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-[1600px] flex-col gap-4">
      <!-- En-tête -->
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E3A5F] bg-[#0A192F] p-4 shadow-xl">
        <div class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-xl border border-[#38BDF8]/40 bg-[#112240] text-[#38BDF8]">
            <app-icon name="gauge" [size]="22" />
          </div>
          <div>
            <h1 class="text-lg font-black text-white">Capteurs & Télémétrie Environnementale</h1>
            <p class="text-xs text-[#94A3B8]">Synchronisation des sondes météo, barométriques, LiDAR et capteurs MySQL</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="showAddModal.set(true)"
            class="flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-3.5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#1D4ED8]">
            <app-icon name="plus" [size]="14" />
            <span>Nouveau capteur</span>
          </button>
          <button
            type="button"
            (click)="loadSensors()"
            class="flex items-center gap-1.5 rounded-xl border border-[#1E3A5F] bg-[#112240] px-3.5 py-2 text-xs font-bold text-[#94A3B8] transition hover:text-white">
            <app-icon name="rotate" [size]="14" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <!-- Métriques d'ambiance et météo temps réel -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div class="rounded-xl border border-[#1E3A5F] bg-[#112240] p-3 shadow-md">
          <div class="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Température</span>
            <app-icon name="thermometer" [size]="14" class="text-[#EF4444]" />
          </div>
          <div class="mt-2 text-xl font-black text-white">31.4 °C</div>
          <div class="text-[10px] text-[#34D399]">Ambiance tropicale (UVCI)</div>
        </div>

        <div class="rounded-xl border border-[#1E3A5F] bg-[#112240] p-3 shadow-md">
          <div class="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Humidité</span>
            <app-icon name="droplets" [size]="14" class="text-[#38BDF8]" />
          </div>
          <div class="mt-2 text-xl font-black text-white">68 %</div>
          <div class="text-[10px] text-[#38BDF8]">Conditions idéales</div>
        </div>

        <div class="rounded-xl border border-[#1E3A5F] bg-[#112240] p-3 shadow-md">
          <div class="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Pression</span>
            <app-icon name="gauge" [size]="14" class="text-[#A855F7]" />
          </div>
          <div class="mt-2 text-xl font-black text-white">1013.2 hPa</div>
          <div class="text-[10px] text-slate-400">Pression standard</div>
        </div>

        <div class="rounded-xl border border-[#1E3A5F] bg-[#112240] p-3 shadow-md">
          <div class="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Vent moyen</span>
            <app-icon name="wind" [size]="14" class="text-[#10B981]" />
          </div>
          <div class="mt-2 text-xl font-black text-white">14.5 km/h</div>
          <div class="text-[10px] text-[#10B981]">Vent modéré (NE 65°)</div>
        </div>

        <div class="rounded-xl border border-[#1E3A5F] bg-[#112240] p-3 shadow-md">
          <div class="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Rafales</span>
            <app-icon name="wind" [size]="14" class="text-[#F59E0B]" />
          </div>
          <div class="mt-2 text-xl font-black text-white">19.8 km/h</div>
          <div class="text-[10px] text-[#F59E0B]">Sous le seuil d'alerte</div>
        </div>

        <div class="rounded-xl border border-[#1E3A5F] bg-[#112240] p-3 shadow-md">
          <div class="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Qualité de l'Air</span>
            <app-icon name="activity" [size]="14" class="text-[#38BDF8]" />
          </div>
          <div class="mt-2 text-xl font-black text-white">34 AQI</div>
          <div class="text-[10px] text-[#34D399]">Air purifié</div>
        </div>
      </div>

      <!-- Liste des capteurs connectés en Base MySQL -->
      <div class="rounded-2xl border border-[#1E3A5F] bg-[#0A192F] p-4 shadow-xl">
        <div class="flex items-center justify-between pb-3">
          <h2 class="text-sm font-extrabold text-white">Inventaire des capteurs actifs en base de données</h2>
          <span class="rounded-full bg-[#38BDF8]/15 px-2.5 py-0.5 text-xs font-bold text-[#38BDF8]">
            {{ sensors().length }} capteur(s) enregistré(s)
          </span>
        </div>

        @if (loading()) {
          <div class="py-12 text-center text-sm text-[#38BDF8]">Chargement des capteurs depuis MySQL...</div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-[#1E3A5F] text-[#94A3B8]">
                  <th class="p-3">Nom du capteur</th>
                  <th class="p-3">Type</th>
                  <th class="p-3">Drone affecté</th>
                  <th class="p-3">Dernière mesure</th>
                  <th class="p-3">Fréquence</th>
                  <th class="p-3">Statut</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#1E3A5F]/50">
                @for (s of sensors(); track s.id) {
                  <tr class="hover:bg-[#112240]/60 transition">
                    <td class="p-3 font-bold text-white">{{ s.nom }}</td>
                    <td class="p-3 text-[#94A3B8] capitalize">{{ s.type_capteur }}</td>
                    <td class="p-3 text-slate-300">{{ s.drone?.nom ?? ('Drone #' + s.drone_id) }}</td>
                    <td class="p-3 font-mono font-bold text-[#38BDF8]">
                      {{ s.derniere_valeur ?? '--' }} {{ s.unite_mesure }}
                    </td>
                    <td class="p-3 text-[#94A3B8]">{{ s.frequence_echantillonnage_hz || 1 }} Hz</td>
                    <td class="p-3">
                      <span class="inline-flex items-center gap-1 rounded-full bg-[#10B981]/20 px-2 py-0.5 text-[10px] font-bold text-[#34D399]">
                        <span class="size-1.5 rounded-full bg-[#10B981]"></span>
                        {{ s.statut }}
                      </span>
                    </td>
                    <td class="p-3 text-right">
                      <button
                        type="button"
                        (click)="deleteSensor(s.id)"
                        class="rounded-lg p-1.5 text-[#F87171] hover:bg-[#EF4444]/20 transition"
                        title="Supprimer">
                        <app-icon name="trash" [size]="14" />
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="py-12 text-center text-[#94A3B8]">
                      Aucun capteur en base de données. Cliquez sur « Nouveau capteur » pour en ajouter un.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Modal d'ajout de capteur -->
      @if (showAddModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div class="w-full max-w-md rounded-2xl border border-[#1E3A5F] bg-[#0A192F] p-5 shadow-2xl">
            <h3 class="text-base font-extrabold text-white">Ajouter un capteur (Persistance MySQL)</h3>
            <form (ngSubmit)="submitSensor()" class="mt-4 space-y-3">
              <div>
                <label class="block text-xs font-semibold text-[#94A3B8] mb-1">Nom du capteur</label>
                <input [(ngModel)]="newSensor.nom" name="nom" required class="field" placeholder="Ex: LiDAR Optique Avant" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#94A3B8] mb-1">Type de capteur</label>
                <select [(ngModel)]="newSensor.type_capteur" name="type_capteur" class="field">
                  <option value="lidar">LiDAR Télémétrie</option>
                  <option value="ultrason">Ultra-son Détection</option>
                  <option value="temperature">Sonde Thermique</option>
                  <option value="humidite">Hygrométrie</option>
                  <option value="gaz">Capteur Gaz & Fumée</option>
                  <option value="vibration">Accéléromètre Vibration</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#94A3B8] mb-1">Drone associé</label>
                <select [(ngModel)]="newSensor.drone_id" name="drone_id" class="field">
                  @for (d of drones.drones(); track d.id) {
                    <option [value]="d.id">{{ d.name }} ({{ d.code }})</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-semibold text-[#94A3B8] mb-1">Unité</label>
                  <input [(ngModel)]="newSensor.unite_mesure" name="unite" class="field" placeholder="m, °C, %, etc." />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#94A3B8] mb-1">Valeur initiale</label>
                  <input [(ngModel)]="newSensor.derniere_valeur" type="number" name="valeur" class="field" placeholder="12.5" />
                </div>
              </div>

              <div class="flex justify-end gap-2 pt-3">
                <button type="button" (click)="showAddModal.set(false)" class="btn-ghost">Annuler</button>
                <button type="submit" class="btn-pill">Enregistrer en base</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class TelemetriePage {
  protected readonly backend = inject(BackendService);
  protected readonly drones = inject(DroneService);
  protected readonly telemetry = inject(TelemetryService);
  private readonly notifications = inject(NotificationService);

  readonly sensors = signal<any[]>([]);
  readonly loading = signal(true);
  readonly showAddModal = signal(false);

  newSensor = {
    nom: '',
    type_capteur: 'lidar',
    drone_id: '',
    unite_mesure: 'm',
    derniere_valeur: 15.0,
  };

  constructor() {
    this.loadSensors();
  }

  async loadSensors(): Promise<void> {
    this.loading.set(true);
    const data = await this.backend.getSensors();
    this.sensors.set(data);
    this.loading.set(false);
  }

  async submitSensor(): Promise<void> {
    const payload = {
      nom: this.newSensor.nom,
      type_capteur: this.newSensor.type_capteur,
      drone_id: Number(this.newSensor.drone_id || this.drones.drones()[0]?.id || 1),
      unite_mesure: this.newSensor.unite_mesure,
      derniere_valeur: Number(this.newSensor.derniere_valeur),
      statut: 'actif',
    };

    const res = await this.backend.createSensor(payload);
    if (res.ok) {
      this.notifications.success(`Capteur « ${this.newSensor.nom} » enregistré dans la base MySQL.`);
      this.showAddModal.set(false);
      this.newSensor.nom = '';
      await this.loadSensors();
    } else {
      this.notifications.push(res.error || 'Erreur lors de l\'enregistrement', 'error');
    }
  }

  async deleteSensor(id: any): Promise<void> {
    if (!confirm('Voulez-vous vraiment supprimer ce capteur de la base de données ?')) return;
    const res = await this.backend.deleteSensor(String(id));
    if (res.ok) {
      this.notifications.success('Capteur supprimé de MySQL.');
      await this.loadSensors();
    } else {
      this.notifications.push(res.error || 'Erreur de suppression', 'error');
    }
  }
}

