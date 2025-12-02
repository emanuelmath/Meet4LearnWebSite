import { Component, inject, signal, OnInit, computed } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; 
import { AuthService } from '../../services/auth.service';
import { ProfileService, Profile } from '../../services/profile.service';
import { AdminService, CourseStatus } from '../../services/admin.service'; 

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, RouterLink], 
  templateUrl: './dashboard-admin.component.html',
  styleUrls: ['./dashboard-admin.component.css']
})
export class DashboardAdminComponent implements OnInit { 

  private profileService = inject(ProfileService);
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  myProfile = signal<Profile | null>(null);

  allCourses = signal<any[]>([]); 
  allUsers = signal<Profile[]>([]); 

  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  isLoading = signal(false);

  stats = computed(() => {
    const users = this.allUsers();
    const courses = this.allCourses();
    return {
      totalCourses: courses.length,
      pendingCourses: courses.filter(c => c.status === 'en_revision').length,
      totalTeachers: users.filter(u => u.role === 'teacher').length,
      totalStudents: users.filter(u => u.role === 'student').length
    };
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.clearMessages();
    this.isLoading.set(true);
    try {
      const profile = await this.profileService.getOwnProfile();
      this.myProfile.set(profile);

      const courses = await this.adminService.getAllCoursesForAdmin();
      this.allCourses.set(courses);

      const users = await this.adminService.getAllUsers();
      this.allUsers.set(users);

    } catch (error: any) {
      this.errorMessage.set(error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleChangeStatus(courseId: number, newStatus: string) { 
    this.clearMessages();
    
    if (!confirm(`¿Confirmas cambiar el estado del curso a "${newStatus.toUpperCase()}"?`)) return;

    try {
      await this.adminService.setCourseStatus(courseId, newStatus as CourseStatus);
      
      this.successMessage.set(`Estado actualizado a: ${newStatus.toUpperCase()}`);

      const courses = await this.adminService.getAllCoursesForAdmin();
      this.allCourses.set(courses);

    } catch (error: any) {
      this.errorMessage.set('Error al actualizar: ' + error.message);
    }
  }
  
  private clearMessages() {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }
}