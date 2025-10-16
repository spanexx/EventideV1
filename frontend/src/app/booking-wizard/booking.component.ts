import { Component } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { BookingProgressComponent } from './components/booking-progress/booking-progress.component';

@Component({
  selector: 'app-booking',
  template: `
    <div class="booking-container">
      <div class="booking-header">
        <div class="logo-container" (click)="navigateHome()">
          <img src="/logo.png" alt="Eventide" class="logo">
        </div>
      </div>
      <app-booking-progress></app-booking-progress>
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .booking-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .booking-header {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    .logo-container {
      cursor: pointer;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .logo-container:hover {
      transform: scale(1.05);
    }
    .logo {
      height: 40px;
      width: auto;
      transition: opacity 0.3s ease;
    }
    .logo:hover {
      opacity: 0.8;
    }
    @media (max-width: 768px) {
      .booking-container {
        padding: 16px;
      }
      .logo {
        height: 32px;
      }
    }
  `],
  standalone: true,
  imports: [
    RouterOutlet,
    BookingProgressComponent
  ]
})
export class BookingComponent {
  constructor(private router: Router) {}

  navigateHome() {
    this.router.navigate(['/']);
  }
}