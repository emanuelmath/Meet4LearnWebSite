import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { CourseService, Course } from '../../services/course.service';

@Component({
  selector: 'app-panel-teacher',
  imports: [CommonModule, RouterModule],
  standalone: true,
  templateUrl: './panel-teacher.component.html',
  styleUrl: './panel-teacher.component.css'
})
export class PanelTeacherComponent implements OnInit {

  currentUser = signal<any>(null);
  userRole = signal<string>('');
  myCourses = signal<Course[]>([]);
  isCoursesDropdownOpen = signal(false);
  isLoading = signal(false);

  previewCourses = computed(() => this.myCourses());

  constructor(
    private router: Router,
    private authService: AuthService,
    private profileService: ProfileService,
    private courseService: CourseService
  ) {
    this.currentUser = this.authService.currentUser;
  }

  async ngOnInit() {
    await this.initData();
  }

  async initData() {
    this.isLoading.set(true);
    console.log('Iniciando carga de datos del panel...');

    try {
      const profile = await this.profileService.getOwnProfile();
      
      this.userRole.set(profile.role);

      if (profile.role.toLowerCase() === 'teacher') {
        await this.loadTeacherCourses();
      } else {
        console.warn('El rol no es de teacher.', profile.role);
      }

    } catch (e) {
      console.error('Error cargando datos iniciales:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadTeacherCourses() {
    try {
      const courses = await this.courseService.getMyCourses();
      
      if (courses && courses.length > 0) {
        this.myCourses.set(courses);
      }
    } catch (error) {
      console.error('Error cargando cursos:', error);
    }
  }

  toggleCoursesDropdown() {
    this.isCoursesDropdownOpen.update(v => !v);
  }

  goToCourse(id: number) {
    this.router.navigate(['/panel-teacher/course', id]);
  }

  async handleLogout() {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}