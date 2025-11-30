import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CourseService } from '../../services/course.service';

interface CalendarEvent {
  id: string | number;
  title: string;
  date: Date;
  type: 'start' | 'end' | 'module';
  courseName?: string;
  status?: string;
  isFinished?: boolean;
}

@Component({
  selector: 'app-calendar-teacher',
  imports: [CommonModule, FormsModule, DatePipe],
  standalone: true,
  templateUrl: './calendar-teacher.component.html',
  styleUrl: './calendar-teacher.component.css'
})
export class CalendarTeacherComponent implements OnInit {

  constructor(private courseService: CourseService) {}

  currentDate = signal<Date>(new Date());
  weekDays = signal<Date[]>([]);
  
  rawData = signal<any[]>([]);
  loading = signal<boolean>(true);

  filterStatus = signal<string>('active'); 
  searchTerm = signal<string>('');
  
  highlightedEventId = signal<string | null>(null);

  events = computed(() => {
    const list: CalendarEvent[] = [];
    let courses = this.rawData();
    const statusFilter = this.filterStatus();

    courses = courses.filter(c => {
      if (c.status === 'baneado') return false;

      const endDate = c.finish_date ? new Date(c.finish_date + 'T00:00:00') : new Date();
      const datePassed = endDate < new Date(new Date().setHours(0,0,0,0));
      const isFinished = c.status === 'finalizado' || datePassed;

      if (statusFilter === 'active' && isFinished) return false;
      if (statusFilter === 'finished' && !isFinished) return false;

      return true;
    });

    courses.forEach(course => {
      const endDate = course.finish_date ? new Date(course.finish_date + 'T00:00:00') : new Date();
      const courseIsFinished = course.status === 'finalizado' || endDate < new Date(new Date().setHours(0,0,0,0));

      if (course.start_date) {
        list.push({
          id: `start-${course.id}`,
          title: `INICIO: ${course.name}`,
          date: new Date(course.start_date + 'T00:00:00'),
          type: 'start',
          courseName: course.name,
          isFinished: courseIsFinished
        });
      }

      if (course.finish_date) {
        list.push({
          id: `end-${course.id}`,
          title: `FINAL: ${course.name}`,
          date: new Date(course.finish_date + 'T00:00:00'),
          type: 'end',
          courseName: course.name,
          isFinished: courseIsFinished
        });
      }

      if (course.modules && Array.isArray(course.modules)) {
        course.modules.forEach((mod: any) => {
          if (mod.scheduled_at) {
            list.push({
              id: `mod-${mod.id}`,
              title: mod.title,
              date: new Date(mod.scheduled_at),
              type: 'module',
              courseName: course.name,
              isFinished: courseIsFinished
            });
          }
        });
      }
    });

    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  });

  ngOnInit() {
    this.generateWeek();
    this.loadData();
  }

  async loadData() {
    try {
      this.loading.set(true);
      const data = await this.courseService.getCoursesWithModules();
      this.rawData.set(data || []);
    } catch (error) {
      console.error('Error cargando calendario docente:', error);
    } finally {
      this.loading.set(false);
    }
  }

  searchAndJump() {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      this.highlightedEventId.set(null);
      return;
    }

    const allEvents = this.events(); 
    
    const match = allEvents.find(e => 
      e.title.toLowerCase().includes(term) || 
      (e.courseName && e.courseName.toLowerCase().includes(term))
    );

    if (match) {
      this.currentDate.set(new Date(match.date));
      this.generateWeek();

      this.highlightedEventId.set(match.id.toString());
      
      setTimeout(() => this.highlightedEventId.set(null), 3000);
    } else {
      alert('No se encontraron coincidencias en los cursos visibles.');
    }
  }

  shouldLookDisabled(event: CalendarEvent): boolean {
    if (event.isFinished) return true;

    if (event.type === 'start') return false;

    return this.isPastDate(event.date);
  }

  isPastDate(date: Date): boolean {
    const today = new Date();
    return date.getTime() < today.getTime();
  }

  isHighlighted(eventId: string | number): boolean {
    return this.highlightedEventId() === eventId.toString();
  }

  generateWeek() {
    const pivot = new Date(this.currentDate());
    const dayOfWeek = pivot.getDay(); 
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(pivot);
    monday.setDate(pivot.getDate() + diffToMonday);

    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      week.push(day);
    }
    this.weekDays.set(week);
  }

  changeWeek(offset: number) {
    const newDate = new Date(this.currentDate());
    newDate.setDate(newDate.getDate() + (offset * 7));
    this.currentDate.set(newDate);
    this.generateWeek();
  }

  resetToToday() {
    this.currentDate.set(new Date());
    this.generateWeek();
  }

  getEventsForDay(day: Date) {
    return this.events().filter(e => 
      e.date.getDate() === day.getDate() &&
      e.date.getMonth() === day.getMonth() &&
      e.date.getFullYear() === day.getFullYear()
    );
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
}