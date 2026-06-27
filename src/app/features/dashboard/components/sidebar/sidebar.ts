import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

export interface SidebarNavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  readonly logoUrl = '/assets/logo-timeify.png';

  readonly mainNavItems: SidebarNavItem[] = [
    { label: 'Dashboard', icon: '🏠', route: '/dashboard' },
    { label: 'Zeiterfassung', icon: '📅', route: '/dashboard/zeiterfassung' },
    { label: 'Krankmeldungen', icon: '🤧', route: '/dashboard/krankmeldungen' },
    { label: 'Urlaubsanträge', icon: '🏝️', route: '/dashboard/urlaub'},
    { label: 'Projekte', icon: '📂', route: '/dashboard/projekte' },
    { label: 'Mitarbeiter', icon: '👷', route: '/dashboard/mitarbeiter' },
    { label: 'Auswertungen', icon: '📊', route: '/dashboard/auswertungen' },
    { label: 'Exporte', icon: '📤', route: '/dashboard/exporte' },
    { label: 'Benachrichtigungen', icon: '🔔', route: '/dashboard/benachrichtigungen' },
  ];

  readonly settingsItem: SidebarNavItem = {
    label: 'Einstellungen',
    icon: '⚙️',
    route: '/dashboard/einstellungen',
  };

  logout(): void {
    this.auth.logout();
  }
}
