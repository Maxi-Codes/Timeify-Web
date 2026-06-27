import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project } from '../../api/models/project';
import { unwrapArray } from '../utils/api-response.util';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly baseUrl = `${environment.apiUrl}/api/projects`;

  getAll(): Observable<Project[]> {
    const companyId = this.auth.getCompanyId();

    return this.http.get<unknown>(this.baseUrl).pipe(
      map((response) =>
        unwrapArray<Project>(response).filter(
          (project) => !companyId || project.companyId === companyId,
        ),
      ),
    );
  }

  create(project: Project): Observable<Project> {
    return this.http.post<Project>(this.baseUrl, project);
  }

  update(id: string, project: Project): Observable<Project> {
    return this.http.put<Project>(`${this.baseUrl}/${id}`, project);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
