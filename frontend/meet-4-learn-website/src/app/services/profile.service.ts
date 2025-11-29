import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service'; 
import { ActiveSubscription } from './payment.service';

export interface Profile {
  id?: string;
  full_name: string;
  role: string;
  balance: number;
  carnet: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor( private supabaseService: SupabaseService, private authService: AuthService ) { }

  // Obtener todos los perfiles.
  async getProfiles() {
    const { data, error } = await this.supabaseService.client.from('profile').select('*');
    if (error) throw error;

    return data as Profile[];
}

  //Obtener docente por carnet.
  async getTeacherByCarnet(carnet: String)  {
  const { data, error } = await this.supabaseService.client.from('profile').select('*').eq('carnet', carnet).single();

  if(error) throw error;
  return data as Profile;
}

  // Crear un perfil.
 async createProfile(full_name: string, email: string, role: string, balance: number = 0.0, carnet: string) {

  const newProfile: Profile = {
    full_name: full_name,
    role: role,
    balance: balance,
    carnet: carnet
  }

  const { data, error } = await this.supabaseService.client.from('profile').insert([newProfile]);
  if (error) throw error;
  console.log(`Se agregó el perfil ${data}.`);
};

  // Obtener el perfil propio.
    async getOwnProfile() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabaseService.client
      .from('profile') 
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data as Profile;
  }

  //Obtener suscripción propia.
  async getMySubscription() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const subQuery = await this.supabaseService.client
      .from('teacher_subs')
      .select(`
        "expiresAt", 
        plan: "planId" ( id, name, price_monthly, price_annual ) 
      `)
      .eq('"teacherId"', userId)
      .maybeSingle(); 

    if (subQuery.error) throw subQuery.error;
    if (!subQuery.data) return null; 

    const transQuery = await this.supabaseService.client
      .from('transactions')
      .select('"itemId"') 
      .eq('"userId"', userId) 
      .order('id', { ascending: false }) 
      .limit(1)
      .maybeSingle();

    const activeSub: ActiveSubscription = {
      expiresAt: subQuery.data.expiresAt,
      plan: subQuery.data.plan as any,
      itemId: transQuery.data?.itemId || '' 
    };
    
    return activeSub; 
  }
}