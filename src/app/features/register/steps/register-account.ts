import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button';
import { InputComponent } from '../../../shared/components/input/input';
import {
  AccountFormData,
  RegisterStateService,
} from '../../../core/auth/register-state.service';

@Component({
  selector: 'app-register-account',
  imports: [ReactiveFormsModule, RouterLink, InputComponent, ButtonComponent],
  templateUrl: './register-account.html',
})
export class RegisterAccountStep {
  readonly stepNumber = 1;

  private readonly fb = inject(FormBuilder);
  private readonly registerState = inject(RegisterStateService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group(
    {
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    {
      validators: (group) =>
        group.value.password === group.value.confirmPassword
          ? null
          : { passwordMismatch: true },
    },
  );

  constructor() {
    const saved = this.registerState.account;
    if (saved) {
      this.form.patchValue(saved);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.registerState.setAccount(this.form.getRawValue() as AccountFormData);
    this.router.navigate(['/register/company']);
  }

  fieldError(field: keyof typeof this.form.controls): string {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';

    if (control.errors['required']) return 'Pflichtfeld';
    if (field === 'email' && control.errors['email']) return 'Ungültige E-Mail';
    if (field === 'password' && control.errors['minlength']) {
      return 'Mindestens 8 Zeichen';
    }

    return '';
  }

  confirmPasswordError(): string {
    if (!this.form.touched || !this.form.errors?.['passwordMismatch']) {
      return '';
    }
    return 'Passwörter stimmen nicht überein';
  }
}
