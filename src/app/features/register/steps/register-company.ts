import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button';
import { InputComponent } from '../../../shared/components/input/input';
import { AuthService } from '../../../core/auth/auth.service';
import {
  CompanyFormData,
  RegisterStateService,
} from '../../../core/auth/register-state.service';
import { RegisterCompanyDto } from '../../../api/models/register-company-dto';

@Component({
  selector: 'app-register-company',
  imports: [ReactiveFormsModule, InputComponent, ButtonComponent],
  templateUrl: './register-company.html',
})
export class RegisterCompanyStep {
  readonly stepNumber = 2;

  private readonly fb = inject(FormBuilder);
  private readonly registerState = inject(RegisterStateService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    companyName: ['', Validators.required],
    street: ['', Validators.required],
    houseNumber: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    postalCode: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    city: ['', Validators.required],
    country: ['Deutschland', Validators.required],
  });

  constructor() {
    if (!this.registerState.account) {
      this.router.navigate(['/register']);
      return;
    }

    const saved = this.registerState.company;
    if (saved) {
      this.form.patchValue({
        ...saved,
        houseNumber: saved.houseNumber.toString(),
        postalCode: saved.postalCode.toString(),
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const account = this.registerState.account;
    if (!account) {
      this.router.navigate(['/register']);
      return;
    }

    const raw = this.form.getRawValue();
    const companyData: CompanyFormData = {
      companyName: raw.companyName,
      street: raw.street,
      houseNumber: Number(raw.houseNumber),
      postalCode: Number(raw.postalCode),
      city: raw.city,
      country: raw.country,
    };

    const payload: RegisterCompanyDto = {
      companyName: companyData.companyName,
      street: companyData.street,
      houseNumber: companyData.houseNumber,
      postalCode: companyData.postalCode,
      city: companyData.city,
      country: companyData.country,
      adminEmail: account.email,
      password: account.password,
      firstName: account.firstName,
      lastName: account.lastName,
    };

    this.registerState.setCompany(companyData);
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.auth.registerCompany(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/register/payment']);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set(
          'Registrierung fehlgeschlagen. Bitte prüfe deine Angaben.',
        );
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/register']);
  }

  fieldError(
    field: 'companyName' | 'street' | 'houseNumber' | 'postalCode' | 'city' | 'country',
  ): string {
    const control = this.form.controls[field];
    if (!control.touched || !control.errors) return '';
    if (control.errors['required']) return 'Pflichtfeld';
    if (control.errors['pattern']) return 'Nur Zahlen erlaubt';
    return '';
  }
}
