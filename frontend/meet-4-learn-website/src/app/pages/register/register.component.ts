import { Component, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    FormsModule, 
    RouterModule 
  ],
  standalone: true,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  constructor(private router: Router, private authService: AuthService) {}

  fullName = signal('');
  email = signal(''); 
  dui = signal('');     
  password = signal('');
  confirmPassword = signal('');

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  private isValidDui(dui: string): boolean {
    const duiRegex = /^\d+$/; 
    return duiRegex.test(dui);
  }

  async handleSubmit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const nameVal = this.fullName().trim();
    const emailVal = this.email().trim();
    const duiVal = this.dui().trim();
    const passVal = this.password();
    const confirmPassVal = this.confirmPassword();

    if (!nameVal || !emailVal || !duiVal || !passVal || !confirmPassVal) {
      this.errorMessage.set('Todos los campos son obligatorios.');
      return;
    }

    if (!this.isValidEmail(emailVal)) {
      this.errorMessage.set('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!this.isValidDui(duiVal)) {
      this.errorMessage.set('El DUI debe contener solo números (sin guiones).');
      return;
    }

    if (passVal.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (passVal !== confirmPassVal) {
      this.errorMessage.set('Las contraseñas no coinciden.');
      return;
    }

    try {
      await this.authService.signUpTeacher(
        emailVal,
        passVal,
        nameVal,
        duiVal
      );

      this.successMessage.set('¡Registro de docente exitoso! Tu plan "Descubre" ha sido asignado. Serás redirigido al Login.');

      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 3000); 

    } catch (error: any) {
      this.errorMessage.set(error.message || 'Ocurrió un error inesperado en el registro.');
    }
  }
}
