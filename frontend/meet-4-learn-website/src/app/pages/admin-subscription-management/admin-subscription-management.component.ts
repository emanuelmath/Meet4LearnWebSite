import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanService, Plan } from '../../services/plan.service';

interface PlanViewModel extends Plan {
  _commissionDisplay: number; 
}

@Component({
  selector: 'app-admin-subscription-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-subscription-management.component.html',
  styleUrls: ['./admin-subscription-management.component.css']
})
export class AdminSubscriptionManagementComponent implements OnInit {

  private planService = inject(PlanService);

  plans = signal<PlanViewModel[]>([]);

  isLoading = signal(true);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadPlans();
  }

  async loadPlans() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const data = await this.planService.getPlans();
      
      const order: Record<string, number> = { 'Descubre': 1, 'Crece': 2, 'Avanzado': 3 };
      
      const sorted = data.sort((a, b) => {
        return (order[a.id] || 99) - (order[b.id] || 99);
      });

      const viewModels: PlanViewModel[] = sorted.map(plan => ({
        ...plan,
        _commissionDisplay: plan.commission_rate * 100
      }));

      this.plans.set(viewModels);

    } catch (error: any) {
      this.errorMessage.set('Error al cargar planes: ' + error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveAllChanges() {
    if (!confirm('¿Estás seguro de guardar los cambios en los precios y límites?')) return;

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      const updatePromises = this.plans().map(plan => {
        
        const commissionDecimal = plan._commissionDisplay / 100;

        return this.planService.updatePlan(plan.id, {
          price_monthly: plan.price_monthly,
          max_students: plan.max_students,
          max_active: plan.max_active,
          commission_rate: commissionDecimal
        });
      });

      await Promise.all(updatePromises);
      
      this.successMessage.set('Todos los planes se han actualizado correctamente.');

    } catch (error: any) {
      this.errorMessage.set('Error al guardar cambios: ' + error.message);
    } finally {
      this.isSaving.set(false);
    }
  }

  getBorderColor(planId: string): string {
    switch (planId) {
      case 'Descubre': return 'border-blue';
      case 'Crece': return 'border-yellow';
      case 'Avanzado': return 'border-green'; 
      default: return 'border-gray';
    }
  }
}