import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Используем наш вычисляемый сигнал для проверки авторизации
  if (authService.isAuthenticated()) {
    return true; // Доступ разрешен
  }

  // Если пользователь не вошел, отправляем его на страницу логина
  router.navigate(['/login']);
  return false;
};
