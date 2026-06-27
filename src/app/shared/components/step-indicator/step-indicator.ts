import { Component, input } from '@angular/core';

export interface RegisterStep {
  label: string;
  path: string;
}

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  templateUrl: './step-indicator.html',
})
export class StepIndicatorComponent {
  steps = input.required<RegisterStep[]>();
  currentStep = input.required<number>();
}
