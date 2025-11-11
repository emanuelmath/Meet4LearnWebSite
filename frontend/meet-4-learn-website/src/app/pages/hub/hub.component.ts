import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; 
import { PlanService, Plan } from '../../services/plan.service';

@Component({
  selector: 'app-hub',
  imports: [CommonModule, RouterLink],
  standalone: true,
  templateUrl: './hub.component.html',
  styleUrl: './hub.component.css'
})
export class HubComponent implements OnInit {

  constructor(private planService: PlanService ) {}

  plans = signal<Plan[]>([]);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadPlans();
  }

  async loadPlans() {
    this.errorMessage.set(null);
    try {
      const data = await this.planService.getPlans();
      this.plans.set(data);
    } catch (error: any) {
      this.errorMessage.set(error.message);
    }
  }
}
