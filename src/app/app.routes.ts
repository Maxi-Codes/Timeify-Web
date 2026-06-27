import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing').then((m) => m.Landing),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/register/register').then((m) => m.Register),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/register/steps/register-account').then(
            (m) => m.RegisterAccountStep,
          ),
      },
      {
        path: 'company',
        loadComponent: () =>
          import('./features/register/steps/register-company').then(
            (m) => m.RegisterCompanyStep,
          ),
      },
      {
        path: 'payment',
        loadComponent: () =>
          import('./features/register/steps/register-payment').then(
            (m) => m.RegisterPaymentStep,
          ),
      },
    ],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/layout/dashboard-layout').then(
        (m) => m.DashboardLayout,
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-overview/dashboard-overview').then(
            (m) => m.DashboardOverview,
          ),
      },
      {
        path: 'zeiterfassung',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-section/dashboard-section').then(
            (m) => m.DashboardSection,
          ),
        data: { title: 'Zeiterfassung', icon: '📅' },
      },
      {
        path: 'projekte',
        loadComponent: () =>
          import('./features/dashboard/pages/projects/projects').then(
            (m) => m.ProjectsPage,
          ),
      },
      {
        path: 'mitarbeiter',
        loadComponent: () =>
          import('./features/dashboard/pages/employees/employees').then(
            (m) => m.EmployeesPage,
          ),
      },
      {
        path: 'auswertungen',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-section/dashboard-section').then(
            (m) => m.DashboardSection,
          ),
        data: { title: 'Auswertungen', icon: '📊' },
      },
      {
        path: 'exporte',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-section/dashboard-section').then(
            (m) => m.DashboardSection,
          ),
        data: { title: 'Exporte', icon: '📤' },
      },
      {
        path: 'benachrichtigungen',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-section/dashboard-section').then(
            (m) => m.DashboardSection,
          ),
        data: { title: 'Benachrichtigungen', icon: '🔔' },
      },
      {
        path: 'einstellungen',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-section/dashboard-section').then(
            (m) => m.DashboardSection,
          ),
        data: { title: 'Einstellungen', icon: '⚙️' },
      },
    ],
  },
];
