import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service'; 

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const { data } = await authService.getSession();

  if (data.session) {
    return true;
  } else {
    console.log('AuthGuard: Usuario no autenticado. Redirigiendo a /login...');
    const loginUrl: UrlTree = router.createUrlTree(['/login']);
    return loginUrl;
  }
};
 