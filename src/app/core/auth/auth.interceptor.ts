import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

const PUBLIC_AUTH_PATHS = [
  '/api/auth/login',
  '/api/auth/register-company',
  '/api/auth/register-user',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  const isOwnApi = req.url.startsWith(environment.apiUrl);

  if (
    !token ||
    !isOwnApi ||
    PUBLIC_AUTH_PATHS.some((path) => req.url.includes(path))
  ) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};
