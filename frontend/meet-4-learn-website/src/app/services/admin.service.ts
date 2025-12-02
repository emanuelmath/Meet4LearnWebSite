import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Course } from './course.service';
import { Profile } from './profile.service'; 

export type CourseStatus = 'activo' | 'en_revision' | 'finalizado' | 'baneado';

export interface CreateUserPayload {
    email: string, 
    password: string, 
    fullName: string, 
    role: string, 
    DUI?: string 
}

export interface Transaction {
  id: number;
  amount: number;
  itemType: 'course' | 'plan' | 'recharge';
  itemId: string;
  profile?: {
    full_name: string;
    DUI: string | null;
  };
}

export interface UserWithEmail extends Profile {
  email: string;
  last_sign_in_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private supabaseService = inject(SupabaseService);

  async getAllUsers() {
    const { data, error } = await this.supabaseService.client
      .rpc('get_users_with_email'); 
    
    if (error) throw error;
    return data as UserWithEmail[];
  }

  async getAllCoursesForAdmin() {
    const { data, error } = await this.supabaseService.client
      .from('course')
      .select(`
        *,
        profile:teacher_id ( full_name )
      `)
      .order('id', { ascending: false }); 

    if (error) throw error;
    return data; 
  }

  async setCourseStatus(courseId: number, newStatus: CourseStatus) {
    const { data, error } = await this.supabaseService.client
      .from('course')
      .update({ status: newStatus })
      .eq('id', courseId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Course;
  }

  async createManualUser(payload: CreateUserPayload) {
    const { data, error } = await this.supabaseService.client.functions.invoke(
      'crear-usuario-admin',
      {
        body: payload
      }
    );

    if (error) throw error;
    return data;
  }

  async getAllTransactions() {
    const { data, error } = await this.supabaseService.client
      .from('transactions')
      .select(`
        *,
        profile:userId ( full_name, "DUI" )
      `)
      .order('id', { ascending: false }); 

    if (error) throw error;
    return data as any[]; 
  }
  
async deleteUser(userIdToDelete: string) {
  const { error } = await this.supabaseService.client
    .rpc('delete_user_by_admin', { 
      target_user_id: userIdToDelete 
    });

  if (error) throw error;
}
}