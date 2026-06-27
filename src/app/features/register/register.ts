import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthLayoutComponent } from '../../shared/components/auth-layout/auth-layout';
import {
  RegisterStep,
  StepIndicatorComponent,
} from '../../shared/components/step-indicator/step-indicator';

export const REGISTER_STEPS: RegisterStep[] = [
  { label: 'Konto', path: '/register' },
  { label: 'Unternehmen', path: '/register/company' },
  { label: 'Paket', path: '/register/payment' },
];

@Component({
  selector: 'app-register',
  imports: [RouterOutlet, AuthLayoutComponent, StepIndicatorComponent],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  readonly steps = REGISTER_STEPS;
  currentStep = 1;

  onStepActivate(component: { stepNumber?: number }): void {
    if (component.stepNumber) {
      this.currentStep = component.stepNumber;
    }
  }
}
