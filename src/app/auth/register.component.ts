import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <span class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white text-2xl shadow-lg mb-3">🤝</span>
          <h1 class="text-2xl font-extrabold text-slate-900">Crear cuenta</h1>
          <p class="text-sm text-slate-500 mt-1">Únete a la comunidad RedSolidaria</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          @if (error()) {
            <div class="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{{ error() }}</div>
          }

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Nombre completo</label>
            <input type="text" formControlName="name" autocomplete="name"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition"
              [class.border-red-300]="invalid('name')" placeholder="Tu nombre" />
            @if (invalid('name')) { <p class="text-xs text-red-500 mt-1">El nombre es obligatorio.</p> }
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input type="email" formControlName="email" autocomplete="email"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition"
              [class.border-red-300]="invalid('email')" placeholder="tu@email.com" />
            @if (invalid('email')) { <p class="text-xs text-red-500 mt-1">Introduce un email válido.</p> }
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Contraseña</label>
            <input type="password" formControlName="password" autocomplete="new-password"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition"
              [class.border-red-300]="invalid('password')" placeholder="Mínimo 6 caracteres" />
            @if (invalid('password')) { <p class="text-xs text-red-500 mt-1">La contraseña debe tener al menos 6 caracteres.</p> }
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Confirmar contraseña</label>
            <input type="password" formControlName="confirmPassword" autocomplete="new-password"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition"
              [class.border-red-300]="form.hasError('passwordMismatch') && (form.get('confirmPassword')?.dirty || form.get('confirmPassword')?.touched)"
              placeholder="Repite tu contraseña" />
            @if (form.hasError('passwordMismatch') && (form.get('confirmPassword')?.dirty || form.get('confirmPassword')?.touched)) {
              <p class="text-xs text-red-500 mt-1">Las contraseñas no coinciden.</p>
            }
          </div>

          <button type="submit" [disabled]="loading()"
            class="w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
            @if (loading()) { <span class="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> }
            @else { Crear cuenta }
          </button>
        </form>

        <p class="text-center text-sm text-slate-500 mt-4">
          ¿Ya tienes cuenta?
          <a routerLink="/login" class="font-semibold text-primary-600 hover:text-primary-700">Inicia sesión</a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authSvc = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: (g) => (g.get('password')?.value === g.get('confirmPassword')?.value ? null : { passwordMismatch: true }) },
  );

  invalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      const needsConfirmation = await this.authSvc.register(
        this.form.value.name!,
        this.form.value.email!,
        this.form.value.password!,
      );
      if (needsConfirmation) {
        this.error.set('Cuenta creada. Revisa tu email para confirmar la cuenta antes de iniciar sesión.');
        this.form.reset();
      } else {
        await this.router.navigate(['/']);
      }
    } catch (e: any) {
      this.error.set(this.mapError(e));
    } finally {
      this.loading.set(false);
    }
  }

  private mapError(e: any): string {
    const msg = (e?.message ?? '').toLowerCase();
    if (msg.includes('failed to fetch') || msg.includes('network')) return 'No se pudo conectar con el servicio de acceso. Comprueba la configuración de Supabase.';
    if (msg.includes('already registered') || msg.includes('already been registered')) return 'Ya existe una cuenta con ese email.';
    if (msg.includes('password') && (msg.includes('weak') || msg.includes('at least'))) return 'La contraseña es demasiado débil (mínimo 6 caracteres).';
    if (msg.includes('invalid email')) return 'El email no es válido.';
    if (msg.includes('signup is disabled')) return 'El registro está desactivado en Supabase.';
    return e?.message || 'Error al crear la cuenta. Inténtalo de nuevo.';
  }
}
