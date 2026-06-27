import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DashboardPlaceholder } from '../dashboard-placeholder/dashboard-placeholder';

@Component({
  selector: 'app-dashboard-section',
  standalone: true,
  imports: [DashboardPlaceholder],
  template: `
    <app-dashboard-placeholder [title]="title" [icon]="icon" />
  `,
})
export class DashboardSection {
  private readonly route = inject(ActivatedRoute);

  readonly title = this.route.snapshot.data['title'] as string;
  readonly icon = this.route.snapshot.data['icon'] as string;
}
