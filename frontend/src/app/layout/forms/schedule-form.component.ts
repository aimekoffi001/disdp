import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FlightMode, LatLng, ModePlan, ModeStep, ScheduledFlightInput } from '../../core/models/models';
import { DroneService } from '../../core/services/drone.service';
import { FlightService } from '../../core/services/flight.service';
import { MissionService } from '../../core/services/mission.service';
import { UiService } from '../../core/services/ui.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PerimeterMapComponent } from '../../shared/components/perimeter-map/perimeter-map.component';
import { FLIGHT_MODE, describeModePlan, toLocalInput } from '../../shared/utils/labels';

@Component({
  selector: 'app-schedule-form',
  imports: [ReactiveFormsModule, ModalComponent, PerimeterMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ui.scheduleForm(); as ctx) {
      <app-modal [title]="ctx.flight ? 'Modifier la programmation' : 'Programmer un vol'" [width]="980" (closed)="close()">
        <p class="mb-3 rounded-lg border border-[#38BDF8]/30 bg-[#38BDF8]/10 px-3 py-1.5 text-[11px] text-[#38BDF8]">
          Planification de vol officielle DISDP · Connectée à la base de données MySQL.
        </p>
        <form [formGroup]="form" (ngSubmit)="submit()" class="grid gap-4 lg:grid-cols-[320px_1fr]" novalidate>
          <div class="space-y-3">
            <div>
              <label class="field-label" for="sf-drone">Drone utilisé</label>
              <select id="sf-drone" class="field" formControlName="droneId">
                @for (d of drones.drones(); track d.id) { <option [value]="d.id">{{ d.name }} · {{ d.code }}</option> }
              </select>
            </div>
            <div>
              <label class="field-label" for="sf-mission">Mission à exécuter</label>
              <select id="sf-mission" class="field" formControlName="missionId">
                <option value="" disabled>— Choisir une mission —</option>
                @for (m of availableMissions(ctx.flight?.missionId); track m.id) { <option [value]="m.id">{{ m.name }} ({{ m.durationMin }} min)</option> }
              </select>
              @if (availableMissions(ctx.flight?.missionId).length === 0) {
                <p class="field-error">Aucune mission disponible : créez d'abord une mission dans la section Missions.</p>
              } @else if (show('missionId')) { <p class="field-error">Choisissez une mission.</p> }
            </div>
            <div>
              <label class="field-label" for="sf-dep">Date et heure de départ</label>
              <input id="sf-dep" type="datetime-local" class="field" formControlName="departure" />
              @if (show('departure')) { <p class="field-error">Date obligatoire.</p> }
            </div>

            <fieldset class="rounded-xl border border-[#1E3A5F] bg-[#0C1E3D] p-3">
              <legend class="px-1 text-[11px] font-semibold tracking-wider text-[#94A3B8] uppercase">Modes de vol</legend>
              <label class="field-label" for="sf-m0">Mode au décollage</label>
              <select id="sf-m0" class="field" formControlName="initial">
                @for (m of modes; track m.value) { <option [value]="m.value">{{ m.label }}</option> }
              </select>

              <div class="mt-3 grid grid-cols-[1fr_84px] gap-2">
                <div>
                  <label class="field-label" for="sf-m1">Puis passer en</label>
                  <select id="sf-m1" class="field" formControlName="mode1">
                    @for (m of modes; track m.value) { <option [value]="m.value">{{ m.label }}</option> }
                  </select>
                </div>
                <div>
                  <label class="field-label" for="sf-a1">Après (min)</label>
                  <input id="sf-a1" type="number" min="1" class="field" formControlName="after1" placeholder="—" />
                </div>
                <div>
                  <label class="field-label" for="sf-m2">Puis passer en</label>
                  <select id="sf-m2" class="field" formControlName="mode2">
                    @for (m of modes; track m.value) { <option [value]="m.value">{{ m.label }}</option> }
                  </select>
                </div>
                <div>
                  <label class="field-label" for="sf-a2">Après (min)</label>
                  <input id="sf-a2" type="number" min="1" class="field" formControlName="after2" placeholder="—" />
                </div>
              </div>
              <p class="mt-2 rounded-lg border border-[#1E3A5F] bg-[#112240] px-2.5 py-1.5 text-[11px] text-[#F8FAFC] shadow-sm">{{ planText() }}</p>
              <p class="mt-1 text-[10px] text-[#94A3B8]">Laissez « Après » vide pour ne pas changer de mode. Les délais sont comptés depuis le décollage.</p>
            </fieldset>

            @if (error()) { <p class="field-error" role="alert">{{ error() }}</p> }
            <div class="flex justify-end gap-2 pt-1">
              <button type="button" class="btn-ghost" (click)="close()">Annuler</button>
              <button type="submit" class="btn-pill">{{ ctx.flight ? 'Enregistrer' : 'Programmer' }}</button>
            </div>
          </div>

          <app-perimeter-map [droneId]="droneId()" [(perimeters)]="perimeters" [height]="380" />
        </form>
      </app-modal>
    }
  `,
})
export class ScheduleFormComponent {
  protected readonly ui = inject(UiService);
  protected readonly drones = inject(DroneService);
  private readonly missions = inject(MissionService);
  private readonly flights = inject(FlightService);
  private readonly fb = inject(FormBuilder);
  protected readonly error = signal('');
  protected readonly perimeters = signal<LatLng[][]>([]);
  protected readonly modes = (Object.keys(FLIGHT_MODE) as FlightMode[]).map((value) => ({ value, label: FLIGHT_MODE[value].label }));

  protected readonly form = this.fb.group({
    droneId: this.fb.nonNullable.control('', Validators.required),
    missionId: this.fb.nonNullable.control('', Validators.required),
    departure: this.fb.nonNullable.control('', Validators.required),
    initial: this.fb.nonNullable.control<FlightMode>('manual'),
    mode1: this.fb.nonNullable.control<FlightMode>('semi-auto'),
    after1: this.fb.control<number | null>(null),
    mode2: this.fb.nonNullable.control<FlightMode>('auto'),
    after2: this.fb.control<number | null>(null),
  });
  protected readonly droneId = toSignal(this.form.controls.droneId.valueChanges, { initialValue: '' });
  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  constructor() {
    effect(() => {
      const ctx = this.ui.scheduleForm();
      if (!ctx) return;
      untracked(() => {
        this.error.set('');
        const f = ctx.flight;
        const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
        tomorrow.setMinutes(0, 0, 0);
        const steps = f?.modePlan.steps ?? [];
        this.perimeters.set(f ? f.perimeters.map((p) => p.map((q) => [...q] as LatLng)) : []);
        this.form.reset({
          droneId: f?.droneId ?? this.drones.drones().find((d) => d.status === 'available')?.id ?? this.drones.drones()[0]?.id ?? '',
          missionId: f?.missionId ?? '',
          departure: toLocalInput((f ? new Date(f.departure) : tomorrow).toISOString()),
          initial: f?.modePlan.initial ?? 'manual',
          mode1: steps[0]?.mode ?? 'semi-auto',
          after1: steps[0]?.afterMin ?? null,
          mode2: steps[1]?.mode ?? 'auto',
          after2: steps[1]?.afterMin ?? null,
        });
      });
    });
  }

  protected availableMissions(includeId?: string) {
    return this.missions.available(includeId);
  }

  protected show(c: 'missionId' | 'departure'): boolean {
    const ctl = this.form.controls[c];
    return ctl.invalid && (ctl.touched || ctl.dirty);
  }

  protected planText(): string {
    this.formValue();
    return describeModePlan(this.buildPlan());
  }

  protected close(): void {
    this.ui.scheduleForm.set(null);
  }

  private buildPlan(): ModePlan {
    const v = this.form.getRawValue();
    const steps: ModeStep[] = [];
    if (v.after1 !== null && v.after1 !== undefined && `${v.after1}` !== '') steps.push({ mode: v.mode1, afterMin: Number(v.after1) });
    if (v.after2 !== null && v.after2 !== undefined && `${v.after2}` !== '') steps.push({ mode: v.mode2, afterMin: Number(v.after2) });
    return { initial: v.initial, steps };
  }

  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const value: ScheduledFlightInput = {
      droneId: v.droneId,
      missionId: v.missionId,
      departure: new Date(v.departure).toISOString(),
      modePlan: this.buildPlan(),
      perimeters: this.perimeters(),
    };
    const ctx = this.ui.scheduleForm();
    const res = ctx?.flight ? await this.flights.update(ctx.flight.id, value) : await this.flights.add(value);
    if (res.ok) this.close();
    else this.error.set(res.error ?? 'Opération impossible.');
  }
}
