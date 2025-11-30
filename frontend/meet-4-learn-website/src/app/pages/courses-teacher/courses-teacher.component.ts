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
  newCourse = signal<{
    name: string;
    category: string;
    description: string;
    price: number;
    start_date: string; 
    finish_date: string;
  }>({
    name: '',
    category: '',
    description: '',
    price: 0,
    start_date: new Date().toISOString().split('T')[0], 
    finish_date: ''
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
      category: '',
      description: '',
      price: 0,
      start_date: '',
      finish_date: ''
    });
    this.courseDescription.set('');
  }

  private parseDateString(dateStr: string): Date {
    return new Date(dateStr + 'T00:00:00');
  }

  async handleCreateCourse() {
    this.errorMessage.set(null);
    const form = this.newCourse();

    const start = new Date(form.start_date);
    const finish = new Date(form.finish_date);

    // Validaciones básicas
    if (!form.name || !form.category || !form.start_date || !form.finish_date) {
      this.errorMessage.set('Todos los campos son obligatorios.');
      return;
    }

    const startDateObj = this.parseDateString(form.start_date);
    const finishDateObj = this.parseDateString(form.finish_date);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);


    if (startDateObj.getTime() < today.getTime()) {
      this.errorMessage.set('La fecha de inicio no puede ser en el pasado.');
      return;
    }

    if (finishDateObj.getTime() <= startDateObj.getTime()) {
      this.errorMessage.set('La fecha de finalización debe ser posterior a la de inicio.');
      return;
    }

    const diffMs = finishDateObj.getTime() - startDateObj.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 7) {
      this.errorMessage.set(`La duración es muy corta (${diffDays} días). Mínimo 7 días.`);
      return;
    }

    if (diffDays > 30) {
      this.errorMessage.set(`La duración excede el límite (${diffDays} días). Máximo 30 días.`);
      return;
    }

    try {
      this.isLoading.set(true);

      const payload: CourseCreatePayload = {
        name: form.name,
        category: form.category,
        description: form.description,
        price: form.price,
        start_date: startDateObj, 
        finish_date: finishDateObj
      };

      const created = await this.courseService.createCourse(payload);

      this.myCourses.update(c => [created, ...c]);
      this.successMessage.set('Curso creado exitosamente.');
      
      setTimeout(() => this.toggleModal(), 1000);

    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al crear curso.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
