import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Solicitud, Campana, Usuario, Medalla, Resena } from '../models/models';

const AV = (seed: string) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=dcfce7,bbf7d0,c7d2fe&textColor=14532d`;

const STORAGE_KEY = 'redsolidaria_v2';

const EMPTY_MEDALLAS: Medalla[] = [
  { id: 'm1', nombre: 'Primer paso', descripcion: 'Ofreciste tu primera ayuda', icono: '🌱', obtenida: false },
  { id: 'm2', nombre: 'Manos amigas', descripcion: 'Completaste 5 ayudas', icono: '🤝', obtenida: false },
  { id: 'm3', nombre: 'Corazón de oro', descripcion: 'Completaste 15 ayudas', icono: '💛', obtenida: false },
  { id: 'm4', nombre: 'Pilar de la comunidad', descripcion: 'Completaste 30 ayudas', icono: '🏛️', obtenida: false },
];

function emptyUsuario(): Usuario {
  return {
    uid: '',
    nombre: '',
    email: '',
    avatar: AV('U'),
    verificado: false,
    puntosConfianza: 0,
    reputacionPct: 100,
    estrellas: 0,
    totalResenas: 0,
    medallas: EMPTY_MEDALLAS,
    ayudasRealizadas: 0,
    solicitudesCreadas: 0,
    resenas: [],
  };
}

interface PersistedState {
  solicitudes: Solicitud[];
  usuario: Usuario;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      if (parsed.solicitudes && parsed.usuario) return parsed;
    }
  } catch { /* ignore corrupt storage */ }
  return { solicitudes: [], usuario: emptyUsuario() };
}

@Injectable({ providedIn: 'root' })
export class DatastoreService {
  private state = loadState();

  private solicitudes$ = new BehaviorSubject<Solicitud[]>(this.state.solicitudes);

  readonly usuario = signal<Usuario>(this.state.usuario);

  readonly solicitudes = this.solicitudes$.asObservable();

  getSolicitudesSnapshot(): Solicitud[] {
    return this.solicitudes$.value;
  }

  createSolicitud(data: Omit<Solicitud, 'id' | 'fecha' | 'estado'>): Solicitud {
    const nueva: Solicitud = {
      ...data,
      id: 's-' + Date.now(),
      estado: 'activa',
      fecha: Date.now(),
    };
    const all = [nueva, ...this.solicitudes$.value];
    this.solicitudes$.next(all);
    this.persist();
    return nueva;
  }

  updateEstado(id: string, estado: Solicitud['estado']): void {
    const all = this.solicitudes$.value.map((s) =>
      s.id === id ? { ...s, estado } : s,
    );
    this.solicitudes$.next(all);
    this.persist();
  }

  deleteRequest(id: string): void {
    const all = this.solicitudes$.value.filter((s) => s.id !== id);
    this.solicitudes$.next(all);
    this.persist();
  }

  completeRequest(id: string): void {
    const user = this.usuario();
    const all = this.solicitudes$.value.map((s) =>
      s.id === id
        ? {
            ...s,
            estado: 'resuelta' as const,
            resueltaPor: user.uid,
            resueltaPorNombre: user.nombre,
            resueltaFecha: Date.now(),
          }
        : s,
    );
    this.solicitudes$.next(all);
    this.usuario.update((u) => ({
      ...u,
      ayudasRealizadas: u.ayudasRealizadas + 1,
      puntosConfianza: u.puntosConfianza + 50,
    }));
    this.persist();
  }

  getHistorial(): Solicitud[] {
    return this.solicitudes$.value.filter((s) => s.estado === 'resuelta');
  }

  toggleVerification(type: 'telefono' | 'dni'): void {
    const current = this.usuario();
    const updated: Usuario = type === 'telefono'
      ? { ...current, telefonoVerificado: !current.telefonoVerificado, verificado: !current.telefonoVerificado || Boolean(current.dniVerificado) }
      : { ...current, dniVerificado: !current.dniVerificado, verificado: !current.dniVerificado || Boolean(current.telefonoVerificado) };
    this.usuario.set(updated);
    this.persist();
  }

  registrarAyuda(): void {
    const u = this.usuario();
    const updated: Usuario = {
      ...u,
      ayudasRealizadas: u.ayudasRealizadas + 1,
      puntosConfianza: u.puntosConfianza + 20,
    };
    this.usuario.set(updated);
    this.persist();
  }

  setUsuarioFromAuth(uid: string, nombre: string, email: string): void {
    this.usuario.set({
      ...emptyUsuario(),
      uid,
      nombre,
      email,
      avatar: AV(nombre),
    });
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          solicitudes: this.solicitudes$.value,
          usuario: this.usuario(),
        }),
      );
    } catch { /* storage full or unavailable */ }
  }
}
