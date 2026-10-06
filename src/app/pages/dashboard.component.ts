import { Component, inject, signal, computed } from '@angular/core';
import { DatastoreService } from '../services/datastore.service';
import {
  Solicitud, CATEGORIAS, CATEGORIA_META, URGENCIA_META, ESTADO_META,
  Categoria, Urgencia,
} from '../models/models';
import { CreateSolicitudModalComponent } from '../components/create-solicitud-modal.component';
import { MapComponent } from '../components/map.component';
import { ChatModalComponent } from '../components/chat-modal.component';

@Component({
  selector: 'app-dashboard',
  imports: [CreateSolicitudModalComponent, MapComponent, ChatModalComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Urgency alert banner -->
      @if (urgentesCercanas().length > 0) {
        <div class="mb-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white p-4 flex items-center gap-3 animate-fade-in-up shadow-lg">
          <span class="text-2xl shrink-0">🚨</span>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-sm">Alerta de urgencia</p>
            <p class="text-xs text-red-50 truncate">
              Hay {{ urgentesCercanas().length }} solicitud(es) con urgencia alta cerca de ti.
              @if (urgentesCercanas()[0]; as u) { "{{ u.titulo }}" }
            </p>
          </div>
          <button (click)="seleccionar(urgentesCercanas()[0])" class="shrink-0 px-3 py-1.5 rounded-lg bg-white text-red-600 font-semibold text-xs hover:bg-red-50 transition">Ver</button>
        </div>
      }

      <!-- Header -->
      <section class="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Solicitudes de ayuda
          </h1>
          <p class="text-slate-500 mt-1 text-sm md:text-base">
            {{ filtradas().length }} solicitud(es) · Explora las peticiones de tu comunidad y ofrece una mano.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button (click)="useCurrentLocation()" class="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:border-primary-300 hover:text-primary-700 transition shadow-sm">
            ◎ {{ locating() ? 'Localizando…' : 'Usar mi ubicación actual' }}
          </button>
          <button
          (click)="modalOpen.set(true)"
          class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition shadow-sm"
        >
          <span class="text-base leading-none">+</span> Crear solicitud
          </button>
        </div>
      </section>

      @if (locationError(); as error) {
        <p class="mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-sm">{{ error }}</p>
      }
      <div class="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
        <div><p class="text-sm font-bold text-red-800">Modo SOS</p><p class="text-xs text-red-700">Muestra solo emergencias críticas.</p></div>
        <button (click)="sosOnly.set(!sosOnly())" [class]="sosOnly() ? 'px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold' : 'px-3 py-1.5 rounded-lg bg-white border border-red-200 text-red-700 text-xs font-bold'">{{ sosOnly() ? 'SOS activo' : 'Activar SOS' }}</button>
      </div>

      <div class="grid lg:grid-cols-2 gap-5">
        <!-- LEFT: filters + cards + campaigns -->
        <div class="space-y-4">
          <!-- Filters -->
          <div class="bg-white rounded-2xl border border-slate-200 p-3 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-slate-500 mr-1">Categoría</span>
              <button
                (click)="categoria.set(null)"
                [class]="categoria() === null
                  ? 'px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white'
                  : 'px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'"
              >Todas</button>
              @for (c of categorias; track c) {
                <button
                  (click)="categoria.set(c)"
                  [class]="categoria() === c
                    ? 'px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-600 text-white'
                    : 'px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'"
                >{{ metaCat(c).emoji }} {{ c }}</button>
              }
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-xs font-semibold text-slate-500 mr-1">Urgencia</span>
              <button
                (click)="urgencia.set(null)"
                [class]="urgencia() === null
                  ? 'px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white'
                  : 'px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'"
              >Todas</button>
              @for (u of urgencias; track u) {
                <button
                  (click)="urgencia.set(u)"
                  [class]="urgencia() === u
                    ? 'px-3 py-1.5 rounded-full text-xs font-semibold ' + metaUrg(u).bg + ' ' + metaUrg(u).color + ' border ' + metaUrg(u).border
                    : 'px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'"
                >{{ u }}</button>
              }
            </div>
            <div class="flex flex-wrap items-center gap-2 pt-1">
              <span class="text-xs font-semibold text-slate-500 mr-1">Radio</span>
              @for (r of radios; track r) {
                <button
                  (click)="radio.set(r)"
                  [class]="radio() === r
                    ? 'px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-600 text-white'
                    : 'px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'"
                >{{ r === 0 ? 'Todos' : r + ' km' }}</button>
              }
            </div>
            <div class="flex flex-wrap items-center gap-2 pt-1">
              <span class="text-xs font-semibold text-slate-500 mr-1">Estado</span>
              <button (click)="soloActivas.set(true)"
                [class]="soloActivas() ? 'px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-600 text-white' : 'px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'">Activas</button>
              <button (click)="soloActivas.set(false)"
                [class]="!soloActivas() ? 'px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900 text-white' : 'px-3 py-1.5 rounded-full text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'">Todas</button>
            </div>
          </div>

          <!-- Cards -->
          <div class="space-y-3">
            @for (s of filtradas(); track s.id) {
              <article
                class="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md hover:border-primary-200 transition cursor-pointer animate-fade-in-up"
                (click)="seleccionar(s)"
              >
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div class="flex items-center gap-2">
                    <span [class]="'inline-flex items-center justify-center h-9 w-9 rounded-xl text-base ' + metaCat(s.categoria).bg">
                      {{ metaCat(s.categoria).emoji }}
                    </span>
                    <div>
                      <h3 class="font-bold text-slate-900 leading-tight">{{ s.titulo }}</h3>
                      <span [class]="'text-xs font-medium ' + metaCat(s.categoria).color">{{ s.categoria }}</span>
                    </div>
                  </div>
                  <span [class]="'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ' + metaUrg(s.urgencia).bg + ' ' + metaUrg(s.urgencia).color">
                    <span [class]="'h-1.5 w-1.5 rounded-full ' + metaUrg(s.urgencia).dot"></span>{{ s.urgencia }}
                  </span>
                </div>
                <p class="text-sm text-slate-500 line-clamp-2 mb-2">{{ s.descripcion }}</p>
                <div class="flex items-center justify-between text-xs text-slate-500">
                  <span class="inline-flex items-center gap-1">📍 {{ s.ubicacion }}</span>
                  <span>{{ s.distancia }} · {{ tiempoRelativo(s.fecha) }}</span>
                </div>
                <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div class="flex items-center gap-2">
                    <img [src]="s.creadoPorAvatar" [alt]="s.creadoPorNombre" class="h-5 w-5 rounded-full bg-slate-100" />
                    <span class="text-xs text-slate-600 font-medium">{{ s.creadoPorNombre }}</span>
                    @if (s.creadoPorVerificado) { <span class="px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-bold">Vecino Verificado</span> }
                    <span [class]="'px-2 py-0.5 rounded-full text-xs font-medium ' + metaEstado(s.estado).bg + ' ' + metaEstado(s.estado).color">
                      {{ metaEstado(s.estado).label }}
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <button (click)="$event.stopPropagation(); openChat(s)" class="px-2.5 py-1.5 rounded-lg bg-sky-50 text-sky-700 font-semibold text-xs hover:bg-sky-100 transition">Contactar por Chat</button>
                    <button (click)="$event.stopPropagation(); shareRequest(s)" class="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 transition">Compartir</button>
                    <button
                      (click)="$event.stopPropagation(); pedirEliminar(s)"
                      class="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 font-semibold text-xs hover:bg-red-100 transition"
                      title="Eliminar solicitud"
                    >🗑️ Eliminar</button>
                    <button
                      (click)="$event.stopPropagation(); ofrecerAyuda(s)"
                      [disabled]="s.estado === 'resuelta'"
                      [class]="s.estado === 'resuelta'
                        ? 'px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-xs cursor-default'
                        : s.estado === 'en_proceso'
                          ? 'px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 font-semibold text-xs hover:bg-amber-100 transition'
                          : 'px-3 py-1.5 rounded-lg bg-primary-600 text-white font-semibold text-xs hover:bg-primary-700 transition'"
                    >
                      @if (s.estado === 'resuelta') { ✅ Completada }
                      @else if (s.estado === 'en_proceso') { 🤝 En curso }
                      @else { Ofrecer ayuda }
                    </button>
                  </div>
                </div>
              </article>
            }
            @if (filtradas().length === 0) {
              <div class="text-center py-12 text-slate-400 text-sm">No hay solicitudes que coincidan.</div>
            }
          </div>

        </div>

        <!-- RIGHT: map -->
        <div class="lg:sticky lg:top-20 lg:self-start">
          <div class="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style="height: 70vh; min-height: 500px;">
            <app-map
              [solicitudes]="filtradas()"
              [userLocation]="userLocation()"
              (onMarkerClick)="seleccionar($event)"
            />
          </div>
          <p class="text-xs text-slate-400 mt-2 text-center">Toca un marcador para ver el detalle y ofrecer ayuda.</p>
        </div>
      </div>
    </div>

    <!-- Detail popup -->
    @if (seleccionada(); as s) {
      <div class="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm" (click)="seleccionada.set(null)">
        <div class="bg-white w-full max-w-lg rounded-t-3xl md:rounded-2xl shadow-2xl p-5 animate-slide-up max-h-[85vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="flex justify-center mb-3 md:hidden"><div class="h-1.5 w-10 rounded-full bg-slate-300"></div></div>
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-2">
              <span [class]="'inline-flex items-center justify-center h-10 w-10 rounded-xl text-lg ' + metaCat(s.categoria).bg">{{ metaCat(s.categoria).emoji }}</span>
              <div>
                <h2 class="font-bold text-slate-900 leading-tight">{{ s.titulo }}</h2>
                <span [class]="'text-xs font-medium ' + metaCat(s.categoria).color">{{ s.categoria }}</span>
              </div>
            </div>
            <button (click)="seleccionada.set(null)" class="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
          </div>
          <p class="text-sm text-slate-600 mb-4">{{ s.descripcion }}</p>
          <div class="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div class="flex items-center gap-2 text-slate-600"><span>📍</span> {{ s.ubicacion }}</div>
            <div class="flex items-center gap-2 text-slate-600"><span>📏</span> {{ s.distancia }}</div>
            <div class="flex items-center gap-2 text-slate-600"><span>⏱️</span> {{ tiempoRelativo(s.fecha) }}</div>
            <div class="flex items-center gap-2">
              <span [class]="'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ' + metaUrg(s.urgencia).bg + ' ' + metaUrg(s.urgencia).color">
                <span [class]="'h-1.5 w-1.5 rounded-full ' + metaUrg(s.urgencia).dot"></span> Urgencia {{ s.urgencia }}
              </span>
            </div>
            @if (s.telefono) {
              <div class="flex items-center gap-2 text-slate-600 col-span-2"><span>📞</span> {{ s.telefono }}</div>
            }
          </div>
          <div class="flex items-center gap-2 mb-4">
            <img [src]="s.creadoPorAvatar" [alt]="s.creadoPorNombre" class="h-8 w-8 rounded-full bg-slate-100" />
            <span class="text-sm font-medium text-slate-700">{{ s.creadoPorNombre }}</span>
            <span [class]="'ml-auto px-2 py-0.5 rounded-full text-xs font-medium ' + metaEstado(s.estado).bg + ' ' + metaEstado(s.estado).color">{{ metaEstado(s.estado).label }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button (click)="openChat(s)" class="flex-1 min-w-[150px] py-3 rounded-xl bg-sky-50 text-sky-700 font-semibold text-sm hover:bg-sky-100 transition">Contactar por Chat</button>
            <button (click)="shareRequest(s)" class="px-3 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200 transition">Compartir</button>
            <button
              (click)="pedirEliminar(s)"
              class="px-3 py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition"
            >🗑️ Eliminar</button>
            <button
              (click)="ofrecerAyuda(s)"
              [disabled]="s.estado === 'resuelta'"
              [class]="s.estado === 'resuelta'
                ? 'flex-1 py-3 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm cursor-default'
                : s.estado === 'en_proceso'
                  ? 'flex-1 py-3 rounded-xl bg-amber-50 text-amber-700 font-semibold text-sm hover:bg-amber-100 transition'
                  : 'flex-1 py-3 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition'"
            >
              @if (s.estado === 'resuelta') { ✅ Ayuda completada }
              @else if (s.estado === 'en_proceso') { 🤝 En curso — Marcar resuelta }
              @else { Ofrecer ayuda }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete confirmation modal -->
    @if (aEliminar(); as s) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" (click)="aEliminar.set(null)">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-scale-in" (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3 mb-3">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 text-lg">🗑️</span>
            <h3 class="font-bold text-slate-900">Eliminar solicitud</h3>
          </div>
          <p class="text-sm text-slate-600 mb-5">¿Estás seguro de eliminar esta solicitud? Esta acción no se puede deshacer.</p>
          <div class="flex gap-2">
            <button (click)="aEliminar.set(null)" class="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition">Cancelar</button>
            <button (click)="confirmarEliminar()" class="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition">Eliminar</button>
          </div>
        </div>
      </div>
    }

    <!-- Toast -->
    @if (toast(); as t) {
      <div class="fixed top-20 right-4 z-50 animate-fade-in-up">
        <div class="bg-white border border-primary-200 shadow-lg rounded-xl px-4 py-3 flex items-center gap-2 max-w-sm">
          <span class="text-primary-600 text-lg">✓</span>
          <span class="text-sm font-medium text-slate-700">{{ t }}</span>
        </div>
      </div>
    }

    <app-chat-modal [open]="chatOpen()" [solicitud]="chatRequest()" (close)="chatOpen.set(false)" />

    <app-create-solicitud-modal
      [open]="modalOpen()"
      (close)="modalOpen.set(false)"
      (created)="onCreated($event)"
    />
  `,
})
export class DashboardComponent {
  private store = inject(DatastoreService);

  solicitudes = signal<Solicitud[]>([]);
  modalOpen = signal(false);
  seleccionada = signal<Solicitud | null>(null);
  aEliminar = signal<Solicitud | null>(null);
  toast = signal<string | null>(null);

  categoria = signal<Categoria | null>(null);
  urgencia = signal<Urgencia | null>(null);
  radio = signal<number>(0);
  soloActivas = signal(true);
  sosOnly = signal(false);

  userLocation = signal<{ lat: number; lng: number } | null>(null);
  locating = signal(false);
  locationError = signal<string | null>(null);
  center = signal<{ lat: number; lng: number } | null>(null);

  chatOpen = signal(false);
  chatRequest = signal<Solicitud | null>(null);

  categorias = CATEGORIAS;
  urgencias: Urgencia[] = ['Alta', 'Media', 'Baja'];
  radios = [0, 1, 5, 10];

  private userLat = 40.4168;
  private userLng = -3.7038;

  filtradas = computed(() => {
    return this.solicitudes().filter((s) => {
      const okCat = !this.categoria() || s.categoria === this.categoria();
      const okUrg = !this.urgencia() || s.urgencia === this.urgencia();
      const okActiva = !this.soloActivas() || s.estado !== 'resuelta';
      const okRadio = this.radio() === 0 || this.distanciaKm(s) <= this.radio();
      const okSos = !this.sosOnly() || Boolean(s.esEmergencia) || (s.categoria === 'Emergencias' && s.urgencia === 'Alta');
      return okCat && okUrg && okActiva && okRadio && okSos;
    });
  });

  urgentesCercanas = computed(() => {
    return this.solicitudes().filter(
      (s) => s.urgencia === 'Alta' && s.estado === 'activa',
    );
  });

  constructor() {
    this.store.solicitudes.subscribe((data) => this.solicitudes.set(data));
  }

  seleccionar(s: Solicitud) {
    this.seleccionada.set(s);
  }

  ofrecerAyuda(s: Solicitud) {
    if (s.estado === 'activa') {
      this.store.updateEstado(s.id, 'en_proceso');
      this.solicitudes.set(this.store.getSolicitudesSnapshot());
      this.seleccionada.update((cur) => (cur ? { ...cur, estado: 'en_proceso' } : null));
      this.showToast('¡Ayuda ofrecida! La solicitud pasó a "En proceso".');
    } else if (s.estado === 'en_proceso') {
      this.store.completeRequest(s.id);
      this.solicitudes.set(this.store.getSolicitudesSnapshot());
      this.seleccionada.update((cur) => (cur ? { ...cur, estado: 'resuelta' } : null));
      this.showToast('¡Solicitud resuelta! +50 puntos de confianza.');
    }
  }

  useCurrentLocation() {
    if (!navigator.geolocation) {
      this.locationError.set('Tu navegador no soporta geolocalización.');
      return;
    }
    this.locating.set(true);
    this.locationError.set(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.locating.set(false);
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        this.userLocation.set(loc);
        this.userLat = loc.lat;
        this.userLng = loc.lng;
        this.center.set(loc);
      },
      (err) => {
        this.locating.set(false);
        this.locationError.set('No pudimos obtener tu ubicación: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  openChat(s: Solicitud) {
    this.chatRequest.set(s);
    this.chatOpen.set(true);
  }

  shareRequest(s: Solicitud) {
    const url = `${window.location.origin}/?solicitud=${s.id}`;
    const text = `🤝 RedSolidaria — ${s.titulo}\n\n${s.descripcion}\n\nUbicación: ${s.ubicacion}\nContacto: ${s.telefono || 'No disponible'}\n\nVer: ${url}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  }

  pedirEliminar(s: Solicitud) {
    this.aEliminar.set(s);
  }

  confirmarEliminar() {
    const s = this.aEliminar();
    if (!s) return;
    this.store.deleteRequest(s.id);
    this.solicitudes.set(this.store.getSolicitudesSnapshot());
    this.seleccionada.set(null);
    this.aEliminar.set(null);
    this.showToast('Solicitud eliminada correctamente.');
  }

  onCreated(s: Solicitud) {
    this.solicitudes.set(this.store.getSolicitudesSnapshot());
    this.showToast('Solicitud publicada correctamente.');
  }

  private distanciaKm(s: Solicitud): number {
    const R = 6371;
    const dLat = (s.lat - this.userLat) * Math.PI / 180;
    const dLng = (s.lng - this.userLng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(this.userLat*Math.PI/180) * Math.cos(s.lat*Math.PI/180) * Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(null), 3000);
  }

  tiempoRelativo(fecha: number): string {
    const diff = Date.now() - fecha;
    const h = Math.floor(diff / 3600_000);
    if (h < 1) return 'ahora';
    if (h < 24) return `hace ${h}h`;
    const d = Math.floor(h / 24);
    return `hace ${d}d`;
  }

  metaCat = (c: Categoria) => CATEGORIA_META[c];
  metaUrg = (u: Urgencia) => URGENCIA_META[u];
  metaEstado = (e: Solicitud['estado']) => ESTADO_META[e];
}
