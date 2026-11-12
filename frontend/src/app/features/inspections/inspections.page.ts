import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BackendService } from '../../core/services/backend.service';
import { DroneService } from '../../core/services/drone.service';
import { NotificationService } from '../../core/services/notification.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-inspections-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto flex max-w-[1600px] flex-col gap-4">
      <!-- En-tête -->
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#1E3A5F] bg-[#0A192F] p-4 shadow-xl">
        <div class="flex items-center gap-3">
          <div class="flex size-10 items-center justify-center rounded-xl border border-[#38BDF8]/40 bg-[#112240] text-[#38BDF8]">
            <app-icon name="missions" [size]="22" />
          </div>
          <div>
            <h1 class="text-lg font-black text-white">Inspections Techniques & Conformité Aérienne</h1>
            <p class="text-xs text-[#94A3B8]">Checklist pré-vol/post-vol des moteurs, hélices, châssis et batteries connectée à MySQL</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="showAddModal.set(true)"
            class="flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-3.5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#1D4ED8]">
            <app-icon name="plus" [size]="14" />
            <span>Nouvelle inspection</span>
          </button>
          <button
            type="button"
            (click)="loadInspections()"
            class="flex items-center gap-1.5 rounded-xl border border-[#1E3A5F] bg-[#112240] px-3.5 py-2 text-xs font-bold text-[#94A3B8] transition hover:text-white">
            <app-icon name="rotate" [size]="14" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      <!-- Résumé KPI -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-xl border border-[#1E3A5F] bg-[#112240] p-3 shadow-md">
          <span class="text-xs font-semibold text-[#94A3B8]">Inspections Réalisées</span>
          <div class="mt-1 text-2xl font-black text-white">{{ inspections().length }}</div>
        </div>
        <div class="rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 p-3 shadow-md">
          <span class="text-xs font-semibold text-[#34D399]">Drones Aptes au Vol</span>
          <div class="mt-1 text-2xl font-black text-[#34D399]">{{ fitCount() }}</div>
        </div>
        <div class="rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/10 p-3 shadow-md">
          <span class="text-xs font-semibold text-[#FBBF24]">Maintenance Requise</span>
          <div class="mt-1 text-2xl font-black text-[#FBBF24]">{{ maintenanceCount() }}</div>
        </div>
        <div class="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 shadow-md">
          <span class="text-xs font-semibold text-[#F87171]">Interdits de Vol</span>
          <div class="mt-1 text-2xl font-black text-[#F87171]">{{ groundedCount() }}</div>
        </div>
      </div>

      <!-- Tableau des inspections MySQL -->
      <div class="rounded-2xl border border-[#1E3A5F] bg-[#0A192F] p-4 shadow-xl">
        @if (loading()) {
          <div class="py-12 text-center text-sm text-[#38BDF8]">Chargement des inspections depuis MySQL...</div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-[#1E3A5F] text-[#94A3B8]">
                  <th class="p-3">Code / Date</th>
                  <th class="p-3">Drone</th>
                  <th class="p-3">Type</th>
                  <th class="p-3">Hélices & Moteurs</th>
                  <th class="p-3">Batterie & Capteurs</th>
                  <th class="p-3">Résultat Global</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#1E3A5F]/50">
                @for (insp of inspections(); track insp.id) {
                  <tr class="hover:bg-[#112240]/60 transition">
                    <td class="p-3">
                      <div class="font-bold text-white">{{ insp.code_inspection }}</div>
                      <div class="text-[10px] text-[#94A3B8]">{{ insp.date_inspection | date:'short' }}</div>
                    </td>
                    <td class="p-3 font-semibold text-[#38BDF8]">{{ insp.drone?.nom ?? ('Drone #' + insp.drone_id) }}</td>
                    <td class="p-3 capitalize text-slate-300">{{ insp.type_inspection }}</td>
                    <td class="p-3">
                      <div class="flex items-center gap-1.5">
                        <span class="size-1.5 rounded-full bg-[#10B981]"></span>
                        <span>Hélices : {{ insp.etat_helices }}</span>
                      </div>
                      <div class="flex items-center gap-1.5 text-[#94A3B8] text-[10px]">
                        <span class="size-1.5 rounded-full bg-[#10B981]"></span>
                        <span>Moteurs : {{ insp.etat_moteurs }}</span>
                      </div>
                    </td>
                    <td class="p-3">
                      <div>Batterie : {{ insp.etat_batterie }}</div>
                      <div class="text-[#94A3B8] text-[10px]">Capteurs : {{ insp.etat_capteurs }}</div>
                    </td>
                    <td class="p-3">
                      <span [class]="'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ' +
                                     (insp.resultat_global === 'apte_au_vol'
                                       ? 'bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/30'
                                       : 'bg-[#EF4444]/20 text-[#F87171] border border-[#EF4444]/30')">
                        {{ insp.resultat_global === 'apte_au_vol' ? 'APTE AU VOL' : 'MAINTENANCE REQUISE' }}
                      </span>
                    </td>
                    <td class="p-3 text-right">
                      <button
                        type="button"
                        (click)="deleteInspection(insp.id)"
                        class="rounded-lg p-1.5 text-[#F87171] hover:bg-[#EF4444]/20 transition"
                        title="Supprimer">
                        <app-icon name="trash" [size]="14" />
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="py-12 text-center text-[#94A3B8]">
                      Aucune inspection enregistrée en base de données. Effectuez votre première checklist.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Modal Nouvelle Inspection -->
      @if (showAddModal()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div class="w-full max-w-lg rounded-2xl border border-[#1E3A5F] bg-[#0A192F] p-5 shadow-2xl">
            <h3 class="text-base font-extrabold text-white">Nouvelle Inspection Technique (Persistance MySQL)</h3>
            <form (ngSubmit)="submitInspection()" class="mt-4 space-y-3">
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-semibold text-[#94A3B8] mb-1">Drone à inspecter</label>
                  <select [(ngModel)]="newInsp.drone_id" name="drone_id" class="field">
                    @for (d of drones.drones(); track d.id) {
                      <option [value]="d.id">{{ d.name }} ({{ d.code }})</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-[#94A3B8] mb-1">Type d'inspection</label>
                  <select [(ngModel)]="newInsp.type_inspection" name="type" class="field">
                    <option value="pre_vol">Pré-vol (Avant départ)</option>
                    <option value="post_vol">Post-vol (Après atterrissage)</option>
                    <option value="maintenance_periodique">Maintenance Périodique</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-[11px] font-semibold text-[#94A3B8] mb-1">Hélices</label>
                  <select [(ngModel)]="newInsp.etat_helices" name="helices" class="field text-xs">
                    <option value="conforme">Conforme</option>
                    <option value="a_remplacer">À remplacer</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-[#94A3B8] mb-1">Moteurs</label>
                  <select [(ngModel)]="newInsp.etat_moteurs" name="moteurs" class="field text-xs">
                    <option value="conforme">Conforme</option>
                    <option value="vibration">Vibration anormale</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-[#94A3B8] mb-1">Batterie</label>
                  <select [(ngModel)]="newInsp.etat_batterie" name="batterie" class="field text-xs">
                    <option value="conforme">Conforme</option>
                    <option value="gonflee">Dégradée</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#94A3B8] mb-1">Résultat Global</label>
                <select [(ngModel)]="newInsp.resultat_global" name="resultat" class="field font-bold">
                  <option value="apte_au_vol">APTE AU VOL (Autorisé)</option>
                  <option value="maintenance_requise">MAINTENANCE REQUISE</option>
                  <option value="cloue_au_sol">CLOUÉ AU SOL (Interdit)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-[#94A3B8] mb-1">Observations / Commentaires</label>
                <textarea [(ngModel)]="newInsp.commentaires" name="comm" rows="2" class="field resize-none" placeholder="Notes du technicien..."></textarea>
              </div>

              <div class="flex justify-end gap-2 pt-3">
                <button type="button" (click)="showAddModal.set(false)" class="btn-ghost">Annuler</button>
                <button type="submit" class="btn-pill">Enregistrer l'inspection</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class InspectionsPage {
  protected readonly backend = inject(BackendService);
  protected readonly drones = inject(DroneService);
  private readonly notifications = inject(NotificationService);

  readonly inspections = signal<any[]>([]);
  readonly loading = signal(true);
  readonly showAddModal = signal(false);

  readonly fitCount = computed(() =>
    this.inspections().filter((i) => i.resultat_global === 'apte_au_vol').length
  );
  readonly maintenanceCount = computed(() =>
    this.inspections().filter((i) => i.resultat_global === 'maintenance_requise').length
  );
  readonly groundedCount = computed(() =>
    this.inspections().filter((i) => i.resultat_global === 'cloue_au_sol').length
  );

  newInsp = {
    drone_id: '',
    type_inspection: 'pre_vol',
    etat_helices: 'conforme',
    etat_moteurs: 'conforme',
    etat_batterie: 'conforme',
    resultat_global: 'apte_au_vol',
    commentaires: '',
  };

  constructor() {
    this.loadInspections();
  }

  async loadInspections(): Promise<void> {
    this.loading.set(true);
    const data = await this.backend.getInspections();
    this.inspections.set(data);
    this.loading.set(false);
  }

  async submitInspection(): Promise<void> {
    const payload = {
      drone_id: Number(this.newInsp.drone_id || this.drones.drones()[0]?.id || 1),
      type_inspection: this.newInsp.type_inspection,
      etat_helices: this.newInsp.etat_helices,
      etat_moteurs: this.newInsp.etat_moteurs,
      etat_batterie: this.newInsp.etat_batterie,
      etat_capteurs: 'conforme',
      etat_cameras: 'conforme',
      etat_chassis: 'conforme',
      resultat_global: this.newInsp.resultat_global,
      commentaires: this.newInsp.commentaires,
      date_inspection: new Date().toISOString(),
    };

    const res = await this.backend.createInspection(payload);
    if (res.ok) {
      this.notifications.success('Rapport d\'inspection enregistré dans la base MySQL.');
      this.showAddModal.set(false);
      this.newInsp.commentaires = '';
      await this.loadInspections();
    } else {
      this.notifications.push(res.error || 'Erreur lors de l\'enregistrement', 'error');
    }
  }

  async deleteInspection(id: any): Promise<void> {
    if (!confirm('Voulez-vous vraiment supprimer ce rapport d\'inspection ?')) return;
    const res = await this.backend.deleteInspection(String(id));
    if (res.ok) {
      this.notifications.success('Rapport supprimé de MySQL.');
      await this.loadInspections();
    } else {
      this.notifications.push(res.error || 'Erreur de suppression', 'error');
    }
  }
}
