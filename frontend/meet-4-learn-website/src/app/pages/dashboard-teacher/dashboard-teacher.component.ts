import { Component, signal, effect, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService, Profile } from '../../services/profile.service';
import { CourseService, Course } from '../../services/course.service';

@Component({
  selector: 'app-dashboard-teacher',
  imports: [CommonModule, RouterLink],
  standalone: true,
  templateUrl: './dashboard-teacher.component.html',
  styleUrl: './dashboard-teacher.component.css'
})
export class DashboardTeacherComponent {
  
  currentUser: any; 
  myProfile = signal<Profile | null>(null);
  
  currentPlanName = signal('Gratuito');
  courseLimit = signal(1); 

  myCourses = signal<Course[]>([]); 
  isLoading = signal(false);

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  stats = computed(() => {
    const courses = this.myCourses();
    return {
      total: courses.length,
      active: courses.filter(c => c.status === 'activo').length,
      pending: courses.filter(c => c.status === 'en_revision').length
    };
  });

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private courseService: CourseService,
    private router: Router
  ) {
    // Inicializamos la señal del usuario aquí
    this.currentUser = this.authService.currentUser;

    // Efecto
    effect(() => {
      const user = this.currentUser();
      if (user) {
        this.loadTeacherData();
      } else {
        this.resetData();
      }
    });
  }

  // --- LÓGICA DE CARGA DE DATOS ---

  async loadTeacherData() {
    this.isLoading.set(true);
    this.clearMessages();

    try {
      const profile = await this.profileService.getOwnProfile();
      this.myProfile.set(profile);

      const courses = await this.courseService.getMyCourses();
      this.myCourses.set(courses);

      await this.loadPlanDetails();

    } catch (error: any) {
      console.error('Error cargando dashboard docente:', error);
      this.errorMessage.set('No se pudieron cargar algunos datos del panel.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadPlanDetails() {
    try {
      const sub: any = await this.profileService.getMySubscription();
      
      if (sub && sub.plan) {
        const planName = sub.plan.name;
        this.currentPlanName.set(planName);

        if (planName.toLowerCase().includes('expande')) {
            this.courseLimit.set(7);
        } else if (planName.toLowerCase().includes('crece')) {
            this.courseLimit.set(4);
        } else {
            this.courseLimit.set(1);
        }
      } else {
        this.currentPlanName.set('Descubre (Gratis)');
        this.courseLimit.set(1);
      }
    } catch (error) {
      this.currentPlanName.set('Descubre');
      this.courseLimit.set(1);
    }
  }

  private clearMessages() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  private resetData() {
    this.myProfile.set(null);
    this.myCourses.set([]);
    this.courseLimit.set(1);
  }
}
