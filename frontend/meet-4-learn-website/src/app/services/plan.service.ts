import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Plan {
  id: string;
  name: string;
  max_students: number;
  max_active: number;
  commission_rate: number;
  price_monthly: number;
  price_annual: number;
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

  async updatePlan(id: string, updates: Partial<Plan>) {
    const { data, error } = await this.supabaseService.client
      .from('plan')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Plan;
  }

}
