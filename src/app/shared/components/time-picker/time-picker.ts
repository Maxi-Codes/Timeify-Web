import { Component, input } from '@angular/core';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  templateUrl: './time-picker.html',
})
export class TimePickerComponent {
  label = input<string>('Uhrzeit');
  error = input<string>('');
  disabled = input<boolean>(false);
}
