import { Routes } from '@angular/router';
import { HubComponent } from './pages/hub/hub.component';
import { LoginComponent } from './pages/login/login.component';
import { TeacherApplicationsComponent } from './pages/teacher-applications/teacher-applications.component';

export const routes: Routes = [
    { path: '', redirectTo: 'hub', pathMatch: 'full' },
    { path: 'hub', component: HubComponent },
    { path: 'login', component: LoginComponent },
    { path: 'apply-teacher', component: TeacherApplicationsComponent}
];