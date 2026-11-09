import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MissionInput } from '../../core/models/models';
import { DroneService } from '../../core/services/drone.service';
import { MissionService } from '../../core/services/mission.service';
import { UiService } from '../../core/services/ui.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-mission-form',
  imports: [ReactiveFormsModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ui.missionForm(); as ctx) {
      <app-modal [title]="ctx.mission ? 'Modifier la mission' : 'Créer une mission'" (closed)="close()">
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-3" novalidate>
          <div>
            <label class="field-label" for="mf-name">Nom de la mission</label>
            <input id="mf-name" class="field" formControlName="name" placeholder="Ex: Patrouille thermique zone Nord" />
            @if (show('name')) { <p class="field-error">Le nom est obligatoire.</p> }
          </div>
          <div>
            <label class="field-label" for="mf-drone">Assigner un drone (optionnel)</label>
            <select id="mf-drone" class="field" formControlName="droneId">
              <option value="">— Aucun drone assigné pour le moment —</option>
              @for (d of drones.drones(); track d.id) {
                <option [value]="d.id">{{ d.name }} ({{ d.code }})</option>
              }
            </select>
          </div>
          <div>
            <label class="field-label" for="mf-dur">Durée prévue (minutes)</label>
            <input id="mf-dur" type="number" min="1" class="field" formControlName="durationMin" />
            @if (show('durationMin')) { <p class="field-error">Durée invalide (1 à 1440).</p> }
          </div>
          <div>
            <label class="field-label" for="mf-desc">Description & Objectifs</label>
            <textarea id="mf-desc" rows="4" maxlength="500" class="field resize-none" formControlName="description" placeholder="Objectif de la mission, consignes de vol..."></textarea>
          </div>
          @if (error()) {
            <div class="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/15 p-2.5 text-xs text-[#F87171]" role="alert">
              <strong>Erreur :</strong> {{ error() }}
            </div>
          }
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn-ghost" [disabled]="submitting()" (click)="close()">Annuler</button>
            <button type="submit" class="btn-pill" [disabled]="submitting()">
              @if (submitting()) {
                <span>Enregistrement...</span>
              } @else {
                <span>{{ ctx.mission ? 'Enregistrer les modifications' : 'Créer la mission' }}</span>
              }
            </button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class MissionFormComponent {
  protected readonly ui = inject(UiService);
  protected readonly drones = inject(DroneService);
  private readonly missions = inject(MissionService);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly error = signal('');
  protected readonly submitting = signal(false);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    droneId: [''],
    durationMin: [60, [Validators.required, Validators.min(1), Validators.max(1440)]],
    description: [''],
  });

  constructor() {
    effect(() => {
      const ctx = this.ui.missionForm();
      if (!ctx) return;
      untracked(() => {
        this.error.set('');
        this.submitting.set(false);
        const m = ctx.mission;
        this.form.reset(
          m
            ? { name: m.name, droneId: m.droneId || '', durationMin: m.durationMin, description: m.description }
            : { name: '', droneId: '', durationMin: 60, description: '' }
        );
      });
    });
  }

  protected show(c: 'name' | 'durationMin'): boolean {
    const ctl = this.form.controls[c];
    return ctl.invalid && (ctl.touched || ctl.dirty);
  }

  protected close(): void {
    if (!this.submitting()) {
      this.ui.missionForm.set(null);
    }
  }

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.submitting.set(true);
    this.error.set('');

    const value: MissionInput = this.form.getRawValue();
    const ctx = this.ui.missionForm();

    const res = ctx?.mission
      ? await this.missions.update(ctx.mission.id, value)
      : await this.missions.add(value);

    this.submitting.set(false);

    if (res.ok) {
      this.ui.missionForm.set(null);
    } else {
      this.error.set(res.error ?? 'Erreur lors de la création de la mission.');
    }
  }
}
