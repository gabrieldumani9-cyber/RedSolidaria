import { Component, inject, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DatastoreService } from '../services/datastore.service';
import { AuthService } from '../services/auth.service';
import { Solicitud, CATEGORIA_META, ESTADO_META } from '../models/models';

@Component({
  selector: 'app-perfil',
  imports: [DecimalPipe, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-6">
      @if (authSvc.user(); as au) {
        @if (user(); as u) {
          <section class="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
            <div class="flex flex-col sm:flex-row items-center gap-5">
              <div class="relative shrink-0">
                <img [src]="u.avatar" [alt]="u.nombre" class="h-20 w-20 rounded-full bg-primary-100 border-2 border-primary-200" />
                @if (u.verificado) {
                  <span class="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs border-2 border-white" title="Verificado">✓</span>
                }
              </div>
              <div class="text-center sm:text-left flex-1">
                <div class="flex items-center justify-center sm:justify-start gap-2">
                  <h1 class="text-xl font-bold text-slate-900">{{ u.nombre }}</h1>
                  @if (u.verificado) {
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">Verificado</span>
                  }
                </div>
                <p class="text-sm text-slate-500 mb-2">{{ u.email }}</p>
                <div class="flex items-center justify-center sm:justify-start gap-1">
                  @for (s of estrellas(u.estrellas); track s) { <span class="text-amber-400 text-sm">★</span> }
                  <span class="text-sm font-semibold text-slate-700 ml-1">{{ u.estrellas | number:'1.0-1' }}</span>
                  <span class="text-xs text-slate-400 ml-1">({{ u.totalResenas }} reseñas)</span>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
              <div class="text-center">
                <div class="text-2xl font-extrabold text-primary-600">{{ u.puntosConfianza }}</div>
                <div class="text-xs text-slate-500 font-medium">Puntos de confianza</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-extrabold text-emerald-600">{{ u.ayudasRealizadas }}</div>
                <div class="text-xs text-slate-500 font-medium">Ayudas realizadas</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-extrabold text-slate-700">{{ u.solicitudesCreadas }}</div>
                <div class="text-xs text-slate-500 font-medium">Solicitudes creadas</div>
              </div>
            </div>
          </section>

          <section class="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
            <h2 class="font-bold text-slate-900 mb-1">Verificación de identidad</h2>
            <p class="text-xs text-slate-500 mb-4">Aumenta la confianza de la comunidad verificando tus datos.</p>
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200">
                <div class="flex items-center gap-3">
                  <span class="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center text-lg">📱</span>
                  <div><p class="text-sm font-semibold text-slate-900">Verificar Teléfono</p><p class="text-xs text-slate-500">Confirma tu número de contacto.</p></div>
                </div>
                <button (click)="toggleVerificacion('telefono')" [class]="user()!.telefonoVerificado ? 'px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold' : 'px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200'">{{ user()!.telefonoVerificado ? 'Verificado ✓' : 'Verificar' }}</button>
              </div>
              <div class="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200">
                <div class="flex items-center gap-3">
                  <span class="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center text-lg">🪪</span>
                  <div><p class="text-sm font-semibold text-slate-900">Verificar DNI/Cédula</p><p class="text-xs text-slate-500">Verifica tu documento de identidad.</p></div>
                </div>
                <button (click)="toggleVerificacion('dni')" [class]="user()!.dniVerificado ? 'px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold' : 'px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200'">{{ user()!.dniVerificado ? 'Verificado ✓' : 'Verificar' }}</button>
              </div>
            </div>
          </section>

          <section class="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
            <div class="flex items-center justify-between mb-3">
              <h2 class="font-bold text-slate-900">Reputación de la comunidad</h2>
              <span class="text-sm font-bold text-primary-600">{{ u.reputacionPct }}%</span>
            </div>
            <div class="h-3 rounded-full bg-slate-100 overflow-hidden mb-2">
              <div class="h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500" [style.width.%]="u.reputacionPct"></div>
            </div>
            <p class="text-xs text-slate-500">Basado en reseñas de personas a las que has ayudado.</p>
          </section>

          <div class="flex gap-2 mb-4">
            <button (click)="tab.set('medallas')"
              [class]="tab() === 'medallas' ? 'flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary-600 text-white transition' : 'flex-1 py-2.5 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition'">
              🏅 Medallas
            </button>
            <button (click)="tab.set('historial')"
              [class]="tab() === 'historial' ? 'flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary-600 text-white transition' : 'flex-1 py-2.5 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition'">
              📜 Historial de Ayudas
            </button>
            <button (click)="tab.set('resenas')"
              [class]="tab() === 'resenas' ? 'flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary-600 text-white transition' : 'flex-1 py-2.5 rounded-xl text-sm font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition'">
              💬 Reseñas
            </button>
          </div>

          @if (tab() === 'medallas') {
            <section class="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
              <h2 class="font-bold text-slate-900 mb-4">Medallas de logro</h2>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                @for (m of u.medallas; track m.id) {
                  <div [class]="m.obtenida ? 'flex flex-col items-center text-center p-4 rounded-xl bg-amber-50 border border-amber-200' : 'flex flex-col items-center text-center p-4 rounded-xl bg-slate-50 border border-slate-200 opacity-60'">
                    <span class="text-3xl mb-2">{{ m.icono }}</span>
                    <span class="text-sm font-semibold text-slate-900">{{ m.nombre }}</span>
                    <span class="text-xs text-slate-500 mt-1">{{ m.descripcion }}</span>
                    @if (m.obtenida) { <span class="mt-2 text-xs font-semibold text-amber-600">Obtenida ✓</span> }
                    @else { <span class="mt-2 text-xs font-medium text-slate-400">Bloqueada</span> }
                  </div>
                }
              </div>
            </section>

            <section class="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
              <h2 class="font-bold text-slate-900 mb-4">Contador de ayudas</h2>
              <div class="flex items-center gap-1.5 flex-wrap">
                @for (i of contadorVidas(); track i) { <span class="text-2xl">❤</span> }
                @if (contadorVidas().length === 0) { <span class="text-sm text-slate-400">Aún no has registrado ayudas.</span> }
              </div>
              <p class="text-sm text-slate-500 mt-3">Cada corazón representa una ayuda completada. ¡Sigue sumando vidas!</p>
            </section>
          }

          @if (tab() === 'historial') {
            <section class="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
              <h2 class="font-bold text-slate-900 mb-4">Historial de Ayudas</h2>
              @if (historial().length > 0) {
                <div class="space-y-3">
                  @for (s of historial(); track s.id) {
                    <div class="flex gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <span [class]="'inline-flex items-center justify-center h-10 w-10 rounded-xl text-lg shrink-0 ' + metaCat(s.categoria).bg">{{ metaCat(s.categoria).emoji }}</span>
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2">
                          <h3 class="font-semibold text-slate-900 text-sm truncate">{{ s.titulo }}</h3>
                          <span [class]="'px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ' + metaEstado(s.estado).bg + ' ' + metaEstado(s.estado).color">{{ metaEstado(s.estado).label }}</span>
                        </div>
                        <p class="text-xs text-slate-500 line-clamp-1 mt-0.5">{{ s.descripcion }}</p>
                        <div class="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                          <span>📍 {{ s.ubicacion }}</span>
                          <span>👤 {{ s.creadoPorNombre }}</span>
                          @if (s.resueltaFecha) { <span>✅ {{ tiempoRelativo(s.resueltaFecha) }}</span> }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="text-center py-10">
                  <span class="text-4xl block mb-2">📋</span>
                  <p class="text-sm text-slate-400">Aún no has completado ninguna ayuda. ¡Ofrece ayuda a una solicitud activa para empezar!</p>
                </div>
              }
            </section>
          }

          @if (tab() === 'resenas') {
            <section class="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
              <h2 class="font-bold text-slate-900 mb-4">Reseñas de la comunidad</h2>
              <div class="space-y-4">
                @for (r of u.resenas; track r.id) {
                  <div class="flex gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <img [src]="r.autorAvatar" [alt]="r.autorNombre" class="h-10 w-10 rounded-full bg-slate-100 shrink-0" />
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-sm font-semibold text-slate-900">{{ r.autorNombre }}</span>
                        <span class="text-xs text-slate-400">{{ tiempoRelativo(r.fecha) }}</span>
                      </div>
                      <div class="flex items-center gap-0.5 mb-1">
                        @for (s of estrellas(r.estrellas); track s) { <span class="text-amber-400 text-xs">★</span> }
                      </div>
                      <p class="text-sm text-slate-600">{{ r.texto }}</p>
                    </div>
                  </div>
                }
                @if (u.resenas.length === 0) { <p class="text-sm text-slate-400 text-center py-4">Aún no hay reseñas.</p> }
              </div>
            </section>
          }
        }
      } @else {
        <div class="text-center py-20">
          <span class="text-4xl block mb-3">🔒</span>
          <p class="text-sm text-slate-400 mb-4">Inicia sesión para ver tu perfil de voluntario.</p>
          <a routerLink="/login" class="inline-block px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition">Iniciar sesión</a>
        </div>
      }
    </div>
  `,
})
export class PerfilComponent {
  private store = inject(DatastoreService);
  authSvc = inject(AuthService);
  user = this.store.usuario;
  tab = signal<'medallas' | 'historial' | 'resenas'>('medallas');

  historial = computed<Solicitud[]>(() => {
    return this.store.getSolicitudesSnapshot().filter((s) => s.estado === 'resuelta');
  });

  contadorVidas = computed(() => {
    const n = this.user()?.ayudasRealizadas ?? 0;
    return Array.from({ length: n }, (_, i) => i);
  });

  estrellas(n: number): number[] {
    return Array.from({ length: Math.round(n) }, (_, i) => i);
  }

  tiempoRelativo(fecha: number): string {
    const diff = Date.now() - fecha;
    const h = Math.floor(diff / 3600_000);
    if (h < 1) return 'ahora';
    if (h < 24) return `hace ${h}h`;
    const d = Math.floor(h / 24);
    return `hace ${d}d`;
  }

  metaCat = (c: Solicitud['categoria']) => CATEGORIA_META[c];
  metaEstado = (e: Solicitud['estado']) => ESTADO_META[e];

  toggleVerificacion(type: 'telefono' | 'dni') {
    this.store.toggleVerification(type);
  }
}
