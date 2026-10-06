import { Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatastoreService } from '../services/datastore.service';
import { GeocodingService, GeocodeResult } from '../services/geocoding.service';
import { CATEGORIAS, CATEGORIA_META, URGENCIAS, URGENCIA_META, Solicitud, Categoria, Urgencia } from '../models/models';
import { MapComponent } from './map.component';

@Component({
  selector: 'app-create-solicitud-modal',
  imports: [ReactiveFormsModule, MapComponent],
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" (click)="close.emit()">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[92vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
            <button (click)="close.emit()" class="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition text-lg leading-none">←</button>
            <h2 class="font-bold text-slate-900 text-lg">Crear Solicitud de Ayuda</h2>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="px-5 pb-5 pt-4 space-y-4">
            <!-- Titulo -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Título</label>
              <input formControlName="titulo" type="text" placeholder="Ej: Necesito ayuda con compras"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition text-sm" />
            </div>

            <!-- Descripción -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Descripción</label>
              <textarea formControlName="descripcion" rows="3" placeholder="Detalla lo que necesitas…"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition text-sm resize-none"></textarea>
            </div>

            <!-- Categoría grid -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Categoría</label>
              <div class="grid grid-cols-3 gap-2">
                @for (c of categorias; track c) {
                  <button type="button" (click)="form.patchValue({ categoria: c })"
                    [class]="form.value.categoria === c
                      ? 'flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 border-primary-500 bg-primary-50 text-primary-700 transition'
                      : 'flex flex-col items-center gap-1 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition'">
                    <span class="text-xl">{{ metaCat(c).emoji }}</span>
                    <span class="text-xs font-medium">{{ c }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Urgencia -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Nivel de urgencia</label>
              <div class="grid grid-cols-3 gap-2">
                @for (u of urgencias; track u) {
                  <button type="button" (click)="form.patchValue({ urgencia: u })"
                    [class]="form.value.urgencia === u
                      ? 'py-2.5 rounded-xl border-2 text-sm font-semibold transition ' + metaUrg(u).border + ' ' + metaUrg(u).bg + ' ' + metaUrg(u).color
                      : 'py-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 text-sm font-medium transition'">
                    {{ u }}
                  </button>
                }
              </div>
            </div>

            <!-- Teléfono -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Teléfono de contacto</label>
              <input formControlName="telefono" type="tel" placeholder="+34 600 000 000"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition text-sm" />
            </div>

            <!-- Location search -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Ubicación</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">📍</span>
                <input #searchInput type="text" [value]="ubicacionTexto()" (input)="onSearchInput($event)" (keydown.enter)="$event.preventDefault(); buscar()"
                  placeholder="Busca una dirección o pulsa en el mapa"
                  class="w-full pl-9 pr-20 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition text-sm" />
                <button type="button" (click)="buscar()" [disabled]="buscando()"
                  class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition disabled:opacity-50">
                  {{ buscando() ? '…' : 'Buscar' }}
                </button>
              </div>

              <!-- Search results -->
              @if (resultados().length > 0) {
                <div class="mt-2 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  @for (r of resultados(); track r.displayName) {
                    <button type="button" (click)="elegirResultado(r)"
                      class="w-full text-left px-3 py-2.5 hover:bg-primary-50 transition text-sm text-slate-700 flex items-start gap-2">
                      <span class="text-slate-400 mt-0.5">📍</span>
                      <span class="line-clamp-2">{{ r.displayName }}</span>
                    </button>
                  }
                </div>
              }
              @if (geoError()) {
                <p class="text-xs text-red-600 mt-1">{{ geoError() }}</p>
              }
            </div>

            <!-- Mini map -->
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1.5">Selecciona en el mapa</label>
              <div class="relative rounded-xl overflow-hidden border border-slate-200" style="height: 220px;">
                <app-map
                  [solicitudes]="[]"
                  [selectable]="true"
                  [selectedLocation]="puntoSeleccionado()"
                  (onMapClick)="onMapClick($event)"
                />
              </div>
              @if (puntoSeleccionado()) {
                <p class="text-xs text-slate-500 mt-1">
                  📍 {{ puntoSeleccionado()!.lat.toFixed(5) }}, {{ puntoSeleccionado()!.lng.toFixed(5) }}
                </p>
              } @else {
                <p class="text-xs text-slate-400 mt-1">Toca el mapa para colocar el pin.</p>
              }
            </div>

            @if (error()) {
              <p class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ error() }}</p>
            }

            <button type="submit" [disabled]="loading()"
              class="w-full py-3.5 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition disabled:opacity-60 shadow-sm">
              {{ loading() ? 'Publicando…' : 'Publicar Solicitud' }}
            </button>
          </form>
        </div>
      </div>
    }
  `,
})
export class CreateSolicitudModalComponent {
  open = input.required<boolean>();
  close = output<void>();
  created = output<Solicitud>();

  private store = inject(DatastoreService);
  private geo = inject(GeocodingService);
  private fbForm = inject(FormBuilder);

  loading = signal(false);
  error = signal<string | null>(null);
  buscando = signal(false);
  geoError = signal<string | null>(null);
  resultados = signal<GeocodeResult[]>([]);
  ubicacionTexto = signal('');
  puntoSeleccionado = signal<{ lat: number; lng: number } | null>(null);

  categorias = CATEGORIAS;
  urgencias = URGENCIAS;
  metaCat = (c: Categoria) => CATEGORIA_META[c];
  metaUrg = (u: Urgencia) => URGENCIA_META[u];

  form = this.fbForm.nonNullable.group({
    titulo:      ['', [Validators.required, Validators.minLength(5)]],
    categoria:   ['Movilidad' as Categoria, [Validators.required]],
    descripcion: ['', [Validators.required, Validators.minLength(10)]],
    ubicacion:   ['', [Validators.required]],
    urgencia:    ['Media' as Urgencia, [Validators.required]],
    telefono:    [''],
  });

  onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.ubicacionTexto.set(value);
    this.resultados.set([]);
    this.geoError.set(null);
  }

  buscar() {
    const q = this.ubicacionTexto().trim();
    if (q.length < 3) return;
    this.buscando.set(true);
    this.geoError.set(null);
    this.geo.search(q).subscribe({
      next: (res) => {
        this.buscando.set(false);
        this.resultados.set(res);
        if (res.length === 0) this.geoError.set('No se encontraron resultados.');
      },
      error: () => {
        this.buscando.set(false);
        this.geoError.set('Error al buscar la dirección. Inténtalo de nuevo.');
      },
    });
  }

  elegirResultado(r: GeocodeResult) {
    this.puntoSeleccionado.set({ lat: r.lat, lng: r.lng });
    this.ubicacionTexto.set(r.displayName);
    this.form.patchValue({ ubicacion: r.displayName });
    this.resultados.set([]);
  }

  onMapClick(loc: { lat: number; lng: number }) {
    this.puntoSeleccionado.set(loc);
    this.geo.reverse(loc.lat, loc.lng).subscribe({
      next: (rev) => {
        const name = rev.displayName || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
        this.ubicacionTexto.set(name);
        this.form.patchValue({ ubicacion: name });
      },
      error: () => {
        const name = `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
        this.ubicacionTexto.set(name);
        this.form.patchValue({ ubicacion: name });
      },
    });
  }

  submit() {
    if (this.form.invalid) {
      this.error.set('Completa todos los campos obligatorios.');
      return;
    }
    if (!this.puntoSeleccionado()) {
      this.error.set('Selecciona una ubicación en el mapa o búscala arriba.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const user = this.store.usuario();
    const v = this.form.getRawValue();
    const loc = this.puntoSeleccionado()!;

    this.store.createSolicitud({
      titulo:          v.titulo,
      categoria:      v.categoria,
      descripcion:    v.descripcion,
      ubicacion:       v.ubicacion,
      urgencia:        v.urgencia,
      telefono:        v.telefono,
      creadoPor:       user.uid,
      creadoPorNombre: user.nombre,
      creadoPorAvatar: user.avatar,
      lat:             loc.lat,
      lng:             loc.lng,
      distancia:       '—',
    });

    this.loading.set(false);
    this.created.emit({} as Solicitud);
    this.resetForm();
    this.close.emit();
  }

  private resetForm() {
    this.form.reset({ categoria: 'Movilidad', urgencia: 'Media', telefono: '' });
    this.puntoSeleccionado.set(null);
    this.ubicacionTexto.set('');
    this.resultados.set([]);
    this.error.set(null);
    this.geoError.set(null);
  }
}
