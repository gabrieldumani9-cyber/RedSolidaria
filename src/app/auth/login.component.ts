import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <span class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white text-2xl shadow-lg mb-3">🤝</span>
          <h1 class="text-2xl font-extrabold text-slate-900">Red<span class="text-primary-600">Solidaria</span></h1>
          <p class="text-sm text-slate-500 mt-1">Inicia sesión para continuar</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          @if (error()) {
            <div class="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{{ error() }}</div>
          }

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input type="email" formControlName="email" autocomplete="email"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition"
              [class.border-red-300]="invalid('email')" placeholder="tu@email.com" />
            @if (invalid('email')) { <p class="text-xs text-red-500 mt-1">Introduce un email válido.</p> }
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Contraseña</label>
            <input type="password" formControlName="password" autocomplete="current-password"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition"
              [class.border-red-300]="invalid('password')" placeholder="••••••••" />
            @if (invalid('password')) { <p class="text-xs text-red-500 mt-1">La contraseña es obligatoria.</p> }
          </div>

          <button type="submit" [disabled]="loading()"
            class="w-full py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
            @if (loading()) { <span class="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> }
            @else { Iniciar sesión }
          </button>
        </form>

        <p class="text-center text-sm text-slate-500 mt-4">
          ¿No tienes cuenta?
          <a routerLink="/register" class="font-semibold text-primary-600 hover:text-primary-700">Regístrate</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authSvc = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

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
      await this.authSvc.login(this.form.value.email!, this.form.value.password!);
      this.router.navigate(['/']);
    } catch (e: any) {
      this.error.set(this.mapError(e));
    } finally {
      this.loading.set(false);
    }
  }

  private mapError(e: any): string {
    const msg = (e?.message ?? '').toLowerCase();
    if (msg.includes('failed to fetch') || msg.includes('network')) return 'No se pudo conectar con el servicio de acceso. Comprueba la configuración de Supabase.';
    if (msg.includes('invalid login credentials')) return 'Email o contraseña incorrectos.';
    if (msg.includes('email not confirmed')) return 'Confirma tu email antes de iniciar sesión.';
    if (msg.includes('too many requests') || msg.includes('rate limit')) return 'Demasiados intentos. Inténtalo más tarde.';
    return e?.message || 'Email o contraseña incorrectos.';
  }
}
