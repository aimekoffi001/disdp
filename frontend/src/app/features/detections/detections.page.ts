import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BackendService } from '../../core/services/backend.service';
import { DroneService } from '../../core/services/drone.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-detections-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-[1600px] flex-col gap-4">
      <!-- En-tête -->
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E3A5F] bg-[#0A192F] p-4 shadow-xl">
        <div class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-xl border border-[#EF4444]/40 bg-[#112240] text-[#F87171]">
            <app-icon name="alert" [size]="22" />
          </div>
          <div>
            <h1 class="text-lg font-black text-white">Détection des Pannes & Obstacles IA</h1>
            <p class="text-xs text-[#94A3B8]">Analyse thermique, anomalies moteurs, vibrations et obstacles LiDAR connectés à MySQL</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="showAddModal.set(true)"
            class="flex items-center gap-1.5 rounded-xl bg-[#EF4444] px-3.5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#DC2626]">
            <app-icon name="plus" [size]="14" />
            <span>Signaler une détection</span>
          </button>
          <button
            type="button"
            (click)="loadDetections()"
            class="flex items-center gap-1.5 rounded-xl border border-[#1E3A5F] bg-[#112240] px-3.5 py-2 text-xs font-bold text-[#94A3B8] transition hover:text-white">
            <app-icon name="rotate" [size]="14" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <!-- Résumé KPI -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-xl border border-[#1E3A5F] bg-[#112240] p-3 shadow-md">
          <span class="text-xs font-semibold text-[#94A3B8]">Total Détections</span>
          <div class="mt-1 text-2xl font-black text-white">{{ detections().length }}</div>
        </div>
        <div class="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 shadow-md">
          <span class="text-xs font-semibold text-[#F87171]">Critiques / Élevées</span>
          <div class="mt-1 text-2xl font-black text-[#F87171]">{{ criticalCount() }}</div>
        </div>
        <div class="rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-3 shadow-md">
          <span class="text-xs font-semibold text-[#FBBF24]">À traiter</span>
          <div class="mt-1 text-2xl font-black text-[#FBBF24]">{{ pendingCount() }}</div>
        </div>
        <div class="rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 p-3 shadow-md">
          <span class="text-xs font-semibold text-[#34D399]">Résolues</span>
          <div class="mt-1 text-2xl font-black text-[#34D399]">{{ resolvedCount() }}</div>
        </div>
      </div>

      <!-- Tableau des détections MySQL -->
      <div class="rounded-2xl border border-[#1E3A5F] bg-[#0A192F] p-4 shadow-xl">
        @if (loading()) {
          <div class="py-12 text-center text-sm text-[#38BDF8]">Chargement des détections depuis la base MySQL...</div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-[#1E3A5F] text-[#94A3B8]">
                  <th class="p-3">Cible / Panne Détectée</th>
                  <th class="p-3">Type</th>
                  <th class="p-3">Drone</th>
                  <th class="p-3">Confiance IA</th>
                  <th class="p-3">Gravité</th>
                  <th class="p-3">Date</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#1E3A5F]/50">
                @for (d of detections(); track d.id) {
                  <tr class="hover:bg-[#112240]/60 transition">
                    <td class="p-3">
                      <div class="font-bold text-white">{{ d.cible_detectee }}</div>
                      @if (d.details) {
                        <div class="text-[10px] text-[#94A3B8]">{{ d.details }}</div>
                      }
                    </td>
                    <td class="p-3 capitalize text-slate-300">{{ d.type_detection }}</td>
                    <td class="p-3 font-medium text-[#38BDF8]">{{ d.drone?.nom ?? ('Drone #' + d.drone_id) }}</td>
                    <td class="p-3 font-mono font-bold text-[#34D399]">{{ d.confiance_pct || 92 }} %</td>
                    <td class="p-3">
                      <span [class]="'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ' +
                                     (d.niveau_gravite === 'critique' || d.niveau_gravite === 'eleve'
                                       ? 'bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/30'
                                       : 'bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/30')">
                        {{ d.niveau_gravite }}
                      </span>
                    </td>
                    <td class="p-3 text-[#94A3B8]">{{ d.date_detection | date:'short' }}</td>
                    <td class="p-3 text-right">
                      <button
                        type="button"
                        (click)="deleteDetection(d.id)"
                        class="rounded-lg p-1.5 text-[#F87171] hover:bg-[#EF4444]/20 transition"
                        title="Supprimer">
                        <app-icon name="trash" [size]="14" />
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="py-12 text-center text-[#94A3B8]">
                      Aucune anomalie ni panne signalée dans la base MySQL. Tout le matériel est nominal.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Modal d'ajout de détection -->
      @if (showAddModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div class="w-full max-w-md rounded-2xl border border-[#1E3A5F] bg-[#0A192F] p-5 shadow-2xl">
            <h3 class="text-base font-extrabold text-white">Signaler une détection (Persistance MySQL)</h3>
            <form (ngSubmit)="submitDetection()" class="mt-4 space-y-3">
              <div>
                <label class="block text-xs font-semibold text-[#94A3B8] mb-1">Cible / Panne détectée</label>
                <input [(ngModel)]="newDetection.cible_detectee" name="cible" required class="field" placeholder="Ex: Surchauffe Moteur 3 (Temp: 64°C)" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#94A3B8] mb-1">Type de détection</label>
                <select [(ngModel)]="newDetection.type_detection" name="type" class="field">
                  <option value="panne_materielle">Panne Matérielle</option>
                  <option value="surchauffe">Surchauffe Moteur</option>
                  <option value="vibration_anormale">Vibration Anormale</option>
                  <option value="obstacle">Obstacle Proche (LiDAR)</option>
                  <option value="intrusion">Intrusion Zone Sécurisée</option>
                </select>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-semibold text-[#94A3B8] mb-1">Gravité</label>
                  <select [(ngModel)]="newDetection.niveau_gravite" name="gravite" class="field">
                    <option value="critique">Critique</option>
                    <option value="eleve">Élevé</option>
                    <option value="moyen">Moyen</option>
                    <option value="faible">Faible</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#94A3B8] mb-1">Confiance IA (%)</label>
                  <input [(ngModel)]="newDetection.confiance_pct" type="number" min="1" max="100" name="confiance" class="field" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#94A3B8] mb-1">Drone concerné</label>
                <select [(ngModel)]="newDetection.drone_id" name="drone_id" class="field">
                  @for (d of drones.drones(); track d.id) {
                    <option [value]="d.id">{{ d.name }} ({{ d.code }})</option>
                  }
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#94A3B8] mb-1">Détails complémentaires</label>
                <textarea [(ngModel)]="newDetection.details" name="details" rows="2" class="field resize-none" placeholder="Observations et recommandations..."></textarea>
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
export class DetectionsPage {
  protected readonly backend = inject(BackendService);
  protected readonly drones = inject(DroneService);
  private readonly notifications = inject(NotificationService);

  readonly detections = signal<any[]>([]);
  readonly loading = signal(true);
  readonly showAddModal = signal(false);

  readonly criticalCount = computed(() =>
    this.detections().filter((d) => d.niveau_gravite === 'critique' || d.niveau_gravite === 'eleve').length
  );
  readonly pendingCount = computed(() =>
    this.detections().filter((d) => d.statut === 'a_traiter' || d.statut === 'en_cours').length
  );
  readonly resolvedCount = computed(() =>
    this.detections().filter((d) => d.statut === 'resolu' || d.statut === 'traite').length
  );

  newDetection = {
    cible_detectee: '',
    type_detection: 'surchauffe',
    niveau_gravite: 'eleve',
    confiance_pct: 95.0,
    drone_id: '',
    details: '',
  };

  constructor() {
    this.loadDetections();
  }

  async loadDetections(): Promise<void> {
    this.loading.set(true);
    const data = await this.backend.getDetections();
    this.detections.set(data);
    this.loading.set(false);
  }

  async submitDetection(): Promise<void> {
    const payload = {
      cible_detectee: this.newDetection.cible_detectee,
      type_detection: this.newDetection.type_detection,
      niveau_gravite: this.newDetection.niveau_gravite,
      confiance_pct: Number(this.newDetection.confiance_pct),
      drone_id: Number(this.newDetection.drone_id || this.drones.drones()[0]?.id || 1),
      details: this.newDetection.details,
      date_detection: new Date().toISOString(),
      statut: 'a_traiter',
    };

    const res = await this.backend.createDetection(payload);
    if (res.ok) {
      this.notifications.success(`Détection « ${this.newDetection.cible_detectee} » enregistrée dans MySQL.`);
      this.showAddModal.set(false);
      this.newDetection.cible_detectee = '';
      this.newDetection.details = '';
      await this.loadDetections();
    } else {
      this.notifications.push(res.error || 'Erreur lors de l\'enregistrement', 'error');
    }
  }

  async deleteDetection(id: any): Promise<void> {
    if (!confirm('Voulez-vous vraiment supprimer cette détection de la base de données ?')) return;
    const res = await this.backend.deleteDetection(String(id));
    if (res.ok) {
      this.notifications.success('Détection supprimée de MySQL.');
      await this.loadDetections();
    } else {
      this.notifications.push(res.error || 'Erreur de suppression', 'error');
    }
  }
}
