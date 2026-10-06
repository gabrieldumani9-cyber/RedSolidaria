import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatastoreService } from '../services/datastore.service';
import { LocalChatService } from '../services/local-chat.service';
import { MensajeChat, Solicitud } from '../models/models';

@Component({
  selector: 'app-chat-modal',
  imports: [FormsModule],
  template: `
    @if (open() && solicitud(); as request) {
      <div class="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4 bg-slate-900/50 backdrop-blur-sm" (click)="close.emit()">
        <section class="bg-white w-full max-w-md rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden animate-slide-up" (click)="$event.stopPropagation()">
          <header class="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
            <img [src]="request.creadoPorAvatar" [alt]="request.creadoPorNombre" class="h-10 w-10 rounded-full bg-primary-100" />
            <div class="flex-1 min-w-0">
              <p class="text-xs text-slate-500">Chat con</p>
              <h2 class="font-bold text-slate-900 truncate">{{ request.creadoPorNombre }}</h2>
            </div>
            <button type="button" (click)="close.emit()" class="h-8 w-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 text-xl">×</button>
          </header>

          <div class="px-4 py-3 bg-primary-50 border-b border-primary-100">
            <p class="text-xs text-primary-800 font-semibold truncate">Solicitud: {{ request.titulo }}</p>
          </div>

          <div class="h-72 overflow-y-auto p-4 space-y-3 bg-slate-50" aria-live="polite">
            @if (messages().length === 0) {
              <p class="text-center text-sm text-slate-400 py-10">Inicia una conversación amable y clara.</p>
            }
            @for (message of messages(); track message.id) {
              <div [class]="message.esPropio ? 'flex justify-end' : 'flex justify-start'">
                <div [class]="message.esPropio ? 'max-w-[85%] rounded-2xl rounded-br-md bg-primary-600 text-white px-3 py-2' : 'max-w-[85%] rounded-2xl rounded-bl-md bg-white border border-slate-200 text-slate-700 px-3 py-2'">
                  <p class="text-sm whitespace-pre-wrap break-words">{{ message.texto }}</p>
                  <p [class]="message.esPropio ? 'text-[10px] text-primary-100 mt-1 text-right' : 'text-[10px] text-slate-400 mt-1'">{{ formatTime(message.fecha) }}</p>
                </div>
              </div>
            }
          </div>

          <div class="flex gap-2 px-4 pt-3 overflow-x-auto">
            <button type="button" (click)="useQuickAction('Compartir número')" class="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200">Compartir número</button>
            <button type="button" (click)="useQuickAction('Coordinar hora')" class="shrink-0 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200">Coordinar hora</button>
          </div>
          <form class="flex gap-2 p-4" (ngSubmit)="send()">
            <input [(ngModel)]="draft" name="message" autocomplete="off" placeholder="Escribe un mensaje…" class="min-w-0 flex-1 px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400" />
            <button type="submit" [disabled]="!draft.trim()" class="px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-40">Enviar</button>
          </form>
        </section>
      </div>
    }
  `,
})
export class ChatModalComponent {
  open = input(false);
  solicitud = input<Solicitud | null>(null);
  close = output<void>();

  private store = inject(DatastoreService);
  private chat = inject(LocalChatService);

  messages = signal<MensajeChat[]>([]);
  draft = '';
  private currentRequestId: string | null = null;
  private subscription?: { unsubscribe: () => void };

  constructor() {
    effect(() => {
      const request = this.solicitud();
      if (!request || request.id === this.currentRequestId) return;
      this.currentRequestId = request.id;
      this.subscription?.unsubscribe();
      this.chat.startConversation(request, this.store.usuario().uid, this.store.usuario().nombre, this.store.usuario().avatar);
      this.subscription = this.chat.messagesFor(request.id).subscribe((messages) => this.messages.set(messages));
    });
  }

  send(): void {
    const request = this.solicitud();
    const text = this.draft.trim();
    if (!request || !text) return;
    const user = this.store.usuario();
    this.chat.addMessage(request.id, {
      id: `msg-${Date.now()}`,
      solicitudId: request.id,
      autorUid: user.uid,
      autorNombre: user.nombre,
      autorAvatar: user.avatar,
      texto: text,
      fecha: Date.now(),
      esPropio: true,
    });
    this.draft = '';
  }

  useQuickAction(action: string): void {
    this.draft = action === 'Compartir número'
      ? 'Puedo compartir mi número para coordinar con más facilidad.'
      : '¿Qué hora te viene mejor para coordinar la ayuda?';
  }

  formatTime(timestamp: number): string {
    return new Intl.DateTimeFormat('es', { hour: '2-digit', minute: '2-digit' }).format(timestamp);
  }
}
