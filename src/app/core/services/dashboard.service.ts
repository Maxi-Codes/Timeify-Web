import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ProjectsService } from './projects.service';
import { TimeEntriesService } from './time-entries.service';
import { UsersService } from './users.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly projects = inject(ProjectsService);
  private readonly timeEntries = inject(TimeEntriesService);
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
      timeEntries: this.timeEntries.getCompanyMonth(year, month),
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
