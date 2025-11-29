import { Component, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Course, CourseService, CourseCreatePayload } from '../../services/course.service';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-courses-teacher',
  imports: [CommonModule, FormsModule, RouterLink],
  standalone: true,
  templateUrl: './courses-teacher.component.html',
  styleUrl: './courses-teacher.component.css'
})
export class CoursesTeacherComponent implements OnInit{

  constructor(private courseService: CourseService, private profileService: ProfileService) {}

// Datos
  myCourses = signal<Course[]>([]);

  // Límites del Plan
  courseLimit = signal(1); // Default 1 (Descubre)
  currentPlanName = signal('Cargando...');

  // Computed: Verifica si puede crear más cursos
  canCreateMore = computed(() => this.myCourses().length < this.courseLimit());

  // Estado UI
  isLoading = signal(false);
  isModalOpen = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Formulario
  newCourse = signal<CourseCreatePayload>({
    name: '',
    subject: '',
    price: 0,
    start_date: new Date(),
    finish_date: new Date()
  });
  courseDescription = signal('');

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      // 1. Cargar Cursos
      const data = await this.courseService.getMyCourses();
      this.myCourses.set(data);

      // 2. Cargar Plan para saber límites
      await this.loadPlanLimits();
    } catch (error: any) {
      this.errorMessage.set('Error al cargar información.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadPlanLimits() {
    try {
      const sub: any = await this.profileService.getMySubscription();
      if (sub && sub.plan) {
        const name = sub.plan.name.toLowerCase();
        this.currentPlanName.set(sub.plan.name);

        if (name.includes('expande')) this.courseLimit.set(7);
        else if (name.includes('crece')) this.courseLimit.set(4);
        else this.courseLimit.set(1); // Descubre
      } else {
        this.currentPlanName.set('Descubre (Gratis)');
        this.courseLimit.set(1);
      }
    } catch (e) {
      this.courseLimit.set(1); // Fallback seguro
    }
  }

  // --- MODAL ---
  toggleModal() {
    if (!this.isModalOpen() && !this.canCreateMore()) {
      alert(`Has alcanzado el límite de cursos de tu plan ${this.currentPlanName()}. Actualiza tu suscripción para crear más.`);
      return;
    }

    this.isModalOpen.update(v => !v);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!this.isModalOpen()) this.resetForm();
  }

  resetForm() {
    this.newCourse.set({
      name: '',
      subject: '',
      price: 0,
      start_date: new Date(),
      finish_date: new Date()
    });
    this.courseDescription.set('');
  }

  async handleCreateCourse() {
    this.errorMessage.set(null);
    const form = this.newCourse();

    // Validaciones básicas
    if (!form.name || !form.subject || !form.start_date || !form.finish_date) {
      this.errorMessage.set('Todos los campos son obligatorios.');
      return;
    }

    // Validación de fechas
    if (form.finish_date < form.start_date) {
      this.errorMessage.set('La fecha de finalización debe ser posterior a la de inicio.');
      return;
    }

    try {
      this.isLoading.set(true);

      const payload = {
        ...form
      };

      const created = await this.courseService.createCourse(payload);

      this.myCourses.update(c => [created, ...c]);
      this.successMessage.set('Curso creado exitosamente.');
      this.toggleModal();

    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al crear curso.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
