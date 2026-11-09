import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MissionInput } from '../../core/models/models';
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
            <input id="mf-name" class="field" formControlName="name" placeholder="Surveillance champ 2" />
            @if (show('name')) { <p class="field-error">Le nom est obligatoire.</p> }
          </div>
          <div>
            <label class="field-label" for="mf-dur">Durée prévue (minutes)</label>
            <input id="mf-dur" type="number" min="1" class="field" formControlName="durationMin" />
            @if (show('durationMin')) { <p class="field-error">Durée invalide (1 à 1440).</p> }
          </div>
          <div>
            <label class="field-label" for="mf-desc">Description</label>
            <textarea id="mf-desc" rows="4" maxlength="500" class="field resize-none" formControlName="description" placeholder="Objectif, consignes, points d'attention…"></textarea>
            <p class="mt-1 text-right text-[10px] text-[#94A3B8]">{{ form.controls.description.value.length }}/500</p>
          </div>
          <p class="text-[11px] text-[#94A3B8]">Le drone, le périmètre et les modes de vol sont choisis lors de la planification du vol.</p>
          @if (error()) { <p class="field-error" role="alert">{{ error() }}</p> }
          <div class="flex justify-end gap-2 pt-1">
            <button type="button" class="btn-ghost" (click)="close()">Annuler</button>
            <button type="submit" class="btn-pill">{{ ctx.mission ? 'Enregistrer' : 'Créer' }}</button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class MissionFormComponent {
  protected readonly ui = inject(UiService);
  private readonly missions = inject(MissionService);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly error = signal('');

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    durationMin: [60, [Validators.required, Validators.min(1), Validators.max(1440)]],
    description: [''],
  });

  constructor() {
    effect(() => {
      const ctx = this.ui.missionForm();
      if (!ctx) return;
      untracked(() => {
        this.error.set('');
        const m = ctx.mission;
        this.form.reset(m ? { name: m.name, durationMin: m.durationMin, description: m.description } : { name: '', durationMin: 60, description: '' });
      });
    });
  }

  protected show(c: 'name' | 'durationMin'): boolean {
    const ctl = this.form.controls[c];
    return ctl.invalid && (ctl.touched || ctl.dirty);
  }

  protected close(): void {
    this.ui.missionForm.set(null);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value: MissionInput = this.form.getRawValue();
    const ctx = this.ui.missionForm();
    const res = ctx?.mission ? this.missions.update(ctx.mission.id, value) : this.missions.add(value);
    if (res.ok) this.close();
    else this.error.set(res.error ?? 'Opération impossible.');
  }
}
