import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const authGuard = (reqAuth: boolean = true): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.validateToken().pipe(
      map(isValid => {
        // Ako zahteva autentifikaciju (reqAuth: true)
        if (reqAuth) {
          if (isValid) {
            return true; // Token validan, dozvoli pristup
          } else {
            router.navigate(['/login']);
            return false; // Token invalidan, redirektuj na login
          }
        }
        // Ako NE zahteva autentifikaciju (reqAuth: false) - za login/register stranice
        else {
          if (isValid) {
            router.navigate(['/dashboard']); // Već ulogovan, redirektuj na dashboard
            return false;
          } else {
            return true; // Nije ulogovan, dozvoli pristup login/register
          }
        }
      })
    );
  };
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.validateToken().pipe(
      map(isValid => {
        if (isValid && authService.hasAnyRole(allowedRoles)) {
          return true; // Token validan i ima odgovarajuću ulogu
        }
        router.navigate(['/login']);
        return false; // Token invalidan ili nema odgovarajuću ulogu
      })
    );
  };
};




