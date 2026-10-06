import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { FeedService } from '../services/feed.service';
import { Post, MediaAttachment, formatTime, REPORT_REASONS, ReportReason } from '../models/models';
import { ReportModalComponent } from '../components/report-modal.component';

@Component({
  selector: 'app-feed',
  imports: [CommonModule, FormsModule, ReportModalComponent],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <!-- Create post -->
      <div class="bg-white rounded-2xl border border-slate-200 p-4">
        <div class="flex gap-3">
          <img [src]="authSvc.user()?.photoURL" [alt]="authSvc.user()?.displayName" class="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
          <div class="flex-1">
            <textarea
              [(ngModel)]="postText"
              placeholder="¿Qué quieres compartir con la comunidad?"
              rows="3"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition resize-none"
            ></textarea>

            @if (previewUrl()) {
              <div class="mt-2 relative inline-block">
                <img [src]="previewUrl()" class="h-32 rounded-xl object-cover" />
                <button (click)="clearPreview()" class="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center hover:bg-black/70">✕</button>
              </div>
            }
            @if (selectedFile() && !previewUrl()) {
              <div class="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                <span class="text-xl">📎</span>
                <span class="text-xs text-slate-600 flex-1 truncate">{{ selectedFile()?.name }}</span>
                <button (click)="clearPreview()" class="text-slate-400 hover:text-red-500 text-sm">✕</button>
              </div>
            }

            <div class="flex items-center justify-between mt-3">
              <label class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-sm text-slate-600">
                <span>📎</span><span class="text-xs font-medium">Adjuntar</span>
                <input type="file" class="hidden" (change)="onFileSelected($event)" accept="image/*,video/*,.pdf,.doc,.docx,.txt" />
              </label>
              <button (click)="createPost()" [disabled]="posting()"
                class="px-5 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition disabled:opacity-50">
                @if (posting()) { <span class="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> }
                @else { Publicar }
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Feed -->
      @if (loading()) {
        <div class="flex items-center justify-center py-16">
          <span class="inline-block h-8 w-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></span>
        </div>
      }
      @if (!loading() && posts().length === 0) {
        <div class="text-center py-16">
          <span class="text-4xl block mb-2">📢</span>
          <p class="text-sm text-slate-400">Aún no hay publicaciones. ¡Sé el primero en compartir!</p>
        </div>
      }
      @for (p of posts(); track p.id) {
        <article class="bg-white rounded-2xl border border-slate-200 p-4 animate-fade-in-up">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <img [src]="p.authorAvatar" [alt]="p.authorName" class="h-10 w-10 rounded-full bg-slate-200" />
              <div>
                <p class="text-sm font-bold text-slate-900">{{ p.authorName }}</p>
                <p class="text-xs text-slate-500">{{ formatTime(p.timestamp) }}</p>
              </div>
            </div>
            <button (click)="openReport(p)" class="text-xs text-slate-400 hover:text-red-500 transition" title="Reportar">
              🚩
            </button>
          </div>

          @if (p.text) {
            <p class="text-sm text-slate-700 whitespace-pre-wrap break-words mb-3">{{ p.text }}</p>
          }

          @if (p.media) {
            @if (p.media.type === 'image') {
              <img [src]="p.media.url" [alt]="p.media.name" class="w-full rounded-xl max-h-96 object-cover" loading="lazy" />
            } @else if (p.media.type === 'video') {
              <video [src]="p.media.url" controls class="w-full rounded-xl max-h-96"></video>
            } @else {
              <a [href]="p.media.url" target="_blank" class="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-primary-600 hover:bg-slate-100 transition">
                📎 {{ p.media.name }}
              </a>
            }
          }
        </article>
      }
    </div>

    <!-- Report modal -->
    @if (reportingPost()) {
      <app-report-modal
        [post]="reportingPost()!"
        [userId]="authSvc.user()?.uid ?? ''"
        (close)="closeReport()"
        (reported)="onReported()"
      />
    }
  `,
})
export class FeedComponent implements OnDestroy {
  authSvc = inject(AuthService);
  private feedSvc = inject(FeedService);

  posts = this.feedSvc.posts;
  loading = this.feedSvc.loading;

  postText = '';
  posting = signal(false);
  selectedFile = signal<File | null>(null);
  previewUrl = signal('');
  reportingPost = signal<Post | null>(null);

  formatTime = formatTime;

  constructor() {
    this.feedSvc.subscribeToPosts();
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
    } else {
      this.previewUrl.set('');
    }
  }

  clearPreview(): void {
    this.selectedFile.set(null);
    this.previewUrl.set('');
  }

  async createPost(): Promise<void> {
    const u = this.authSvc.user();
    if (!u) return;
    if (!this.postText.trim() && !this.selectedFile()) return;
    this.posting.set(true);
    try {
      let media: MediaAttachment | undefined;
      const file = this.selectedFile();
      if (file) {
        media = await this.feedSvc.uploadFile(file);
      }
      await this.feedSvc.createPost(u.uid, u.displayName, u.photoURL, this.postText.trim(), media);
      this.postText = '';
      this.clearPreview();
    } catch {
      // ignore
    } finally {
      this.posting.set(false);
    }
  }

  openReport(post: Post): void {
    this.reportingPost.set(post);
  }

  closeReport(): void {
    this.reportingPost.set(null);
  }

  onReported(): void {
    this.reportingPost.set(null);
  }

  ngOnDestroy(): void {
    this.feedSvc.unsubscribe();
  }
}
