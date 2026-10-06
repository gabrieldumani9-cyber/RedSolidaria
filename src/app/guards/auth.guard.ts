import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const authSvc = inject(AuthService);
  const router = inject(Router);
  await authSvc.waitForSession();
  if (authSvc.isLoggedIn()) return true;
  return router.createUrlTree(['/login']);
};
