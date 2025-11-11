import { Injectable, signal } from '@angular/core';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js'
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  session = signal<Session | null>(null);
  currentUser = signal<User | null>(null);

  constructor(private supabaseService: SupabaseService) {
      this.supabaseService.client.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      console.log('Evento de Auth activo:', event);
      this.session.set(session);
      this.currentUser.set(session?.user ?? null);
    });
  }

 async logIn(email: string, password: string) {
    const {data, error} = await this.supabaseService.client.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    return data;
  }

  async signOut() {
    const { error } = await this.supabaseService.client.auth.signOut();

    if (error) throw error;
  }
  
}
