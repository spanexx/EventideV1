import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { PaymentService } from '../../../core/services/payment.service';
import { Store } from '@ngrx/store';
import * as BookingSelectors from '../../store-bookings/selectors/booking.selectors';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-payment-checkout',
  template: `
    <div class="payment-checkout">
      <div *ngIf="loading" class="loading-state">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Preparing payment...</p>
      </div>

      <div *ngIf="error" class="error-state">
        <mat-icon class="error-icon">error</mat-icon>
        <h2>Payment Error</h2>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="retry()">
          Try Again
        </button>
      </div>

      <div *ngIf="!loading && !error && bookingDetails" class="payment-details">
        <h2>Complete Your Payment</h2>
        
        <div class="booking-summary">
          <h3>Booking Summary</h3>
          <p><strong>Date:</strong> {{ bookingDetails.date }}</p>
          <p><strong>Time:</strong> {{ bookingDetails.time }}</p>
          <p><strong>Duration:</strong> {{ bookingDetails.duration }} minutes</p>
          <p class="amount-text"><strong>Amount:</strong> {{ bookingDetails.amount | currency: bookingDetails.currency:'symbol':'1.2-2' }}</p>
        </div>

        <button 
          mat-raised-button 
          color="primary" 
          (click)="proceedToCheckout()"
          class="checkout-button"
        >
          <mat-icon>payment</mat-icon>
          Proceed to Payment
        </button>

        <p class="secure-note">
          <mat-icon>lock</mat-icon>
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  `,
  styles: [`
    .payment-checkout {
      max-width: 500px;
      margin: 0 auto;
      padding: 24px;
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
      padding: 40px 20px;
    }

    .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #f44336;
    }

    .payment-details {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .payment-details h2 {
      text-align: center;
      margin-bottom: 8px;
    }

    .booking-summary {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
    }

    .booking-summary h3 {
      margin-top: 0;
      margin-bottom: 16px;
      color: #333;
    }

    .booking-summary p {
      margin: 8px 0;
      line-height: 1.6;
    }

    .booking-summary .amount-text {
      font-size: 1.2em;
      color: #1976d2;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #ddd;
    }

    .checkout-button {
      width: 100%;
      height: 48px;
      font-size: 16px;
    }

    .checkout-button mat-icon {
      margin-right: 8px;
    }

    .secure-note {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #666;
      font-size: 14px;
      margin-top: 8px;
    }

    .secure-note mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ]
})
export class PaymentCheckoutComponent implements OnInit {
  loading = true;
  error: string | null = null;
  bookingDetails: any = null;
  bookingId: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private store: Store
  ) {}

  ngOnInit(): void {
    this.route.queryParams.pipe(take(1)).subscribe(params => {
      this.bookingId = params['bookingId'];
      if (!this.bookingId) {
        this.error = 'No booking ID provided';
        this.loading = false;
        return;
      }

      this.loadBookingDetails();
    });
  }

  private loadBookingDetails(): void {
    this.store.select(BookingSelectors.selectBooking)
      .pipe(take(1))
      .subscribe((booking: any) => {
        if (booking) {
          this.bookingDetails = {
            date: new Date(booking.startTime).toLocaleDateString(),
            time: `${new Date(booking.startTime).toLocaleTimeString()} - ${new Date(booking.endTime).toLocaleTimeString()}`,
            duration: booking.duration,
            amount: (booking.totalAmount || 0) / 100,
            currency: booking.currency || 'USD'
          };
          this.loading = false;
        } else {
          this.error = 'Booking not found';
          this.loading = false;
        }
      });
  }

  proceedToCheckout(): void {
    if (!this.bookingId) return;

    this.loading = true;
    this.error = null;

    this.store.select(BookingSelectors.selectBooking)
      .pipe(take(1))
      .subscribe((booking: any) => {
        if (!booking) {
          this.error = 'Booking not found';
          this.loading = false;
          return;
        }

        const successUrl = `${window.location.origin}/booking/payment-success?session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${window.location.origin}/booking/payment-checkout?bookingId=${this.bookingId}`;

        this.paymentService.createCheckoutSession({
          bookingId: this.bookingId!,
          amount: booking.totalAmount,
          currency: booking.currency || 'usd',
          customerEmail: booking.guestEmail,
          successUrl,
          cancelUrl
        }).subscribe({
          next: (response) => {
            this.paymentService.redirectToCheckout(response.url);
          },
          error: (err) => {
            this.error = 'Failed to create payment session. Please try again.';
            this.loading = false;
            console.error('Payment error:', err);
          }
        });
      });
  }

  retry(): void {
    this.error = null;
    this.loading = true;
    this.loadBookingDetails();
  }
}
