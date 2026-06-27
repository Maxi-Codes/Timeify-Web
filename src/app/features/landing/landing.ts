import { Component } from '@angular/core';
import { HeroComponent } from './components/hero/hero';
import { FeaturesComponent } from './components/features/features';
import { Cta } from './components/cta/cta';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-landing',
  imports: [HeroComponent, FeaturesComponent, Cta, Footer],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {}
