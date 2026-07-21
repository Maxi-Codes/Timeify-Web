import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Api } from '../../../../api/api';
import { apiNewsletterSubscribePost } from '../../../../api/functions';
import { ButtonComponent } from '../../../../shared/components/button/button';

@Component({
  selector: 'app-cta',
  imports: [ReactiveFormsModule, ButtonComponent],
  templateUrl: './cta.html',
  styleUrl: './cta.css',
})
export class Cta {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(Api);

  readonly isSubmitting = signal(false);
  readonly isSubscribed = signal(false);
  readonly submitError = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    consent: [false, Validators.requiredTrue],
  });

  subscribe(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set('');

    this.api
      .invoke(apiNewsletterSubscribePost, {
        body: { email: this.form.controls.email.value.trim() },
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.isSubscribed.set(true);
          this.form.reset();
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.submitError.set(this.errorMessage(error));
        },
      });
  }

  emailError(): string {
    const control = this.form.controls.email;
    if (!control.touched || !control.errors) return '';
    if (control.errors['required']) return 'Bitte gib deine E-Mail-Adresse ein.';
    return 'Bitte gib eine gültige E-Mail-Adresse ein.';
  }

  consentError(): string {
    const control = this.form.controls.consent;
    return control.touched && control.invalid ? 'Bitte bestätige die Newsletter-Anmeldung.' : '';
  }

  private errorMessage(error: HttpErrorResponse): string {
    if (error.status === 409) {
      return 'Diese E-Mail-Adresse ist bereits für den Newsletter angemeldet.';
    }
    if (error.status === 0) {
      return 'Der Newsletter-Service ist gerade nicht erreichbar. Bitte versuche es später erneut.';
    }
    return 'Die Anmeldung konnte nicht abgeschlossen werden. Bitte versuche es erneut.';
  }
}
