import { Injectable, signal, computed, inject } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../environments/supabase.config';
import { AppUser, avatarUrl } from '../models/models';
import { DatastoreService } from './datastore.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<AppUser | null>(null);
  private sessionReady = false;
  private sessionReadyPromise: Promise<void>;
  private resolveSessionReady!: () => void;
  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  constructor() {
    const store = inject(DatastoreService);
    this.sessionReadyPromise = new Promise<void>((resolve) => {
      this.resolveSessionReady = resolve;
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      this.applySession(session, store);
    });

    void supabase.auth.getSession().then(({ data }) => {
      this.applySession(data.session, store);
    }).catch(() => {
      this.markSessionReady();
    });
  }

  private applySession(session: Session | null, store: DatastoreService): void {
    const u = session?.user;
    if (!u) {
      this.currentUser.set(null);
      this.markSessionReady();
      return;
    }

    const name = u.user_metadata?.['display_name'] ?? u.email?.split('@')[0] ?? 'Usuario';
    this.currentUser.set({
      uid: u.id,
      email: u.email ?? '',
      displayName: name,
      photoURL: u.user_metadata?.['avatar_url'] ?? avatarUrl(name),
    });
    store.setUsuarioFromAuth(u.id, name, u.email ?? '');
    this.markSessionReady();
  }

  private markSessionReady(): void {
    if (this.sessionReady) return;
    this.sessionReady = true;
    this.resolveSessionReady();
  }

  async waitForSession(): Promise<void> {
    await this.sessionReadyPromise;
  }

  async register(name: string, email: string, password: string): Promise<boolean> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
          avatar_url: avatarUrl(name),
        },
      },
    });
    if (error) throw error;

    if (!data.user) throw new Error('No se pudo crear la cuenta.');

    if (data.session) {
      await this.saveProfile(data.user.id, email, name);
    }

    return !data.session;
  }

  async login(email: string, password: string): Promise<void> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error('No se pudo iniciar la sesión.');
    const user = data.session.user;
    const name = user.user_metadata?.['display_name'] ?? user.email?.split('@')[0] ?? 'Usuario';
    await this.saveProfile(user.id, user.email ?? email, name);
    await this.waitForSession();
  }

  private async saveProfile(uid: string, email: string, name: string): Promise<void> {
    const { error } = await supabase.from('profiles').upsert({
      uid,
      email,
      display_name: name,
      avatar_url: avatarUrl(name),
    }, { onConflict: 'uid' });
    if (error) throw error;
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    this.currentUser.set(null);
  }
}
