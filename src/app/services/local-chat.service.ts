import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MensajeChat, Solicitud } from '../models/models';

const CHAT_STORAGE_KEY = 'redsolidaria_chats_v1';

type ChatState = Record<string, MensajeChat[]>;

@Injectable({ providedIn: 'root' })
export class LocalChatService {
  private chats = this.loadChats();
  private subjects = new Map<string, BehaviorSubject<MensajeChat[]>>();

  messagesFor(solicitudId: string) {
    let subject = this.subjects.get(solicitudId);
    if (!subject) {
      subject = new BehaviorSubject<MensajeChat[]>(this.chats[solicitudId] ?? []);
      this.subjects.set(solicitudId, subject);
    }
    return subject.asObservable();
  }

  startConversation(request: Solicitud, uid: string, name: string, avatar: string): void {
    const existing = this.chats[request.id] ?? [];
    if (existing.length > 0) return;
    this.addMessage(request.id, {
      id: `msg-${Date.now()}`,
      solicitudId: request.id,
      autorUid: uid,
      autorNombre: name,
      autorAvatar: avatar,
      texto: `¡Hola! Vi tu solicitud sobre "${request.titulo}" y puedo ayudarte. ¿Cómo coordinamos?`,
      fecha: Date.now(),
      esPropio: true,
    });
  }

  addMessage(solicitudId: string, message: MensajeChat): void {
    const messages = [...(this.chats[solicitudId] ?? []), message];
    this.chats = { ...this.chats, [solicitudId]: messages };
    this.subjectFor(solicitudId).next(messages);
    this.persist();
  }

  private subjectFor(solicitudId: string): BehaviorSubject<MensajeChat[]> {
    let subject = this.subjects.get(solicitudId);
    if (!subject) {
      subject = new BehaviorSubject<MensajeChat[]>(this.chats[solicitudId] ?? []);
      this.subjects.set(solicitudId, subject);
    }
    return subject;
  }

  private loadChats(): ChatState {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) return JSON.parse(raw) as ChatState;
    } catch {
      return {};
    }
    return {};
  }

  private persist(): void {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(this.chats));
    } catch {
      // Keep the current conversation available in memory when storage is unavailable.
    }
  }
}
