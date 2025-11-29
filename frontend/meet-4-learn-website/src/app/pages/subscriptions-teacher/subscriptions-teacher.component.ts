import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PlanService, Plan } from '../../services/plan.service';
import { ProfileService, Profile } from '../../services/profile.service';
import { PaymentService, BillingCycle, ActiveSubscription } from '../../services/payment.service';

@Component({
  selector: 'app-subscriptions-teacher',
  imports: [CommonModule, FormsModule, RouterLink],
  standalone: true,
  templateUrl: './subscriptions-teacher.component.html',
  styleUrl: './subscriptions-teacher.component.css'
})
export class SubscriptionsTeacherComponent implements OnInit {

  constructor(private planService: PlanService, private profileService: ProfileService, private paymentService: PaymentService) {}

  myProfile = signal<Profile | null>(null);
  allPlans = signal<Plan[]>([]);
  mySubscription = signal<ActiveSubscription | null>(null);

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  selectedCycle = signal<BillingCycle>('monthly');

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.clearMessages();
    try {
      const [profile, plans, subscription] = await Promise.all([
        this.profileService.getOwnProfile(),
        this.planService.getPlans(),
        this.profileService.getMySubscription()
      ]);

      this.myProfile.set(profile);
      this.allPlans.set(plans);
      this.mySubscription.set(subscription);
      console.log('Suscripción cargada:', subscription);

    } catch (error: any) {
      this.errorMessage.set('Error al cargar datos.');
      console.error(error);
    }
  }

  getSubscriptionCycle(sub: ActiveSubscription): BillingCycle {
    if (!sub || !sub.itemId) {
      console.log('DEBUG: No hay itemId, retornando monthly');
      return 'monthly';
    } 
    
    const idLower = sub.itemId.toLowerCase();
    console.log('DEBUG: Analizando ciclo para itemId:', idLower);
    
    if (
      idLower.includes('annual')
    ) {
      return 'annual';
    }
    
    return 'monthly';
  }

  isFarFuture(dateStr?: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date.getFullYear() > 2100; 
  }

  hasActivePaidSubscription(): boolean {
    const sub = this.mySubscription();
    if (!sub || !sub.plan) return false;
    
    if (sub.plan.price_monthly === 0) return false;

    const isPaid = (sub.plan.price_monthly || 0) > 0;
    const expiresAt = new Date(sub.expiresAt).getTime();
    const now = new Date().getTime();
    
    return isPaid && (expiresAt > now);
  }

  isMyCurrentPlanAndCycle(plan: Plan): boolean {
    const sub = this.mySubscription();
    if (!sub || !sub.plan) return false;

    if (sub.plan.id !== plan.id) return false;

    if (plan.price_monthly === 0) return true;

    const currentCycle = this.getSubscriptionCycle(sub);
    return currentCycle === this.selectedCycle();
  }

  async handleBuyPlan(planId: string, cycle: BillingCycle, price: number) {
    this.clearMessages();

    if (this.hasActivePaidSubscription()) {
      this.errorMessage.set('Ya tienes una suscripción activa. Espera a que venza para cambiar.');
      return;
    }

    if (!this.myProfile()) return;

    if (this.myProfile()!.balance < price) {
      this.errorMessage.set(`Saldo insuficiente. Tienes $${this.myProfile()?.balance}.`);
      return;
    }

    if (!confirm(`¿Confirmas la compra por $${price}?`)) {
      return;
    }

    try {
      await this.paymentService.buyPlan(planId, cycle);
      this.successMessage.set(`¡Plan comprado con éxito!`);
      this.loadData(); 
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error desconocido');
    }
  }

  private clearMessages() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}