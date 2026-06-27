import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProjectsService } from './projects.service';
import { UsersService } from './users.service';
import { unwrapArray } from '../utils/api-response.util';

interface TimeEntryDto {
  id: string;
  date: string;
  minutesWorked: number;
  breakMinutes: number;
  comment?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly projects = inject(ProjectsService);
  private readonly users = inject(UsersService);

  getStats(): Observable<{
    activeProjects: number;
    activeEmployees: number;
    todayMinutes: number;
  }> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const today = now.toISOString().slice(0, 10);

    return forkJoin({
      projects: this.projects.getAll(),
      users: this.users.getAll(),
      timeEntries: this.http
        .get<unknown>(`${environment.apiUrl}/api/timeentries/${year}/${month}`)
        .pipe(map((response) => unwrapArray<TimeEntryDto>(response))),
    }).pipe(
      map(({ projects, users, timeEntries }) => ({
        activeProjects: projects.filter((p) => p.isActive !== false).length,
        activeEmployees: users.length,
        todayMinutes: timeEntries
          .filter((entry) => entry.date?.slice(0, 10) === today)
          .reduce((sum, entry) => sum + (entry.minutesWorked ?? 0), 0),
      })),
    );
  }
}
