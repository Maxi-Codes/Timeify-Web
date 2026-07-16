import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Api } from '../../api/api';
import {
  ApiAbsencesGet$Json$Params,
  apiAbsencesGet$Json,
  apiAbsencesIdDelete,
  apiAbsencesIdPut$Json,
  apiAbsencesIdStatusPatch$Json,
  apiAbsencesPost$Json,
  apiAbsencesUserUserIdGet$Json,
} from '../../api/functions';
import { Absence } from '../../api/models/absence';
import { AbsenceStatus } from '../../api/models/absence-status';
import { CreateAbsenceDto } from '../../api/models/create-absence-dto';
import { UpdateAbsenceDto } from '../../api/models/update-absence-dto';
import { unwrapArray } from '../utils/api-response.util';

@Injectable({ providedIn: 'root' })
export class AbsencesService {
  private readonly api = inject(Api);

  getAll(params?: ApiAbsencesGet$Json$Params): Observable<Absence[]> {
    return this.api
      .invoke(apiAbsencesGet$Json, params)
      .pipe(map((response) => unwrapArray<Absence>(response)));
  }

  getByUser(userId: string): Observable<Absence[]> {
    return this.api
      .invoke(apiAbsencesUserUserIdGet$Json, { userId })
      .pipe(map((response) => unwrapArray<Absence>(response)));
  }

  create(data: CreateAbsenceDto): Observable<Absence> {
    return this.api.invoke(apiAbsencesPost$Json, { body: data });
  }

  update(id: string, data: UpdateAbsenceDto): Observable<Absence> {
    return this.api.invoke(apiAbsencesIdPut$Json, { id, body: data });
  }

  updateStatus(id: string, status: AbsenceStatus): Observable<Absence> {
    return this.api.invoke(apiAbsencesIdStatusPatch$Json, {
      id,
      body: { status },
    });
  }

  delete(id: string): Observable<void> {
    return this.api.invoke(apiAbsencesIdDelete, { id });
  }
}
