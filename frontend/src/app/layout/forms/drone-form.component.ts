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
            <label class="field-label" for="df-name">Nom</label>
            <input id="df-name" class="field" formControlName="name" placeholder="Drone 5" />
            @if (show('name')) { <p class="field-error">Le nom est obligatoire.</p> }
          </div>
          <div>
            <label class="field-label" for="df-code">Code</label>
            <input id="df-code" class="field" formControlName="code" placeholder="DR-005" />
            @if (show('code')) { <p class="field-error">Format attendu : DR-005.</p> }
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="field-label" for="df-status">Statut</label>
              <select id="df-status" class="field" formControlName="status">
                @for (s of statuses; track s.value) { <option [value]="s.value">{{ s.label }}</option> }
              </select>
            </div>
            <div>
              <label class="field-label" for="df-bat">Batterie (%)</label>
              <input id="df-bat" type="number" min="0" max="100" class="field" formControlName="batteryLevel" />
              @if (show('batteryLevel')) { <p class="field-error">Entre 0 et 100.</p> }
            </div>
          </div>
          @if (error()) { <p class="field-error" role="alert">{{ error() }}</p> }
          <div class="flex justify-end gap-2 pt-1">
            <button type="button" class="btn-ghost" (click)="close()">Annuler</button>
            <button type="submit" class="btn-pill">{{ ctx.drone ? 'Enregistrer' : 'Ajouter' }}</button>
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
  protected readonly statuses = (Object.keys(DRONE_STATUS) as DroneStatus[]).map((value) => ({ value, label: DRONE_STATUS[value].label }));

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    code: ['', [Validators.required, Validators.pattern(/^DR-\d{3}$/i)]],
    status: ['available' as DroneStatus],
    batteryLevel: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
  });

  constructor() {
    effect(() => {
      const ctx = this.ui.droneForm();
      if (!ctx) return;
      // untracked : la télémétrie met à jour les drones chaque seconde, ce qui ne doit jamais réinitialiser la saisie
      untracked(() => {
        this.error.set('');
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
    this.ui.droneForm.set(null);
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const value = this.form.getRawValue() as DroneInput;
    const ctx = this.ui.droneForm();
    const res = ctx?.drone ? this.drones.update(ctx.drone.id, value) : this.drones.add(value);
    if (res.ok) this.close();
    else this.error.set(res.error ?? 'Opération impossible.');
  }

  private nextCode(): string {
    const max = this.drones.drones().reduce((m, d) => Math.max(m, Number(/(\d+)$/.exec(d.code)?.[1] ?? 0)), 0);
    return `DR-${String(max + 1).padStart(3, '0')}`;
  }
}
