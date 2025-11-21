import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard.guard'; 
import { roleGuard } from './guards/role-guard.guard';
import { redirectGuard } from './guards/redirect-guard.guard';
import { HubComponent } from './pages/hub/hub.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardTeacherComponent } from './pages/dashboard-teacher/dashboard-teacher.component';
import { ProfileTeacherComponent } from './pages/profile-teacher/profile-teacher.component';
import { CoursesTeacherComponent } from './pages/courses-teacher/courses-teacher.component';
import { SelectedCourseTeacherComponent } from  './pages/selected-course-teacher/selected-course-teacher.component';
import { SubscriptionsTeacherComponent } from './pages/subscriptions-teacher/subscriptions-teacher.component';
import { CalendarTeacherComponent } from './pages/calendar-teacher/calendar-teacher.component';
import { CreateCourseTeacherComponent } from './pages/create-course-teacher/create-course-teacher.component';
import { CreateModuleTeacherComponent } from './pages/create-module-teacher/create-module-teacher.component';
import { AddCardTeacherComponent } from './pages/add-card-teacher/add-card-teacher.component';

export const routes: Routes = [
    { path: '', redirectTo: '/hub', pathMatch: 'full' },
    { path: 'hub', component: HubComponent, canActivate: [redirectGuard] },
    { path: 'login', component: LoginComponent, canActivate: [redirectGuard] },
    { path: 'register', component: RegisterComponent, canActivate: [redirectGuard]},
    { path: 'dashboard-teacher', 
        component: DashboardTeacherComponent, 
        canActivate:[authGuard, roleGuard],
        data: { role: 'teacher'},
        children: [
            { path: 'profile', component: ProfileTeacherComponent},
            { path: 'courses', component: CoursesTeacherComponent},
            { path: 'courses/:id', component: SelectedCourseTeacherComponent},
            { path: 'subscriptions', component: SubscriptionsTeacherComponent},
            { path: 'calendar', component: CalendarTeacherComponent},
            { path: 'create-course', component: CreateCourseTeacherComponent},
            { path: 'create-module', component: CreateModuleTeacherComponent },
            { path: 'add-card', component: AddCardTeacherComponent}
        ]
    },
    { path: '**', redirectTo: 'hub' }
];