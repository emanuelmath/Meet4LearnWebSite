import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export type BillingCycle = 'monthly' | 'annual';

export interface SavedPaymentMethod {
  id: number;
  user_id: string;
  last_four_digits: string;
  brand: string;
  expiration_month: number;
  expiration_year: number;
}

export type AddCardPayload = Omit<SavedPaymentMethod, 'id' | 'user_id'>;

export interface ActiveSubscription {
  expiresAt: string;
  itemId?: string; 
  plan: {
    id: string;
    name: string;
    price_monthly: number;
    price_annual: number;
  };
}


@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);

  async addPaymentMethod(cardData: AddCardPayload) {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado.');

    const { data, error } = await this.supabaseService.client
      .from('saved_payment_methods')
      .insert([
        { 
          ...cardData,
          user_id: userId 
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data as SavedPaymentMethod;
  }

  async getMyPaymentMethods() {
    const { data, error } = await this.supabaseService.client
      .from('saved_payment_methods')
      .select('*');
    
    if (error) throw error;
    return data as SavedPaymentMethod[];
  }

  async deletePaymentMethod(cardId: number) {
    const { error } = await this.supabaseService.client
      .from('saved_payment_methods')
      .delete()
      .eq('id', cardId);
    
    if (error) throw error;
  }

  async rechargeBalance(amount: number, cardId: number) {
    const { data, error } = await this.supabaseService.client.functions.invoke(
      'recargar-saldo',
      {
        body: { amount: amount, cardId: cardId }
      }
    );

    if (error) throw error;
    return data;
  }

  async buyPlan(planId: string, cycle: BillingCycle) {
    const { data, error } = await this.supabaseService.client.functions.invoke(
      'comprar-plan-docente',
      {
        body: { 
          planId: planId,
          billingCycle: cycle
        }
      }
    );

    if (error) throw error;
    return data;
  }
}