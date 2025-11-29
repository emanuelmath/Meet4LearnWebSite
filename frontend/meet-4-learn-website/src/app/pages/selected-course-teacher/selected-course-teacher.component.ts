import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router'; 
import { Course, CourseService, Module } from '../../services/course.service';

@Component({
  selector: 'app-selected-course-teacher',
  imports: [CommonModule, FormsModule, RouterLink],
  standalone: true,
  templateUrl: './selected-course-teacher.component.html',
  styleUrl: './selected-course-teacher.component.css'
})
export class SelectedCourseTeacherComponent implements OnInit {

  constructor(private route: ActivatedRoute, private courseService: CourseService ) {}

  private courseId = signal(0);

  course = signal<Course | null>(null);
  modules = signal<Module[]>([]);
  
  isLoading = signal(false);
  isModalOpen = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  newModule = signal({
    title: '',
    description: '',
    scheduled_at: ''
  });

  ngOnInit() {
    const idFromUrl = this.route.snapshot.paramMap.get('id');
    if (idFromUrl) {
      const id = +idFromUrl;
      this.courseId.set(id);
      this.loadCourseDetails();
      this.loadModules();
    }
  }

  async loadCourseDetails() {
    try {
      const data = await this.courseService.getCourseById(this.courseId());
      this.course.set(data);
    } catch (error: any) { this.errorMessage.set(error.message); }
  }

  async loadModules() {
    try {
      const data = await this.courseService.getModulesForCourse(this.courseId());
      this.modules.set(data);
    } catch (error: any) { this.errorMessage.set(error.message); }
  }

  // --- MODAL ---
  toggleModal() {
    this.isModalOpen.update(v => !v);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    
    if (!this.isModalOpen()) {
        this.newModule.set({ title: '', description: '', scheduled_at: '' });
    }
  }

  async handleCreateModule() {
    this.errorMessage.set(null);
    const form = this.newModule();

    if(!form.title || !form.description || !form.scheduled_at) {
        this.errorMessage.set('Todos los campos son obligatorios');
        return;
    }

    try {
      this.isLoading.set(true);
      const payload = {
        courseId: this.courseId(),
        title: form.title,
        description: form.description,
        scheduled_at: new Date(form.scheduled_at).toISOString()
      };

      const created = await this.courseService.createModule(payload);
      
      this.modules.update(m => [...m, created]);
      this.successMessage.set('Módulo añadido correctamente.');
      this.toggleModal();

    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al crear módulo');
    } finally {
        this.isLoading.set(false);
    }
  }
}
