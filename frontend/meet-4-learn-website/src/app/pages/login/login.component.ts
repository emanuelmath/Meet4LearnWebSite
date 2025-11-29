import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule, RouterLink],
  standalone: true,
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
          this.router.navigate(['/panel-teacher']);
        break;
        case 'admin':
          this.router.navigate(['/hub']); // /dashboard-adminl
        break;
        default:
          this.errorMessage.set("¡Eres estudiante! Pero solo puedes iniciar sesión en nuestra app.");
          this.router.navigate(['/hub']);

      }

    } catch (error: any) {
      this.errorMessage.set(error.message || 'Ocurrió un error desconocido.');
    }
  }
}
