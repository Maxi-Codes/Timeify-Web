import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { Api } from '../../api/api';
import { apiAuthLoginPost$Json, apiAuthRegisterCompanyPost } from '../../api/functions';
import { AuthResponseDto } from '../../api/models/auth-response-dto';
import { LoginDto } from '../../api/models/login-dto';
import { RegisterCompanyDto } from '../../api/models/register-company-dto';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'timeify_access_token';

interface JwtPayload {
  userId: string;
  companyId: string;
  exp: number;
  iss: string;
  aud: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(Api);
  private readonly router = inject(Router);

  login(credentials: LoginDto): Observable<void> {
    return this.api.invoke(apiAuthLoginPost$Json, { body: credentials }).pipe(
      tap((response) => {
        if (!response.token) {
          throw new Error('Kein Token erhalten');
        }
        this.persistSession(response.token);
      }),
      map(() => void 0),
    );
  }

  registerCompany(data: RegisterCompanyDto): Observable<void> {
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

  getJwtPayload(): JwtPayload | null {
    const token = this.getToken();
    return token ? jwtDecode<JwtPayload>(token) : null;
  }

  getUserId(): string | null {
    return this.getJwtPayload()?.userId ?? null;
  }

  getCompanyId(): string | null {
    return this.getJwtPayload()?.companyId ?? null;
  }

  getRole(): string | null {
    return (
      this.getJwtPayload()?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? null
    );
  }
}
