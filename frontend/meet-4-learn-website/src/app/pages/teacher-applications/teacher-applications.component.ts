import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TeacherApplicationsService } from '../../services/teacher-applications.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-teacher-applications',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './teacher-applications.component.html',
  styleUrl: './teacher-applications.component.css'
})
export class TeacherApplicationsComponent {
  

  constructor(private router: Router, private teacherApplicationsService: TeacherApplicationsService) {}

  fullName = signal('');
  email = signal('');
  details = signal('');

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  async handleSubmit() {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    try {
      await this.teacherApplicationsService.submitTeacherApplication(
        this.fullName(),
        this.email(),
        this.details()
      );
    
      this.successMessage.set('¡Solicitud enviada! Te redirigiremos al Hub...');

      setTimeout(() => {
        this.router.navigate(['/hub']);
      }, 2000);

    } catch (error: any) {
      this.errorMessage.set(error.message);
    }
  }
}
