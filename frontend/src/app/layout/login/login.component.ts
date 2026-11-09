import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, DEMO_ACCOUNTS } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0A192F] p-4 text-[#F8FAFC]">
      <div class="relative w-full max-w-sm rounded-[12px] border border-[#1E3A5F] bg-[#112240] p-6 shadow-2xl">
        <div class="mb-5 flex flex-col items-center text-center">
          <span class="mb-3 flex size-12 items-center justify-center rounded-xl border border-[#1E3A5F] bg-[#0C1E3D] text-[#38BDF8] shadow-sm"><app-icon name="drone" [size]="24" /></span>
          <h1 class="text-base font-bold tracking-wider text-[#F8FAFC]">FABLAB_DRONE</h1>
          <p class="text-xs text-[#94A3B8]">Supervision Intelligente de Drones</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-3" novalidate>
          <div>
            <label class="field-label" for="lg-email">Adresse e-mail</label>
            <input id="lg-email" type="email" autocomplete="username" class="field" formControlName="email" placeholder="admin@fablab.ci" />
            @if (show('email')) { <p class="field-error">Adresse e-mail valide requise.</p> }
          </div>
          <div>
            <label class="field-label" for="lg-pw">Mot de passe</label>
            <input id="lg-pw" type="password" autocomplete="current-password" class="field" formControlName="password" />
            @if (show('password')) { <p class="field-error">Mot de passe requis.</p> }
          </div>
          @if (error()) { <p class="field-error" role="alert">{{ error() }}</p> }
          <button type="submit" class="btn-pill w-full !py-2.5 !text-xs cursor-pointer" [disabled]="auth.loading()">
            {{ auth.loading() ? 'Connexion…' : 'Se connecter' }}
          </button>
        </form>

        <div class="mt-5 rounded-lg border border-[#1E3A5F] bg-[#0C1E3D] p-3 text-[11px] text-[#94A3B8]">
          <div class="mb-1.5 font-semibold text-[#F8FAFC]">Comptes de démonstration</div>
          @for (a of accounts; track a.email) {
            <button type="button" class="flex w-full items-center justify-between rounded px-2 py-1 text-left hover:bg-[#172A4D] transition-colors cursor-pointer" (click)="fill(a.email, a.password)">
              <span class="font-medium text-[#F8FAFC]">{{ a.role }}</span><span class="text-[#94A3B8]">{{ a.email }}</span>
            </button>
          }
          <div class="mt-1 px-2 text-[10px]">Mot de passe : <span class="font-semibold text-[#F8FAFC]">demo1234</span></div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly accounts = DEMO_ACCOUNTS;
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.group({
    email: ['admin@dispd.demo', [Validators.required, Validators.email]],
    password: ['demo1234', [Validators.required]],
  });

  protected show(f: 'email' | 'password'): boolean {
    const c = this.form.get(f);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  protected fill(e: string, p: string): void {
    this.form.patchValue({ email: e, password: p });
    this.error.set(null);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.error.set(null);
    const ok = this.auth.login(email ?? '', password ?? '');
    if (!ok) this.error.set('Identifiants invalides (utilisez un des comptes ci-dessous).');
  }
}
