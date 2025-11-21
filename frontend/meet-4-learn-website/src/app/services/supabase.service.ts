import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
  }

  get client() {
    return this.supabase;
  }

  // Devuelve el cliente para el Auth.
  get auth() {
    return this.supabase.auth;
  }

  // Devuelve el cliente para las funciones más complejas, como las que se usarán para el administrador.
  get functions() {
    return this.supabase.functions;
  }

  // Retorna un constructor de consultas para una tabla en específico.
  from(table: string) {
    return this.supabase.from(table);
  }
}
