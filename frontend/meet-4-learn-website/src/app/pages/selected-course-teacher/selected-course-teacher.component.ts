import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router'; 
import { Course, CourseService, Module } from '../../services/course.service';

@Component({
  selector: 'app-selected-course-teacher',
  imports: [CommonModule, FormsModule, RouterLink],
  standalone: true,
  templateUrl: './selected-course-teacher.component.html',
  styleUrl: './selected-course-teacher.component.css'
})
export class SelectedCourseTeacherComponent implements OnInit {

  constructor(private route: ActivatedRoute, private courseService: CourseService, private router: Router ) {}

private courseId = signal(0);

  course = signal<Course | null>(null);
  modules = signal<Module[]>([]);
  
  isLoading = signal(false);
  isModalOpen = signal(false);     
  isLiveModalOpen = signal(false); 

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
      this.loadData();
    }
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const data = await this.courseService.getCourseById(this.courseId());
      if (!data) {
        this.router.navigate(['/panel-teacher/courses']);
        return;
      }
      this.course.set(data);

      const modulesData = await this.courseService.getModulesForCourse(this.courseId());
      
      const sorted = modulesData.sort((a, b) => 
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      );
      this.modules.set(sorted);

    } catch (error: any) {
      this.errorMessage.set(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

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
      this.errorMessage.set(error.message || 'Error al crear módulo.');
    } finally {
        this.isLoading.set(false);
    }
  }

  toggleLiveModal() {
    this.isLiveModalOpen.update(v => !v);
  }

  canJoinClass(mod: Module): { canJoin: boolean, message: string } {
    
    if ((mod as any).status === "'finalizado'") {
        return { canJoin: false, message: 'FINALIZADA' };
    }

    const now = new Date().getTime();
    const classTime = new Date(mod.scheduled_at).getTime();
    const diff = classTime - now; 
    
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const CLASS_DURATION_MS = 2 * 60 * 60 * 1000; // 2 horas límite

    if (diff > TEN_MINUTES_MS) {
      return { canJoin: false, message: 'MUY PRONTO' };
    }
    
    if (diff < -CLASS_DURATION_MS) {
      return { canJoin: false, message: 'EXPIRADA' };
    }

    return { canJoin: true, message: 'ENTRAR AHORA' };
  }

  navigateToCall(moduleId: number) {
    const exists = this.modules().find(m => m.id === moduleId);
    if (exists) {
      this.router.navigate(['/panel-teacher/video-call', moduleId]);
    } else {
      alert('Error: Módulo no válido.');
    }
  }
}