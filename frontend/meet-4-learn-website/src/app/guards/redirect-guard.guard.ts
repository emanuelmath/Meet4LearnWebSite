import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { from, map } from 'rxjs';

export const redirectGuard: CanActivateFn = (route, state) => {
   const authService = inject(AuthService);
  const router = inject(Router);

  return from(authService.getUserRole()).pipe(
    map(role => {
      if (!role) return true; 

      if (role === 'teacher') {
        return router.createUrlTree(['/dashboard-teacher']);
      }

      if (role === 'admin') {
        return router.createUrlTree(['/hub']); //dashboard-admin
      }

      throw console.error(); // Si no se cumple ninguno, mejorar luego qué excepción lanzar.
    })
  );
};
