import { Injectable, signal } from '@angular/core';
import { supabase } from '../../environments/supabase.config';
import { Campana } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CampaignService {
  private campaignsSignal = signal<Campana[]>([]);
  private loadingSignal = signal(false);
  private channel: ReturnType<typeof supabase.channel> | null = null;

  readonly campaigns = this.campaignsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  subscribe(): void {
    this.loadingSignal.set(true);
    this.fetchCampaigns();

    this.channel = supabase
      .channel('campaigns-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => {
        this.fetchCampaigns();
      })
      .subscribe();
  }

  private async fetchCampaigns(): Promise<void> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      this.loadingSignal.set(false);
      return;
    }

    const list: Campana[] = (data ?? []).map((r: any) => ({
      id: r.id,
      titulo: r.titulo ?? '',
      descripcion: r.descripcion ?? '',
      metaMonto: Number(r.meta_monto) ?? 0,
      recaudadoMonto: Number(r.recaudado_monto) ?? 0,
      imagenUrl: r.imagen_url ?? '',
      creadorUid: r.creador_uid ?? '',
      creadorNombre: r.creador_nombre ?? '',
      creadorEmail: r.creador_email ?? '',
      paypalEmail: r.paypal_email ?? '',
      createdAt: new Date(r.created_at).getTime(),
    }));

    this.campaignsSignal.set(list);
    this.loadingSignal.set(false);
  }

  async create(c: Omit<Campana, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await supabase.from('campaigns').insert({
      titulo: c.titulo,
      descripcion: c.descripcion,
      meta_monto: c.metaMonto,
      recaudado_monto: c.recaudadoMonto,
      imagen_url: c.imagenUrl,
      creador_uid: c.creadorUid,
      creador_nombre: c.creadorNombre,
      creador_email: c.creadorEmail,
      paypal_email: c.paypalEmail,
    });
    if (error) throw error;
  }

  async updateProgress(id: string, recaudadoMonto: number): Promise<void> {
    const { error } = await supabase
      .from('campaigns')
      .update({ recaudado_monto: recaudadoMonto })
      .eq('id', id);
    if (error) throw error;
  }

  unsubscribe(): void {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.campaignsSignal.set([]);
  }
}
