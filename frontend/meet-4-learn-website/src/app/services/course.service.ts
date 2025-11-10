import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

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


@Injectable({
  providedIn: 'root'
})
export class CourseService {

  constructor( private supabaseService: SupabaseService ) { }

  // Obtener todos los cursos.
  async getAllCourses() {
      const { data, error} = await this.supabaseService.client.from('course').select('*');
  
      if(error) throw error;
      return data as Course[];
  }
}
