import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './panel-admin.component.html',
  styleUrls: ['./panel-admin.component.css']    
})
export class PanelAdminComponent {

  private authService = inject(AuthService);
  public router = inject(Router);

  currentUser = this.authService.currentUser;

  async handleLogout() {
    try {
      await this.authService.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  }
}
