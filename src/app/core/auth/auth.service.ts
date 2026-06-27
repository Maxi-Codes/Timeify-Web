import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { Api } from '../../api/api';
import {
  apiAuthLoginPost,
  apiAuthRegisterCompanyPost,
} from '../../api/functions';
import { LoginDto } from '../../api/models/login-dto';
import { RegisterCompanyDto } from '../../api/models/register-company-dto';

const TOKEN_KEY = 'timeify_access_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(Api);
  private readonly router = inject(Router);

  login(credentials: LoginDto): Observable<void> {
    return this.api.invoke(apiAuthLoginPost, { body: credentials }).pipe(
      tap((response) => {
        if (!response.token) {
          throw new Error('Kein Token erhalten');
        }
        this.persistSession(response.token);
      }),
      map(() => void 0),
    );
  }

  registerCompany(data: RegisterCompanyDto): Observable<string> {
    return this.api.invoke(apiAuthRegisterCompanyPost, { body: data });
  }

  persistSession(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
