import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Api } from '../../api/api';
import { apiAuthRegisterUserPost } from '../../api/functions';
import { RegisterUserDto } from '../../api/models/register-user-dto';
import { Role } from '../../api/models/role';
import { User } from '../../api/models/user';
import { unwrapArray } from '../utils/api-response.util';
import { AuthService } from '../auth/auth.service';

export interface UpdateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  password?: string;
}

export const ROLE_LABELS: Record<number, string> = {
  0: 'Platform Admin',
  1: 'Unternehmensinhaber',
  2: 'Manager',
  3: 'Mitarbeiter',
};

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(Api);
  private readonly auth = inject(AuthService);

  private readonly baseUrl = `${environment.apiUrl}/api/users`;

  getAll(): Observable<User[]> {
    const companyId = this.auth.getCompanyId();

    return this.http
      .get<unknown>(this.baseUrl)
      .pipe(
        map((response) =>
          unwrapArray<User>(response).filter((user) => !companyId || user.companyId === companyId),
        ),
      );
  }

  getById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  getCurrentUser(): Observable<User> {
    const userId = this.auth.getUserId();
    if (!userId) {
      throw new Error('Nicht angemeldet');
    }
    return this.getById(userId);
  }

  create(data: RegisterUserDto): Observable<void> {
    return this.api.invoke(apiAuthRegisterUserPost, { body: data });
  }

  update(id: string, data: UpdateUserDto): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
