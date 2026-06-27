import { Component, input } from '@angular/core';

@Component({
  selector: 'app-dashboard-placeholder',
  standalone: true,
  templateUrl: './dashboard-placeholder.html',
})
export class DashboardPlaceholder {
  title = input.required<string>();
  icon = input.required<string>();
}
