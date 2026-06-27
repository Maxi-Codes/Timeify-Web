import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button';
import { AuthService } from '../../../core/auth/auth.service';
import { RegisterStateService } from '../../../core/auth/register-state.service';

@Component({
  selector: 'app-register-payment',
  imports: [ButtonComponent],
  templateUrl: './register-payment.html',
})
export class RegisterPaymentStep {
  readonly stepNumber = 3;

  private readonly auth = inject(AuthService);
  private readonly registerState = inject(RegisterStateService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly plan = {
    name: 'Professional',
    price: 40,
    features: [
      'Unbegrenzte Zeiterfassung',
      'Urlaubs- & Krankmeldungen',
      'Mitarbeiterverwaltung',
      'Monatliche Berichte',
    ],
  };

  constructor() {
    if (!this.registerState.account || !this.registerState.company) {
      this.router.navigate(['/register']);
    }
  }

  onOrder(): void {
    const account = this.registerState.account;
    if (!account) {
      this.router.navigate(['/register']);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.auth
      .login({ email: account.email, password: account.password })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.registerState.clear();
          this.router.navigate(['/dashboard']);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set(
            'Anmeldung nach Registrierung fehlgeschlagen. Bitte melde dich manuell an.',
          );
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/register/company']);
  }
}
