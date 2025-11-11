import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class TeacherApplicationsService {

  constructor( private supabaseService: SupabaseService ) { }

  async submitTeacherApplication(fullName: string, email: string, details: string) {
    const { data, error } = await this.supabaseService.client
      .from('teacher_applications')
      .insert([
        { 
          fullName: fullName, 
          personalEmail: email, 
          details: details 
        }
      ]);
    
    if (error) throw error;
    return data;
  }

}
