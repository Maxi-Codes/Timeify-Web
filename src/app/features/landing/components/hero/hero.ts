import { Component, ElementRef, HostListener, ViewChild, signal } from '@angular/core';

@Component({
  selector: 'app-hero',
  standalone: true,
  templateUrl: './hero.html',
  styleUrl: './hero.css',
  imports: [],
})
export class HeroComponent {
  @ViewChild('heroSection', { static: true })
  heroSection!: ElementRef<HTMLElement>;

  readonly logoUrl = '/assets/logo-timeify.png';
  readonly backgroundUrl = '/assets/background.png';

  readonly translateY = signal('0%');
  readonly opacity = signal(1);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    const element = this.heroSection.nativeElement;
    const rect = element.getBoundingClientRect();

    const progress = Math.min(Math.max(-rect.top / rect.height, 0), 1);

    this.translateY.set(`${progress * 50}%`);
    this.opacity.set(progress <= 0.5 ? 1 - progress * 2 : 0);
  }
}
