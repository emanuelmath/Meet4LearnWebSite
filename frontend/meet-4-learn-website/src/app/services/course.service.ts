import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service'; 

export interface Course {
  id: number;
  name: string;
  category: string;
  description: string;
  start_date: Date;
  finish_date: Date;
  price: number;
  teacherId: string;
  status: string;
}

export interface Module {
  id: number;
  courseId: number;
  title: string;
  scheduled_at: string;
  description: string;
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
        p_description: courseData.description,
        p_category: courseData.category,
        p_start_date: courseData.start_date,
        p_finish_date: courseData.finish_date,
        p_price: courseData.price
      });

    if (error) throw error;
    // La función RPC devuelve el curso recién creado
    return data as Course;
  }
   async getCourseById(courseId: number) {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabaseService.client
      .from('course') 
      .select('*')
      .eq('id', courseId)
      .eq('teacher_id', userId) 
      .single();
    
    if (error) throw error;
    return data as Course;
  }

  async getModulesForCourse(courseId: number) {
    const { data, error } = await this.supabaseService.client
      .from('modules')
      .select('*')
      .eq('courseId', courseId)
      .order('scheduled_at', { ascending: true }); 
    if (error) throw error;
    return data as Module[];
  }

  async createModule(moduleData: Omit<Module, 'id'>) {
    const { data, error } = await this.supabaseService.client
      .from('modules')
      .insert([moduleData])
      .select()
      .single();
    
    if (error) throw error;
    return data as Module;
  }
}
