import { Component, inject, signal, ElementRef, ViewChild, OnDestroy, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ChatService } from '../services/chat.service';
import { ChatMessage, MediaAttachment, formatTime } from '../models/models';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3.5rem)] max-w-3xl mx-auto">
      <!-- Chat header -->
      <div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200">
        <div class="h-10 w-10 rounded-xl bg-primary-100 flex items-center justify-center text-xl">💬</div>
        <div>
          <h2 class="font-bold text-slate-900 text-sm">Chat comunitario</h2>
          <p class="text-xs text-slate-500">
            @if (typing(); as t) { <span class="text-primary-600">{{ t.name }} está escribiendo…</span> }
            @else { {{ messages().length }} mensajes }
          </p>
        </div>
      </div>

      <!-- Messages -->
      <div #scrollRef class="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
        @if (loading()) {
          <div class="flex items-center justify-center py-10">
            <span class="inline-block h-6 w-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></span>
          </div>
        }
        @if (!loading() && messages().length === 0) {
          <div class="text-center py-16">
            <span class="text-4xl block mb-2">💬</span>
            <p class="text-sm text-slate-400">No hay mensajes aún. ¡Sé el primero en escribir!</p>
          </div>
        }
        @for (m of messages(); track m.id) {
          <div [class]="isOwn(m) ? 'flex justify-end' : 'flex justify-start'">
            <div [class]="isOwn(m) ? 'max-w-[80%]' : 'max-w-[80%]'">
              @if (!isOwn(m)) {
                <div class="flex items-center gap-2 mb-1">
                  <img [src]="m.authorAvatar" [alt]="m.authorName" class="h-6 w-6 rounded-full bg-slate-200" />
                  <span class="text-xs font-semibold text-slate-700">{{ m.authorName }}</span>
                </div>
              }
              <div [class]="isOwn(m)
                ? 'px-4 py-2.5 rounded-2xl rounded-br-md bg-primary-600 text-white text-sm'
                : 'px-4 py-2.5 rounded-2xl rounded-bl-md bg-white border border-slate-200 text-slate-800 text-sm'">
                @if (m.text) { <p class="whitespace-pre-wrap break-words">{{ m.text }}</p> }
                @if (m.media) {
                  @if (m.media.type === 'image') {
                    <img [src]="m.media.url" [alt]="m.media.name" class="mt-2 rounded-xl max-w-full max-h-60 object-cover" loading="lazy" />
                  } @else if (m.media.type === 'video') {
                    <video [src]="m.media.url" controls class="mt-2 rounded-xl max-w-full max-h-60"></video>
                  } @else {
                    <a [href]="m.media.url" target="_blank" class="mt-2 flex items-center gap-2 text-xs underline">
                      📎 {{ m.media.name }}
                    </a>
                  }
                }
              </div>
              <p [class]="isOwn(m) ? 'text-[10px] text-slate-400 mt-1 text-right' : 'text-[10px] text-slate-400 mt-1'">{{ formatTime(m.timestamp) }}</p>
            </div>
          </div>
        }
      </div>

      <!-- Input bar -->
      <div class="px-4 py-3 bg-white border-t border-slate-200">
        @if (previewUrl()) {
          <div class="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
            @if (previewType() === 'image') {
              <img [src]="previewUrl()" class="h-12 w-12 rounded-lg object-cover" />
            } @else {
              <span class="text-xl">📎</span>
            }
            <span class="text-xs text-slate-600 flex-1 truncate">{{ selectedFile()?.name }}</span>
            <button (click)="clearPreview()" class="text-slate-400 hover:text-red-500 text-sm">✕</button>
          </div>
        }
        <div class="flex items-center gap-2">
          <label class="cursor-pointer flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition shrink-0">
            <span class="text-lg">📎</span>
            <input type="file" class="hidden" (change)="onFileSelected($event)" accept="image/*,video/*,.pdf,.doc,.docx,.txt" />
          </label>
          <input
            type="text"
            [(ngModel)]="text"
            (ngModelChange)="onTyping()"
            (blur)="stopTyping()"
            placeholder="Escribe un mensaje…"
            class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition"
            (keydown.enter)="send()"
          />
          <button (click)="send()" [disabled]="sending()"
            class="h-10 w-10 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition disabled:opacity-50 shrink-0">
            @if (sending()) {
              <span class="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            } @else {
              <span class="text-lg">➤</span>
            }
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ChatComponent implements OnDestroy, AfterViewChecked {
  private authSvc = inject(AuthService);
  private chatSvc = inject(ChatService);

  @ViewChild('scrollRef') scrollRef?: ElementRef<HTMLDivElement>;

  messages = this.chatSvc.messages;
  typing = this.chatSvc.typing;
  loading = this.chatSvc.loading;

  text = '';
  sending = signal(false);
  selectedFile = signal<File | null>(null);
  previewUrl = signal('');
  previewType = signal<'image' | 'video' | 'file'>('file');
  private shouldScroll = false;

  constructor() {
    this.chatSvc.subscribeToMessages();
    this.chatSvc.subscribeToTyping();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.scrollRef) {
      const el = this.scrollRef.nativeElement;
      el.scrollTop = el.scrollHeight;
      this.shouldScroll = false;
    }
  }

  isOwn(m: ChatMessage): boolean {
    return m.authorUid === this.authSvc.user()?.uid;
  }

  formatTime = formatTime;

  onTyping(): void {
    const u = this.authSvc.user();
    if (u && this.text.trim()) {
      this.chatSvc.setTyping(u.uid, u.displayName, true);
    }
  }

  stopTyping(): void {
    const u = this.authSvc.user();
    if (u) this.chatSvc.setTyping(u.uid, u.displayName, false);
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedFile.set(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => this.previewUrl.set(reader.result as string);
      reader.readAsDataURL(file);
      this.previewType.set('image');
    } else if (file.type.startsWith('video/')) {
      this.previewType.set('video');
      this.previewUrl.set('');
    } else {
      this.previewType.set('file');
      this.previewUrl.set('');
    }
  }

  clearPreview(): void {
    this.selectedFile.set(null);
    this.previewUrl.set('');
  }

  async send(): Promise<void> {
    const u = this.authSvc.user();
    if (!u) return;
    if (!this.text.trim() && !this.selectedFile()) return;
    this.sending.set(true);
    try {
      let media: MediaAttachment | undefined;
      const file = this.selectedFile();
      if (file) {
        media = await this.chatSvc.uploadFile(file);
      }
      await this.chatSvc.sendMessage(u.uid, u.displayName, u.photoURL, this.text.trim(), media);
      this.text = '';
      this.clearPreview();
      this.shouldScroll = true;
    } catch {
      // ignore
    } finally {
      this.sending.set(false);
    }
  }

  ngOnDestroy(): void {
    this.chatSvc.unsubscribe();
  }
}
