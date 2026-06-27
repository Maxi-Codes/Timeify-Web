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
      import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
];
