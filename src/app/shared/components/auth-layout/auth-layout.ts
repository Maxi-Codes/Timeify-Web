import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './auth-layout.html',
})
export class AuthLayoutComponent {
  title = input.required<string>();
  subtitle = input<string>('');
  readonly logoUrl = '/assets/logo-timeify.png';
}
