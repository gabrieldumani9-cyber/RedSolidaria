import { Injectable, signal } from '@angular/core';
import { supabase } from '../../environments/supabase.config';
import { ChatMessage, MediaAttachment, TypingState } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private messagesSignal = signal<ChatMessage[]>([]);
  private typingSignal = signal<TypingState | null>(null);
  private loadingSignal = signal(false);
  private msgChannel: ReturnType<typeof supabase.channel> | null = null;
  private typingChannel: ReturnType<typeof supabase.channel> | null = null;

  readonly messages = this.messagesSignal.asReadonly();
  readonly typing = this.typingSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  subscribeToMessages(): void {
    this.loadingSignal.set(true);
    this.fetchMessages();

    this.msgChannel = supabase
      .channel('chat-messages-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
        this.fetchMessages();
      })
      .subscribe();
  }

  private async fetchMessages(): Promise<void> {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) {
      this.loadingSignal.set(false);
      return;
    }

    const msgs: ChatMessage[] = (data ?? []).map((r: any) => ({
      id: r.id,
      authorUid: r.author_uid,
      authorName: r.author_name,
      authorAvatar: r.author_avatar,
      text: r.text ?? '',
      media: r.media ?? undefined,
      timestamp: new Date(r.created_at).getTime(),
    }));

    this.messagesSignal.set(msgs);
    this.loadingSignal.set(false);
  }

  subscribeToTyping(): void {
    this.fetchTyping();

    this.typingChannel = supabase
      .channel('chat-typing-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_typing' }, () => {
        this.fetchTyping();
      })
      .subscribe();
  }

  private async fetchTyping(): Promise<void> {
    const { data } = await supabase
      .from('chat_typing')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (data) {
      this.typingSignal.set({
        uid: data.uid,
        name: data.name,
        isTyping: data.is_typing ?? false,
      });
    } else {
      this.typingSignal.set(null);
    }
  }

  async setTyping(uid: string, name: string, isTyping: boolean): Promise<void> {
    if (!isTyping) {
      await supabase.from('chat_typing').delete().eq('id', 'global');
      return;
    }
    await supabase.from('chat_typing').upsert({
      id: 'global',
      uid,
      name,
      is_typing: true,
      updated_at: new Date().toISOString(),
    });
  }

  async sendMessage(
    authorUid: string,
    authorName: string,
    authorAvatar: string,
    text: string,
    media?: MediaAttachment,
  ): Promise<void> {
    const { error } = await supabase.from('chat_messages').insert({
      author_uid: authorUid,
      author_name: authorName,
      author_avatar: authorAvatar,
      text,
      media: media ?? null,
    });
    if (error) throw error;
    await this.setTyping(authorUid, authorName, false);
  }

  async uploadFile(file: File): Promise<MediaAttachment> {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('chat-media')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('chat-media')
      .getPublicUrl(data.path);

    const type = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : 'file';

    return { url: urlData.publicUrl, type, name: file.name, size: file.size };
  }

  unsubscribe(): void {
    if (this.msgChannel) {
      supabase.removeChannel(this.msgChannel);
      this.msgChannel = null;
    }
    if (this.typingChannel) {
      supabase.removeChannel(this.typingChannel);
      this.typingChannel = null;
    }
    this.messagesSignal.set([]);
    this.typingSignal.set(null);
  }
}
