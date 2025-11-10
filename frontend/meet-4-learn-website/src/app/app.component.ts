import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseService, Course } from './services/course.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  title = 'meet-4-learn-website';

  courses: Course[] = [];

  //Solo de prueba.
  constructor(private courseService: CourseService) { }

    ngOnInit(): void {
    this.getCourses();
  }

  async getCourses() {
    try {
      this.courses = await this.courseService.getAllCourses();
      console.log('Cursos cargados:', this.courses);
    } catch (error) {
      console.error('Error al cargar cursos.', error);
    }
  }
}
