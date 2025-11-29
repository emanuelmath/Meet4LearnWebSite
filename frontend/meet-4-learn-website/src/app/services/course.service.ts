import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service'; 

export interface Course {
  id: number;
  name: string;
  subject: string;
  start_date: Date;
  finish_date: Date;
  price: number;
  teacherId: string;
  status: string;
}

export type CourseCreatePayload = Omit<Course, 'id' | 'teacherId' | 'status'>;

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  constructor( private supabaseService: SupabaseService, private authService: AuthService ) { }

  // Obtener todos los cursos.
  async getAllCourses() {
      const { data, error} = await this.supabaseService.client.from('course').select('*');
  
      if(error) throw error;
      return data as Course[];
  }

    async getMyCourses() {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabaseService.client
      .from('course') 
      .select('*')
      .eq('teacher_id', userId); 
    
    if (error) throw error;
    return data as Course[];
  }

  async createCourse(courseData: CourseCreatePayload) {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabaseService.client
      .rpc('rpc_create_course', { // Llamado a la función
        p_teacher_id: userId,
        p_name: courseData.name,
        p_subject: courseData.subject,
        p_start_date: courseData.start_date,
        p_finish_date: courseData.finish_date,
        p_price: courseData.price
      });

    if (error) throw error;
    // La función RPC devuelve el curso recién creado
    return data as Course;
  }
}
