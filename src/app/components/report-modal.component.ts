import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedService } from '../services/feed.service';
import { Post, REPORT_REASONS, ReportReason } from '../models/models';

@Component({
  selector: 'app-report-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in-up" (click)="close.emit()">
      <div class="bg-white rounded-2xl w-full max-w-md p-6 animate-scale-in" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-slate-900 text-lg">Reportar publicación</h3>
          <button (click)="close.emit()" class="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        @if (success()) {
          <div class="text-center py-6">
            <span class="text-4xl block mb-3">✅</span>
            <p class="text-sm font-semibold text-slate-700">Contenido reportado correctamente</p>
            <p class="text-xs text-slate-500 mt-1">Gracias por ayudar a mantener la comunidad segura.</p>
            <button (click)="close.emit()" class="mt-4 px-6 py-2 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition">Cerrar</button>
          </div>
        } @else {
          <div class="space-y-4">
            @if (error()) {
              <div class="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{{ error() }}</div>
            }
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-2">Motivo del reporte</label>
              <select
                [(ngModel)]="reason"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition"
              >
                <option value="" disabled selected>Selecciona un motivo</option>
                @for (r of reasons; track r.value) {
                  <option [value]="r.value">{{ r.label }}</option>
                }
              </select>
            </div>
            <div class="flex gap-2">
              <button (click)="close.emit()" class="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition">Cancelar</button>
              <button (click)="submit()" [disabled]="submitting() || !reason"
                class="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition disabled:opacity-50">
                @if (submitting()) { <span class="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> }
                @else { Reportar }
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class ReportModalComponent {
  @Input({ required: true }) post!: Post;
  @Input({ required: true }) userId = '';
  @Output() close = new EventEmitter<void>();
  @Output() reported = new EventEmitter<void>();

  private feedSvc = inject(FeedService);

  reasons = REPORT_REASONS;
  reason: ReportReason | '' = '';
  submitting = signal(false);
  error = signal('');
  success = signal(false);

  async submit(): Promise<void> {
    if (!this.reason) return;
    this.submitting.set(true);
    this.error.set('');
    try {
      const already = await this.feedSvc.hasReported(this.post.id, this.userId);
      if (already) {
        this.error.set('Ya has reportado esta publicación.');
        this.submitting.set(false);
        return;
      }
      await this.feedSvc.reportPost(this.post.id, this.userId, this.reason);
      this.success.set(true);
      setTimeout(() => this.reported.emit(), 1500);
    } catch {
      this.error.set('Error al enviar el reporte. Inténtalo de nuevo.');
    } finally {
      this.submitting.set(false);
    }
  }
}
