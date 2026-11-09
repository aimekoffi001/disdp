import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DroneInput, DroneStatus } from '../../core/models/models';
import { DroneService } from '../../core/services/drone.service';
import { UiService } from '../../core/services/ui.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { DRONE_STATUS } from '../../shared/utils/labels';

@Component({
  selector: 'app-drone-form',
  imports: [ReactiveFormsModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ui.droneForm(); as ctx) {
      <app-modal [title]="ctx.drone ? 'Modifier le drone' : 'Ajouter un drone'" (closed)="close()">
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-3" novalidate>
          <div>
            <label class="field-label" for="df-name">Nom du drone</label>
            <input id="df-name" class="field" formControlName="name" placeholder="Ex: Faucon UVCI 5" />
            @if (show('name')) { <p class="field-error">Le nom est obligatoire.</p> }
          </div>
          <div>
            <label class="field-label" for="df-code">Code drone (identifiant unique)</label>
            <input id="df-code" class="field" formControlName="code" placeholder="Ex: DRN-005" />
            @if (show('code')) { <p class="field-error">Format attendu : DRN-001 ou DRN-XXX.</p> }
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="field-label" for="df-status">Statut opérationnel</label>
              <select id="df-status" class="field" formControlName="status">
                @for (s of statuses; track s.value) { <option [value]="s.value">{{ s.label }}</option> }
              </select>
            </div>
            <div>
              <label class="field-label" for="df-bat">Niveau de batterie (%)</label>
              <input id="df-bat" type="number" class="field" formControlName="batteryLevel" />
              @if (show('batteryLevel')) { <p class="field-error">La batterie doit être un nombre valide.</p> }
            </div>
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
                <span>Enregistrement en cours...</span>
              } @else {
                <span>{{ ctx.drone ? 'Enregistrer les modifications' : 'Ajouter le drone' }}</span>
              }
            </button>
          </div>
        </form>
      </app-modal>
    }
  `,
})
export class DroneFormComponent {
  protected readonly ui = inject(UiService);
  private readonly drones = inject(DroneService);
  private readonly fb = inject(FormBuilder).nonNullable;
  protected readonly error = signal('');
  protected readonly submitting = signal(false);
  protected readonly statuses = (Object.keys(DRONE_STATUS) as DroneStatus[]).map((value) => ({ value, label: DRONE_STATUS[value].label }));

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    code: [''],
    status: ['available' as DroneStatus],
    batteryLevel: [100, [Validators.required]],
  });

  constructor() {
    effect(() => {
      const ctx = this.ui.droneForm();
      if (!ctx) return;
      untracked(() => {
        this.error.set('');
        this.submitting.set(false);
        const d = ctx.drone;
        this.form.reset(
          d
            ? { name: d.name, code: d.code, status: d.status, batteryLevel: d.batteryLevel }
            : { name: '', code: this.nextCode(), status: 'available', batteryLevel: 100 },
        );
      });
    });
  }

  protected show(c: 'name' | 'code' | 'batteryLevel'): boolean {
    const ctl = this.form.controls[c];
    return ctl.invalid && (ctl.touched || ctl.dirty);
  }

  protected close(): void {
    if (!this.submitting()) {
      this.ui.droneForm.set(null);
    }
  }

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.submitting.set(true);
    this.error.set('');

    const value = this.form.getRawValue() as DroneInput;
    const ctx = this.ui.droneForm();

    const res = ctx?.drone
      ? await this.drones.update(ctx.drone.id, value)
      : await this.drones.add(value);

    this.submitting.set(false);

    if (res.ok) {
      this.ui.droneForm.set(null);
    } else {
      this.error.set(res.error ?? 'Erreur lors de la communication avec le serveur.');
    }
  }

  private nextCode(): string {
    const list = this.drones.drones();
    const max = list.reduce((m, d) => Math.max(m, Number(/(\d+)$/.exec(d.code)?.[1] ?? 0)), 0);
    return `DRN-${String(max + 1).padStart(3, '0')}`;
  }
}
