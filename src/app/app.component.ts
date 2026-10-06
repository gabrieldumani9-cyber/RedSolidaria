import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50">
      <!-- Top bar -->
      <header class="sticky top-0 z-40 backdrop-blur bg-white/90 border-b border-slate-200">
        <div class="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <a routerLink="/" class="flex items-center gap-2 font-extrabold text-base">
            <span class="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-white text-sm shadow-sm">🤝</span>
            <span class="text-slate-900">Red<span class="text-primary-600">Solidaria</span></span>
          </a>

          <!-- Desktop nav -->
          <nav class="hidden md:flex items-center gap-1">
            <a routerLink="/" routerLinkActive="bg-primary-50 text-primary-700" [routerLinkActiveOptions]="{ exact: true }"
              class="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Solicitudes</a>
            <a routerLink="/mapa" routerLinkActive="bg-primary-50 text-primary-700"
              class="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Mapa</a>
            <a routerLink="/campanas" routerLinkActive="bg-primary-50 text-primary-700"
              class="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Campañas</a>
            <a routerLink="/feed" routerLinkActive="bg-primary-50 text-primary-700"
              class="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Feed</a>
            <a routerLink="/chat" routerLinkActive="bg-primary-50 text-primary-700"
              class="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Chat</a>
            <a routerLink="/perfil" routerLinkActive="bg-primary-50 text-primary-700"
              class="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition">Perfil</a>
          </nav>

          <div class="flex items-center gap-3">
            @if (authSvc.user(); as u) {
              <div class="hidden md:flex items-center gap-2">
                <img [src]="u.photoURL" [alt]="u.displayName" class="h-8 w-8 rounded-full bg-primary-100 border border-primary-200" />
                <span class="text-sm font-medium text-slate-700">{{ u.displayName }}</span>
                <button (click)="logout()" class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition">Salir</button>
              </div>
            } @else {
              <a routerLink="/login" class="hidden md:inline-block px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-bold hover:bg-primary-700 transition">Iniciar sesión</a>
            }
            <!-- Mobile hamburger -->
            <button (click)="toggleMenu()" class="md:hidden p-2 rounded-lg hover:bg-slate-100 transition">
              <span class="text-xl">☰</span>
            </button>
          </div>
        </div>

        <!-- Mobile menu -->
        @if (menuOpen()) {
          <div class="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 animate-fade-in-up">
            <a routerLink="/" (click)="closeMenu()" routerLinkActive="bg-primary-50 text-primary-700" [routerLinkActiveOptions]="{ exact: true }"
              class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">📋 Solicitudes</a>
            <a routerLink="/mapa" (click)="closeMenu()" routerLinkActive="bg-primary-50 text-primary-700"
              class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">🗺️ Mapa</a>
            <a routerLink="/campanas" (click)="closeMenu()" routerLinkActive="bg-primary-50 text-primary-700"
              class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">🎁 Campañas</a>
            <a routerLink="/feed" (click)="closeMenu()" routerLinkActive="bg-primary-50 text-primary-700"
              class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">📢 Feed</a>
            <a routerLink="/chat" (click)="closeMenu()" routerLinkActive="bg-primary-50 text-primary-700"
              class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">💬 Chat</a>
            <a routerLink="/perfil" (click)="closeMenu()" routerLinkActive="bg-primary-50 text-primary-700"
              class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">👤 Perfil</a>
            @if (authSvc.user(); as u) {
              <div class="pt-2 border-t border-slate-100 mt-2 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <img [src]="u.photoURL" [alt]="u.displayName" class="h-8 w-8 rounded-full bg-primary-100" />
                  <span class="text-sm font-medium text-slate-700">{{ u.displayName }}</span>
                </div>
                <button (click)="logout()" class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200">Salir</button>
              </div>
            } @else {
              <a routerLink="/login" (click)="closeMenu()" class="block px-3 py-2 rounded-lg text-sm font-bold text-primary-600">Iniciar sesión</a>
            }
          </div>
        }
      </header>

      <main class="flex-1 pb-20 md:pb-0">
        <router-outlet />
      </main>

      <!-- Mobile bottom nav -->
      <nav class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around px-2 py-2">
        <a routerLink="/" routerLinkActive="text-primary-600" [routerLinkActiveOptions]="{ exact: true }"
          class="flex flex-col items-center gap-0.5 px-2 py-1 text-slate-500">
          <span class="text-xl">📋</span><span class="text-[10px] font-medium">Solicitudes</span>
        </a>
        <a routerLink="/mapa" routerLinkActive="text-primary-600"
          class="flex flex-col items-center gap-0.5 px-2 py-1 text-slate-500">
          <span class="text-xl">🗺️</span><span class="text-[10px] font-medium">Mapa</span>
        </a>
        <a routerLink="/feed" routerLinkActive="text-primary-600"
          class="flex flex-col items-center gap-0.5 px-2 py-1 text-slate-500">
          <span class="text-xl">📢</span><span class="text-[10px] font-medium">Feed</span>
        </a>
        <a routerLink="/chat" routerLinkActive="text-primary-600"
          class="flex flex-col items-center gap-0.5 px-2 py-1 text-slate-500">
          <span class="text-xl">💬</span><span class="text-[10px] font-medium">Chat</span>
        </a>
        <a routerLink="/perfil" routerLinkActive="text-primary-600"
          class="flex flex-col items-center gap-0.5 px-2 py-1 text-slate-500">
          <span class="text-xl">👤</span><span class="text-[10px] font-medium">Perfil</span>
        </a>
      </nav>

      <footer class="hidden md:block border-t border-slate-200 bg-white">
        <div class="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-slate-500">
          RedSolidaria — Conectando comunidades con ayuda real.
        </div>
      </footer>
    </div>
  `,
})
export class App {
  authSvc = inject(AuthService);
  private router = inject(Router);

  menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  async logout(): Promise<void> {
    await this.authSvc.logout();
    this.router.navigate(['/login']);
  }
}
