import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CampaignService } from '../services/campaign.service';
import { AuthService } from '../services/auth.service';
import { Campana } from '../models/models';

@Component({
  selector: 'app-campanas',
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-6">
      <section class="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Campañas de financiación</h1>
          <p class="text-slate-500 mt-1 text-sm md:text-base max-w-2xl">
            Crea tu propia campaña o apoya a otros con una donación directa vía PayPal.
          </p>
        </div>
        @if (authSvc.user(); as u) {
          <button (click)="openCreate()"
            class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition shadow-sm">
            <span class="text-base leading-none">+</span> Crear campaña
          </button>
        } @else {
          <a routerLink="/login" class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition shadow-sm">
            Inicia sesión para crear
          </a>
        }
      </section>

      @if (loading()) {
        <div class="flex items-center justify-center py-16">
          <span class="inline-block h-8 w-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></span>
        </div>
      }

      @if (!loading() && campaigns().length === 0) {
        <div class="text-center py-16">
          <span class="text-4xl block mb-2">🎁</span>
          <p class="text-sm text-slate-400">Aún no hay campañas. ¡Crea la primera!</p>
        </div>
      }

      <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        @for (c of campaigns(); track c.id) {
          <article class="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-primary-200 transition flex flex-col animate-fade-in-up">
            <div class="h-40 bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
              @if (c.imagenUrl) {
                <img [src]="c.imagenUrl" [alt]="c.titulo" class="w-full h-full object-cover" loading="lazy" />
              } @else {
                <span class="text-4xl">🎁</span>
              }
            </div>
            <div class="p-5 flex flex-col flex-1">
              <h3 class="font-bold text-slate-900 mb-1">{{ c.titulo }}</h3>
              <p class="text-sm text-slate-500 line-clamp-2 mb-3 flex-1">{{ c.descripcion }}</p>

              <div class="mb-2 flex items-center justify-between text-sm">
                <span class="font-bold text-primary-700">{{ c.recaudadoMonto | number:'1.0-0' }}€</span>
                <span class="text-slate-400">meta {{ c.metaMonto | number:'1.0-0' }}€</span>
              </div>
              <div class="h-2.5 rounded-full bg-slate-100 overflow-hidden mb-3">
                <div class="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500" [style.width.%]="porcentaje(c)"></div>
              </div>

              <div class="text-xs text-slate-500 mb-3 space-y-0.5">
                <p class="flex items-center gap-1.5"><span>👤</span> Creado por <strong class="text-slate-700">{{ c.creadorNombre }}</strong></p>
                <p class="flex items-center gap-1.5"><span>✉️</span> {{ c.creadorEmail }}</p>
              </div>

              <button (click)="donatePayPal(c)"
                class="w-full py-2.5 rounded-xl bg-[#0070ba] text-white font-bold text-sm hover:bg-[#005ea6] transition flex items-center justify-center gap-2 mb-2">
                <span class="text-base">💳</span> Donar vía PayPal
              </button>

              <div class="flex gap-2">
                <button (click)="copyLink(c)"
                  class="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition">📋 Copiar enlace</button>
                <button (click)="shareWhatsApp(c)"
                  class="flex-1 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition">💬 WhatsApp</button>
              </div>

              @if (porcentaje(c) >= 100) {
                <p class="text-center text-sm font-semibold text-emerald-600 mt-3">¡Meta alcanzada! 🎉</p>
              }
            </div>
          </article>
        }
      </div>

      @if (toast(); as t) {
        <div class="fixed top-20 right-4 z-50 animate-fade-in-up">
          <div class="bg-white border border-primary-200 shadow-lg rounded-xl px-4 py-3 flex items-center gap-2 max-w-sm">
            <span class="text-primary-600 text-lg">✓</span>
            <span class="text-sm font-medium text-slate-700">{{ t }}</span>
          </div>
        </div>
      }
    </div>

    <!-- Create campaign modal -->
    @if (createOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" (click)="closeCreate()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-scale-in max-h-[85vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-bold text-slate-900 text-lg">Crear campaña</h3>
            <button (click)="closeCreate()" class="text-slate-400 hover:text-slate-600 text-xl">✕</button>
          </div>

          @if (createError()) {
            <div class="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 mb-4">{{ createError() }}</div>
          }

          <form [formGroup]="form" (ngSubmit)="submitCreate()" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Título</label>
              <input type="text" formControlName="titulo"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition"
                placeholder="Ej: Ayuda para operación de mi gato" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Descripción detallada</label>
              <textarea formControlName="descripcion" rows="3"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition resize-none"
                placeholder="Explica tu campaña, por qué necesitas los fondos y cómo se usarán..."></textarea>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Meta (€)</label>
              <input type="number" formControlName="metaMonto" min="1"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition"
                placeholder="500" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Tu email de PayPal</label>
              <input type="email" formControlName="paypalEmail"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition"
                placeholder="tu@email.com" />
              <p class="text-xs text-slate-400 mt-1">Los donantes serán redirigidos a tu PayPal.</p>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">URL de imagen (opcional)</label>
              <input type="url" formControlName="imagenUrl"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition"
                placeholder="https://..." />
            </div>
            <div class="flex gap-2 pt-2">
              <button type="button" (click)="closeCreate()" class="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition">Cancelar</button>
              <button type="submit" [disabled]="creating()"
                class="flex-1 py-2.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition disabled:opacity-50">
                @if (creating()) { <span class="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> }
                @else { Publicar campaña }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class CampanasComponent implements OnDestroy {
  private campaignSvc = inject(CampaignService);
  authSvc = inject(AuthService);
  private fb = inject(FormBuilder);

  campaigns = this.campaignSvc.campaigns;
  loading = this.campaignSvc.loading;

  createOpen = signal(false);
  creating = signal(false);
  createError = signal('');
  toast = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.minLength(3)]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    metaMonto: [0, [Validators.required, Validators.min(1)]],
    paypalEmail: ['', [Validators.required, Validators.email]],
    imagenUrl: [''],
  });

  constructor() {
    this.campaignSvc.subscribe();
  }

  ngOnDestroy(): void {
    this.campaignSvc.unsubscribe();
  }

  porcentaje(c: Campana): number {
    if (c.metaMonto <= 0) return 0;
    return Math.min(100, Math.round((c.recaudadoMonto / c.metaMonto) * 100));
  }

  donatePayPal(c: Campana): void {
    const url = `https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=${encodeURIComponent(c.paypalEmail)}`;
    window.open(url, '_blank');
  }

  copyLink(c: Campana): void {
    const url = `${window.location.origin}/campanas`;
    navigator.clipboard.writeText(url).then(() => this.showToast('Enlace copiado al portapapeles.'));
  }

  shareWhatsApp(c: Campana): void {
    const url = `${window.location.origin}/campanas`;
    const text = `🎁 Apoya la campaña "${c.titulo}" — ${c.descripcion}\n\nDonar: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  openCreate(): void {
    this.createOpen.set(true);
    const u = this.authSvc.user();
    if (u) {
      this.form.patchValue({ paypalEmail: u.email });
    }
  }

  closeCreate(): void {
    this.createOpen.set(false);
    this.form.reset();
    this.createError.set('');
  }

  async submitCreate(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const u = this.authSvc.user();
    if (!u) {
      this.createError.set('Debes iniciar sesión para crear una campaña.');
      return;
    }
    this.creating.set(true);
    this.createError.set('');
    try {
      await this.campaignSvc.create({
        titulo: this.form.value.titulo!,
        descripcion: this.form.value.descripcion!,
        metaMonto: Number(this.form.value.metaMonto),
        recaudadoMonto: 0,
        imagenUrl: this.form.value.imagenUrl || '',
        creadorUid: u.uid,
        creadorNombre: u.displayName,
        creadorEmail: u.email,
        paypalEmail: this.form.value.paypalEmail!,
      });
      this.closeCreate();
      this.showToast('Campaña publicada correctamente.');
    } catch {
      this.createError.set('Error al crear la campaña. Inténtalo de nuevo.');
    } finally {
      this.creating.set(false);
    }
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 3000);
  }
}
