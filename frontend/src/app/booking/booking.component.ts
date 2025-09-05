import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BookingProgressComponent } from './components/booking-progress/booking-progress.component';

@Component({
  selector: 'app-booking',
  template: `
    <div class="booking-container">
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
  `],
  standalone: true,
  imports: [
    RouterOutlet,
    BookingProgressComponent
  ]
})
export class BookingComponent {

}