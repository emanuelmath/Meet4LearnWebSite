import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { from, map } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);
  
  const expectedRole = route.data['role'];

  return from(authService.getUserRole()).pipe(
    map(role => {
      if (role === expectedRole) {
        return true;
      }
      return router.createUrlTree(['/hub']);
    })
  );
};
