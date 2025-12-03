import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard.guard'; 
import { roleGuard } from './guards/role-guard.guard';
import { redirectGuard } from './guards/redirect-guard.guard';
import { HubComponent } from './pages/hub/hub.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { PanelTeacherComponent } from './layouts/panel-teacher/panel-teacher.component';
import { DashboardTeacherComponent } from './pages/dashboard-teacher/dashboard-teacher.component';
import { ProfileTeacherComponent } from './pages/profile-teacher/profile-teacher.component';
import { CoursesTeacherComponent } from './pages/courses-teacher/courses-teacher.component';
import { SelectedCourseTeacherComponent } from  './pages/selected-course-teacher/selected-course-teacher.component';
import { SubscriptionsTeacherComponent } from './pages/subscriptions-teacher/subscriptions-teacher.component';
import { CalendarTeacherComponent } from './pages/calendar-teacher/calendar-teacher.component';
import { VideoCallTeacherComponent } from './pages/video-call-teacher/video-call-teacher.component';
import { PanelAdminComponent } from './layouts/panel-admin/panel-admin.component';
import { AdminCourseManagementComponent } from './pages/admin-course-management/admin-course-management.component';
import { DashboardAdminComponent } from './pages/dashboard-admin/dashboard-admin.component';
import { AdminUserManagementComponent } from './pages/admin-user-management/admin-user-management.component';
import { AdminSubscriptionManagementComponent } from './pages/admin-subscription-management/admin-subscription-management.component';
import { AdminTransactionsManagementComponent } from './pages/admin-transactions-management/admin-transactions-management.component';
import { PlayStoreSimComponent } from './pages/play-store-sim/play-store-sim.component';

export const routes: Routes = [
    { path: '', redirectTo: '/hub', pathMatch: 'full' },
    { path: 'hub', component: HubComponent, canActivate: [redirectGuard] },
    { path: 'login', component: LoginComponent, canActivate: [redirectGuard] },
    { path: 'register', component: RegisterComponent, canActivate: [redirectGuard]},
    { path: 'play-store', component: PlayStoreSimComponent},
    { path: 'panel-teacher',
        component: PanelTeacherComponent, 
        canActivate:[authGuard, roleGuard],
        data: { role: 'teacher'},
        children: [
            { path: '', redirectTo: 'dashboard-teacher', pathMatch: 'full' },
            { path: 'dashboard-teacher', component: DashboardTeacherComponent},
            { path: 'profile', component: ProfileTeacherComponent},
            { path: 'courses', component: CoursesTeacherComponent},
            { path: 'course/:id', component: SelectedCourseTeacherComponent},
            { path: 'subscriptions', component: SubscriptionsTeacherComponent},
            { path: 'calendar', component: CalendarTeacherComponent},
            { path: 'video-call/:moduleId', component: VideoCallTeacherComponent }
        ]
    },
    { path: 'panel-admin',
        component: PanelAdminComponent,
        canActivate:[authGuard, roleGuard],
        data: {role: 'admin'},
        children:[
            { path: '', redirectTo: 'dashboard-admin', pathMatch: 'full'},
            { path: 'dashboard-admin', component: DashboardAdminComponent},
            { path: 'course-management', component: AdminCourseManagementComponent},
            { path: 'user-management', component: AdminUserManagementComponent},
            { path: 'subscription-management', component: AdminSubscriptionManagementComponent},
            { path: 'transaction-management', component: AdminTransactionsManagementComponent}
        ]

    },
    { path: '**', redirectTo: 'hub' }
];