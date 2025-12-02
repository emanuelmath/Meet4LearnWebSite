import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-admin-transactions-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-transactions-management.component.html',
  styleUrls: ['./admin-transactions-management.component.css']
})
export class AdminTransactionsManagementComponent implements OnInit {

  private adminService = inject(AdminService);

  transactions = signal<any[]>([]);
  
  searchTerm = signal('');
  typeFilter = signal('');

  filteredTransactions = computed(() => {
    const all = this.transactions();
    const term = this.searchTerm().toLowerCase();
    const type = this.typeFilter();

    return all.filter(tx => {
      const userName = tx.profile?.full_name || '';
      const userDui = tx.profile?.DUI || '';
      const userMatch = userName.toLowerCase().includes(term) || userDui.toLowerCase().includes(term);

      const typeMatch = type ? tx.itemType === type : true;

      return userMatch && typeMatch;
    });
  });

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      const data = await this.adminService.getAllTransactions();
      this.transactions.set(data);
    } catch (error: any) {
      this.errorMessage.set('Error al cargar historial: ' + error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  formatType(type: string): string {
    const types: {[key: string]: string} = {
      'course': 'COMPRA CURSO',
      'plan': 'SUSCRIPCIÓN',
      'recharge': 'RECARGA SALDO'
    };
    return types[type] || type.toUpperCase();
  }
}