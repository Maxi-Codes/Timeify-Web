import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Api } from '../../api/api';
import { apiTimeEntriesGet$Json, apiTimeEntriesIdPut$Json } from '../../api/functions';
import { TimeEntry } from '../../api/models/time-entry';
import { TimeEntryDetail, UpdateTimeEntryPayload } from '../models/time-entry-detail.model';
import { unwrapArray } from '../utils/api-response.util';

@Injectable({ providedIn: 'root' })
export class TimeEntriesService {
  private readonly api = inject(Api);

  getCompanyMonth(year: number, month: number): Observable<TimeEntryDetail[]> {
    const from = `${year}-${String(month).padStart(2, '0')}-01`;
    const to = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;

    return this.getRange(from, to);
  }

  getRange(from: string, to: string, userId?: string): Observable<TimeEntryDetail[]> {
    return this.api
      .invoke(apiTimeEntriesGet$Json, { from, to, userId })
      .pipe(
        map((response) => unwrapArray<TimeEntry>(response).map((entry) => this.mapEntry(entry))),
      );
  }

  update(id: string, payload: UpdateTimeEntryPayload): Observable<void> {
    return this.api.invoke(apiTimeEntriesIdPut$Json, { id, body: payload }).pipe(map(() => void 0));
  }

  private mapEntry(raw: TimeEntry): TimeEntryDetail {
    const firstName = raw.user?.firstName ?? '';
    const lastName = raw.user?.lastName ?? '';
    return {
      id: raw.id ?? '',
      userId: raw.userId ?? raw.user?.id ?? '',
      userName: `${firstName} ${lastName}`.trim() || 'Unbekannt',
      projectId: raw.projectId ?? raw.project?.id ?? '',
      projectName: raw.project?.name ?? 'Unbekannt',
      date: raw.date ?? '',
      minutesWorked: raw.minutesWorked ?? 0,
      breakMinutes: raw.breakMinutes ?? 0,
      comment: raw.comment,
    };
  }
}
