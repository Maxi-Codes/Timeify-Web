import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-footer',
  imports: [NgOptimizedImage],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  readonly logoUrl = '/assets/logo-timeify.png';
  readonly currentYear = new Date().getFullYear();
}
