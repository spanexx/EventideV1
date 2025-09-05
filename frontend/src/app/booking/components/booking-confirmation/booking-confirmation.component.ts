import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import * as BookingSelectors from '../../store/selectors/booking.selectors';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-booking-confirmation',
  template: `
    <div class="booking-confirmation">
      <mat-icon class="success-icon" *ngIf="!error">check_circle</mat-icon>
      <mat-icon class="error-icon" *ngIf="error">error</mat-icon>
      
      <h2 *ngIf="!error">Booking Confirmed!</h2>
      <h2 *ngIf="error">Booking Failed</h2>
      
      <p *ngIf="!error">Your appointment has been successfully scheduled.</p>
      <p *ngIf="error">There was an error processing your booking. Please try again.</p>
      
      <div class="booking-details" *ngIf="!error && booking">
        <h3>Appointment Details</h3>
        <p><strong>Date:</strong> {{ booking.startTime | date:'fullDate' }}</p>
        <p><strong>Time:</strong> {{ booking.startTime | date:'shortTime' }} - {{ booking.endTime | date:'shortTime' }}</p>
        <p><strong>Duration:</strong> {{ booking.duration }} minutes</p>
        <p><strong>Name:</strong> {{ guestInfo?.name }}</p>
        <p><strong>Email:</strong> {{ guestInfo?.email }}</p>
        <p><strong>Phone:</strong> {{ guestInfo?.phone }}</p>
      </div>
      
      <div *ngIf="error" class="error-details">
        <p>{{ error }}</p>
      </div>
      
      <button mat-raised-button color="primary" (click)="finish()">{{ error ? 'Try Again' : 'Finish' }}</button>
    </div>
  `,
  styles: [`
    .booking-confirmation {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      text-align: center;
    }
    
    .success-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #4caf50;
    }
    
    .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #f44336;
    }
    
    .booking-details, .error-details {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      width: 100%;
      max-width: 400px;
      text-align: left;
    }
    
    .booking-details h3 {
      margin-top: 0;
    }
    
    .booking-details p {
      margin: 8px 0;
    }
    
    .error-details p {
      color: #f44336;
      margin: 0;
    }
  `],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule
  ]
})
export class BookingConfirmationComponent {
  booking$!: any;
  guestInfo$!: any;
  error$!: any;
  
  booking: any | null = null;
  guestInfo: any | null = null;
  error: string | null = null;
  
  constructor(
    private router: Router,
    private store: Store
  ) {
    // Initialize observables after store is injected
    this.booking$ = this.store.select(BookingSelectors.selectBooking);
    this.guestInfo$ = this.store.select(BookingSelectors.selectGuestInfo);
    this.error$ = this.store.select(BookingSelectors.selectBookingError);
    
    // Subscribe to store values
    this.booking$.subscribe((booking: any) => {
      this.booking = booking;
    });
    
    this.guestInfo$.subscribe((guestInfo: any) => {
      this.guestInfo = guestInfo;
    });
    
    this.error$.subscribe((error: string | null) => {
      this.error = error;
    });
  }
  
  finish() {
    if (this.error) {
      // If there was an error, go back to the guest information form
      this.router.navigate(['/booking/information']);
    } else {
      // If successful, navigate back to the home page or another appropriate page
      this.router.navigate(['/']);
    }
  }
}