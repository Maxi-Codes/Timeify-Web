import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { UsersService } from '../../../../core/services/users.service';
import { User } from '../../../../api/models/user';

@Component({
  selector: 'app-dashboard-overview',
  standalone: true,
  templateUrl: './dashboard-overview.html',
})
export class DashboardOverview implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly usersService = inject(UsersService);

  readonly currentUser = signal<User | null>(null);
  readonly stats = signal({
    activeProjects: 0,
    activeEmployees: 0,
    todayMinutes: 0,
  });
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.usersService.getCurrentUser().subscribe({
      next: (user) => this.currentUser.set(user),
    });

    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  formatMinutes(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} Min.`;
    if (mins === 0) return `${hours} Std.`;
    return `${hours} Std. ${mins} Min.`;
  }

  userName(): string {
    const user = this.currentUser();
    if (!user) return '';
    return user.firstName?.trim() || user.email || '';
  }
}
