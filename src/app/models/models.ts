export type Categoria =
  | 'Movilidad'
  | 'Mascotas'
  | 'Donaciones'
  | 'Emergencias'
  | 'Educación'
  | 'Hogar';

export type Urgencia = 'Alta' | 'Media' | 'Baja';

export type EstadoSolicitud = 'activa' | 'en_proceso' | 'resuelta';

export interface MensajeChat {
  id: string;
  solicitudId: string;
  autorUid: string;
  autorNombre: string;
  autorAvatar: string;
  texto: string;
  fecha: number;
  esPropio: boolean;
}

export interface Verificacion {
  telefonoVerificado: boolean;
  dniVerificado: boolean;
}

export interface Solicitud {
  id: string;
  titulo: string;
  categoria: Categoria;
  descripcion: string;
  ubicacion: string;
  urgencia: Urgencia;
  estado: EstadoSolicitud;
  creadoPor: string;
  creadoPorNombre: string;
  creadoPorAvatar: string;
  creadoPorVerificado?: boolean;
  fecha: number;
  esEmergencia?: boolean;
  distancia?: string;
  telefono?: string;
  lat: number;
  lng: number;
  resueltaPor?: string;
  resueltaPorNombre?: string;
  resueltaFecha?: number;
}

export interface Campana {
  id: string;
  titulo: string;
  descripcion: string;
  metaMonto: number;
  recaudadoMonto: number;
  imagenUrl: string;
  creadorUid: string;
  creadorNombre: string;
  creadorEmail: string;
  paypalEmail: string;
  createdAt: number;
}

export interface Resena {
  id: string;
  autorNombre: string;
  autorAvatar: string;
  estrellas: number;
  texto: string;
  fecha: number;
}

export interface Medalla {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  obtenida: boolean;
}

export interface Usuario {
  uid: string;
  nombre: string;
  email: string;
  avatar: string;
  verificado: boolean;
  telefonoVerificado?: boolean;
  dniVerificado?: boolean;
  puntosConfianza: number;
  reputacionPct: number;
  estrellas: number;
  totalResenas: number;
  medallas: Medalla[];
  ayudasRealizadas: number;
  solicitudesCreadas: number;
  resenas: Resena[];
}

export const CATEGORIAS: Categoria[] = [
  'Movilidad',
  'Mascotas',
  'Donaciones',
  'Emergencias',
  'Educación',
  'Hogar',
];

export const URGENCIAS: Urgencia[] = ['Alta', 'Media', 'Baja'];

export const CATEGORIA_META: Record<
  Categoria,
  { color: string; bg: string; emoji: string; marker: string }
> = {
  Movilidad:   { color: 'text-sky-700',     bg: 'bg-sky-100',     emoji: '🚗', marker: '#0ea5e9' },
  Mascotas:    { color: 'text-amber-700',   bg: 'bg-amber-100',   emoji: '🐾', marker: '#f59e0b' },
  Donaciones:  { color: 'text-emerald-700', bg: 'bg-emerald-100', emoji: '🎁', marker: '#10b981' },
  Emergencias: { color: 'text-red-700',     bg: 'bg-red-100',     emoji: '🚨', marker: '#ef4444' },
  Educación:   { color: 'text-violet-700',  bg: 'bg-violet-100',  emoji: '📚', marker: '#8b5cf6' },
  Hogar:       { color: 'text-rose-700',    bg: 'bg-rose-100',    emoji: '🏠', marker: '#f43f5e' },
};

export const URGENCIA_META: Record<
  Urgencia,
  { color: string; bg: string; border: string; marker: string; dot: string }
> = {
  Alta:  { color: 'text-red-700',     bg: 'bg-red-100',     border: 'border-red-300',     marker: '#ef4444', dot: 'bg-red-500' },
  Media: { color: 'text-amber-700',   bg: 'bg-amber-100',   border: 'border-amber-300',   marker: '#f59e0b', dot: 'bg-amber-500' },
  Baja:  { color: 'text-sky-700',     bg: 'bg-sky-100',     border: 'border-sky-300',     marker: '#0ea5e9', dot: 'bg-sky-500' },
};

export const ESTADO_META: Record<
  EstadoSolicitud,
  { color: string; bg: string; label: string }
> = {
  activa:     { color: 'text-green-700',  bg: 'bg-green-100',  label: 'Activa' },
  en_proceso: { color: 'text-amber-700',  bg: 'bg-amber-100',  label: 'En proceso' },
  resuelta:   { color: 'text-slate-600',  bg: 'bg-slate-100',  label: 'Resuelta' },
};

// ─── Chat & Feed platform models ───────────────────────────

export type MediaType = 'image' | 'video' | 'file';

export interface MediaAttachment {
  url: string;
  type: MediaType;
  name: string;
  size: number;
}

export interface ChatMessage {
  id: string;
  authorUid: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  media?: MediaAttachment;
  timestamp: number;
}

export interface TypingState {
  uid: string;
  name: string;
  isTyping: boolean;
}

export type ReportReason = 'spam' | 'inappropriate' | 'harassment' | 'other';

export interface Post {
  id: string;
  authorUid: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  media?: MediaAttachment;
  timestamp: number;
}

export interface Report {
  id: string;
  postId: string;
  reportedBy: string;
  reason: ReportReason;
  timestamp: number;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Contenido inapropiado' },
  { value: 'harassment', label: 'Acoso' },
  { value: 'other', label: 'Otro' },
];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function avatarUrl(name: string): string {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=dcfce7,bbf7d0,c7d2fe&textColor=14532d`;
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'ahora';
  if (diff < 3600_000) return `hace ${Math.floor(diff / 60_000)}min`;
  if (diff < 86400_000) return `hace ${Math.floor(diff / 3600_000)}h`;
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
}
