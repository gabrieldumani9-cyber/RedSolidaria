import { Injectable, signal } from '@angular/core';
import { supabase } from '../../environments/supabase.config';
import { Post, MediaAttachment, Report, ReportReason } from '../models/models';

@Injectable({ providedIn: 'root' })
export class FeedService {
  private postsSignal = signal<Post[]>([]);
  private loadingSignal = signal(false);
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private reportedIds = new Set<string>();

  readonly posts = this.postsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  subscribeToPosts(): void {
    this.loadingSignal.set(true);
    this.fetchPosts();

    this.channel = supabase
      .channel('posts-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        this.fetchPosts();
      })
      .subscribe();
  }

  private async fetchPosts(): Promise<void> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      this.loadingSignal.set(false);
      return;
    }

    const posts: Post[] = (data ?? []).map((r: any) => ({
      id: r.id,
      authorUid: r.author_uid,
      authorName: r.author_name,
      authorAvatar: r.author_avatar,
      text: r.text ?? '',
      media: r.media ?? undefined,
      timestamp: new Date(r.created_at).getTime(),
    }));

    this.postsSignal.set(posts);
    this.loadingSignal.set(false);
  }

  async createPost(
    authorUid: string,
    authorName: string,
    authorAvatar: string,
    text: string,
    media?: MediaAttachment,
  ): Promise<void> {
    const { error } = await supabase.from('posts').insert({
      author_uid: authorUid,
      author_name: authorName,
      author_avatar: authorAvatar,
      text,
      media: media ?? null,
    });
    if (error) throw error;
  }

  async uploadFile(file: File): Promise<MediaAttachment> {
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('post-media')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('post-media')
      .getPublicUrl(data.path);

    const type = file.type.startsWith('image/')
      ? 'image'
      : file.type.startsWith('video/')
        ? 'video'
        : 'file';

    return { url: urlData.publicUrl, type, name: file.name, size: file.size };
  }

  async reportPost(postId: string, reportedBy: string, reason: ReportReason): Promise<void> {
    const { error } = await supabase.from('reports').insert({
      post_id: postId,
      reported_by: reportedBy,
      reason,
    });
    if (error) throw error;
    this.reportedIds.add(postId);
  }

  async hasReported(postId: string, userId: string): Promise<boolean> {
    if (this.reportedIds.has(postId)) return true;
    const { data } = await supabase
      .from('reports')
      .select('id')
      .eq('post_id', postId)
      .eq('reported_by', userId)
      .maybeSingle();
    if (data) this.reportedIds.add(postId);
    return !!data;
  }

  unsubscribe(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.postsSignal.set([]);
  }
}
