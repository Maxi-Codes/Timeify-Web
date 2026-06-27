import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Feature = {
  icon: 'clock' | 'calendar' | 'heart';
  title: string;
  description: string;
  color: string;
};

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './features.html',
  styleUrl: './features.css',
})
export class FeaturesComponent {
  readonly features: Feature[] = [
    {
      icon: 'clock',
      title: 'Zeiterfassung',
      description:
        'Erfasse deine Arbeitszeiten mit nur einem Klick. Einfach, schnell und präzise.',
      color: '#F59E0B',
    },
    {
      icon: 'calendar',
      title: 'Urlaubsanträge',
      description:
        'Stelle Urlaubsanträge direkt in der App und behalte den Überblick über deine verbleibenden Urlaubstage.',
      color: '#F59E0B',
    },
    {
      icon: 'heart',
      title: 'Krankmeldungen',
      description:
        'Melde dich mit wenigen Klicks krank und informiere automatisch dein Team.',
      color: '#F59E0B',
    },
  ];
}
