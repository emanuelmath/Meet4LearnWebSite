import { Component } from '@angular/core';
import { Router } from '@angular/router'
import { AuthService } from '../../services/auth.service';
import { CourseService } from '../../services/course.service';

@Component({
  selector: 'app-dashboard-teacher',
  imports: [],
  templateUrl: './dashboard-teacher.component.html',
  styleUrl: './dashboard-teacher.component.css'
})
export class DashboardTeacherComponent {
  constructor(private authService: AuthService, private courseService: CourseService, private router: Router) {}

  async closeSession(): Promise<void> {
    await this.authService.signOut();
    await this.router.navigate(['/hub']);
  }

}
