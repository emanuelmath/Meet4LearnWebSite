import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, CreateUserPayload } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { Profile } from '../../services/profile.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-user-management.component.html',
  styleUrls: ['./admin-user-management.component.css']
})
export class AdminUserManagementComponent implements OnInit {

  private adminService = inject(AdminService);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;

  users = signal<any[]>([]); 
  filteredUsers = signal<any[]>([]); 

  searchTerm = signal('');
  roleFilter = signal('');
  
  newUser = signal<CreateUserPayload>({
    email: '',
    password: '',
    fullName: '',
    role: 'student',
    DUI: ''
  });

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  isCreateModalOpen = signal(false); 
  modalErrorMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadUsers();
  }

  async loadUsers() {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    try {
      // Se asume que adminService.getAllUsers() ahora llama al RPC que devuelve el email
      const data = await this.adminService.getAllUsers();
      this.users.set(data);
      this.applyFilters();
    } catch (error: any) {
      this.errorMessage.set('Error al cargar usuarios: ' + error.message);
    } finally {
      this.isLoading.set(false);
    }
  }

  applyFilters() {
    const search = this.searchTerm().toLowerCase();
    const role = this.roleFilter();

    const filtered = this.users().filter(user => {
      // CAMBIO 2: Agregamos la búsqueda por correo electrónico
      const matchesSearch = (user.full_name || '').toLowerCase().includes(search) || 
                            (user.email || '').toLowerCase().includes(search) || // <--- NUEVO
                            (user.DUI || '').toLowerCase().includes(search) ||
                            (user.id || '').toLowerCase().includes(search);
                            
      const matchesRole = role ? user.role === role : true;
      
      return matchesSearch && matchesRole;
    });

    this.filteredUsers.set(filtered);
  }

  toggleCreateModal() {
    this.isCreateModalOpen.update(v => !v);
    this.modalErrorMessage.set(null);
    
    if (!this.isCreateModalOpen()) {
      this.newUser.set({ email: '', password: '', fullName: '', role: 'student', DUI: '' });
    }
  }

  async handleCreateUser() {
    this.modalErrorMessage.set(null);
    this.successMessage.set(null);
    
    const form = this.newUser();

    if (!form.email || !form.password || !form.fullName) {
        this.modalErrorMessage.set('Completa los campos obligatorios.');
        return;
    }
    if (form.role === 'teacher' && !form.DUI) {
        this.modalErrorMessage.set('El DUI es obligatorio para docentes.');
        return;
    }

    try {
      this.isLoading.set(true);
      
      await this.adminService.createManualUser(form);
      
      this.successMessage.set(`Usuario ${form.fullName} creado correctamente.`);
      this.toggleCreateModal();
      await this.loadUsers();

    } catch (error: any) {
      this.modalErrorMessage.set(error.message || 'Error al crear usuario.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async handleDeleteUser(user: Profile) {
    if (!confirm(`ADVERTENCIA CRÍTICA:\n\nEstás a punto de eliminar al usuario "${user.full_name}".\n\nAl hacer esto, se borrará SU PERFIL, SUS CURSOS, SUS MENSAJES y TODO su historial debido a la eliminación en cascada.\n\n¿Estás absolutamente seguro?`)) {
      return;
    }

    try {
      this.isLoading.set(true);

      if (user.id) {
          await this.adminService.deleteUser(user.id);
      } else {
          throw new Error("ID de usuario no válido");
      }

      this.successMessage.set(`Usuario ${user.full_name} eliminado correctamente.`);
      
      this.users.update(current => current.filter(u => u.id !== user.id));
      this.applyFilters();

    } catch (error: any) {
      console.error(error);
      this.errorMessage.set('Error al eliminar: ' + error.message);
    } finally {
      this.isLoading.set(false);
    }
  }
}