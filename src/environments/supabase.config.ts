import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from './environment';

if (!supabaseConfig.url || !supabaseConfig.anonKey) {
  throw new Error('Falta la configuración pública de Supabase.');
}

export const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
