import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  constructor(private authService: AuthService, private router: Router) {}

  email = signal('');
  password = signal('');
  errorMessage = signal<string | null>(null);

  
  async handleLogin() {
    this.errorMessage.set(null);
    try {
      await this.authService.logIn(this.email(), this.password());
      
      const role = await this.authService.getUserRole();

      switch(role) {
        case 'teacher':
          this.router.navigate(['/dashboard-teacher']);
        break;
        case 'admin':
          this.router.navigate(['/hub']); // /dashboard-admin
        break;
        default:
          this.router.navigate(['/hub']);
      }

    } catch (error: any) {
      this.errorMessage.set(error.message || 'Ocurrió un error desconocido.');
    }
  }
}
