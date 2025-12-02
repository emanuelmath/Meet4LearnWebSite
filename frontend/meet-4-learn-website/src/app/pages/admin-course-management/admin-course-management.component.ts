import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, CourseStatus } from '../../services/admin.service';
import { Profile } from '../../services/profile.service';

@Component({
  selector: 'app-admin-course-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-course-management.component.html',
  styleUrls: ['./admin-course-management.component.css']
})
export class AdminCourseManagementComponent implements OnInit {

  private adminService = inject(AdminService);

  allCourses = signal<any[]>([]);
  teachers = signal<Profile[]>([]);

  selectedTeacher = signal('');
  selectedStatus = signal('');

  filteredCourses = computed(() => {
    const courses = this.allCourses();
    const teacherId = this.selectedTeacher();
    const status = this.selectedStatus();

    return courses.filter(course => {
      const matchTeacher = teacherId ? course.teacher_id === teacherId : true;
      const matchStatus = status ? course.status === status : true;
      return matchTeacher && matchStatus;
    });
  });
  
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {

      const coursesData = await this.adminService.getAllCoursesForAdmin();
      this.allCourses.set(coursesData);

      const usersData = await this.adminService.getAllUsers();
      const teacherList = usersData.filter(u => u.role === 'teacher');
      this.teachers.set(teacherList);

    } catch (error: any) {
      this.errorMessage.set('Error al cargar datos: ' + error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleChangeStatus(courseId: number, newStatus: string) {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    if (!confirm(`¿Confirmas cambiar el estado del curso a "${newStatus.toUpperCase()}"?`)) return;

    try {
      await this.adminService.setCourseStatus(courseId, newStatus as CourseStatus);
      
      this.successMessage.set(`Curso actualizado a: ${newStatus.toUpperCase()}`);
      
      this.allCourses.update(courses => 
        courses.map(c => c.id === courseId ? { ...c, status: newStatus } : c)
      );

    } catch (error: any) {
      this.errorMessage.set('Error al actualizar: ' + error.message);
    }
  }
}