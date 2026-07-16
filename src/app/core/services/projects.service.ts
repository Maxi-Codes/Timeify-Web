import { Injectable, inject } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';
import { Api } from '../../api/api';
import {
  apiProjectsGet$Json,
  apiProjectsIdDelete,
  apiProjectsIdPut$Json,
  apiProjectsIdStatusPatch$Json,
  apiProjectsPost$Json,
  getProjectById$Json,
} from '../../api/functions';
import { CreateProjectDto } from '../../api/models/create-project-dto';
import { Project } from '../../api/models/project';
import { UpdateProjectDto } from '../../api/models/update-project-dto';
import { AuthService } from '../auth/auth.service';
import { unwrapArray } from '../utils/api-response.util';

export type UpdateProjectPayload = UpdateProjectDto & { isActive?: boolean };

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private readonly api = inject(Api);
  private readonly auth = inject(AuthService);

  getAll(): Observable<Project[]> {
    const companyId = this.auth.getCompanyId();
    return this.api
      .invoke(apiProjectsGet$Json, {
        companyId: companyId ?? undefined,
      })
      .pipe(map((response) => unwrapArray<Project>(response)));
  }

  getById(id: string): Observable<Project> {
    return this.api.invoke(getProjectById$Json, { id });
  }

  create(data: CreateProjectDto): Observable<Project> {
    return this.api.invoke(apiProjectsPost$Json, { body: data });
  }

  update(id: string, data: UpdateProjectPayload): Observable<Project> {
    const { isActive, ...project } = data;
    const update$ = this.api.invoke(apiProjectsIdPut$Json, {
      id,
      body: project,
    });

    return isActive === undefined
      ? update$
      : update$.pipe(
          switchMap(() =>
            this.api.invoke(apiProjectsIdStatusPatch$Json, {
              id,
              body: { isActive },
            }),
          ),
        );
  }

  delete(id: string): Observable<void> {
    return this.api.invoke(apiProjectsIdDelete, { id });
  }
}
