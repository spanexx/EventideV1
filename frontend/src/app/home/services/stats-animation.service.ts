import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AnimatedStats } from '../models/home.models';

@Injectable({
  providedIn: 'root'
})
export class StatsAnimationService {
  private statsSubject = new Subject<AnimatedStats>();
  public stats$ = this.statsSubject.asObservable();
  animate(targets: AnimatedStats, duration: number = 2000): void {
    const steps = 60;
    const interval = duration / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      const current = {
        providers: Math.floor(targets.providers * progress),
        bookings: Math.floor(targets.bookings * progress),
        satisfaction: Math.floor(targets.satisfaction * progress)
      };

      // Emit current values
      this.statsSubject.next(current);

      if (currentStep >= steps) {
        clearInterval(timer);
        this.statsSubject.next(targets);
      }
    }, interval);
  }
}