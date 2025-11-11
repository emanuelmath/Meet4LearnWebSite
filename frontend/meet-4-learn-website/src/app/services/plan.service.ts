import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

 export interface Plan{
    id: string;
    name: string;
    price: number;
    max_students: number;
    max_active: number;
    commission_rate: number;
 }

@Injectable({
  providedIn: 'root'
})
export class PlanService {

  constructor( private supabaseService: SupabaseService ) { }

  // Obtener todos los planes.
  async getPlans() {
  const { data, error } = await this.supabaseService.client.from('plan').select('*');
  if (error) throw error;
  return data as Plan[];
};

  //Obtener plan por id.
  async getPlanById(id: String) {
  const { data, error } = await this.supabaseService.client.from('plan').select('*').eq('id', id).single();

  if(error) throw error;
  return data as Plan;
  }


}
