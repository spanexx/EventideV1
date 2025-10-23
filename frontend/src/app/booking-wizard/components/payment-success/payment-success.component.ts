import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { PaymentService } from '../../../core/services/payment.service';

@Component({
  selector: 'app-payment-success',
  template: `
    <div class="payment-success">
      <div *ngIf="loading" class="loading-state">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Verifying payment...</p>
      </div>

      <div *ngIf="!loading && success" class="success-state">
        <mat-icon class="success-icon">check_circle</mat-icon>
        <h2>Payment Successful!</h2>
        <p>Your booking has been confirmed and payment processed.</p>
        
        <div class="payment-details">
          <p><strong>Session ID:</strong> {{ sessionId }}</p>
          <p><strong>Status:</strong> {{ paymentStatus }}</p>
        </div>

        <button 
          mat-raised-button 
          color="primary" 
          (click)="viewBooking()"
          class="action-button"
        >
          View Booking Details
        </button>
      </div>

      <div *ngIf="!loading && !success" class="error-state">
        <mat-icon class="error-icon">error</mat-icon>
        <h2>Payment Verification Failed</h2>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="retry()">
          Try Again
        </button>
      </div>
    </div>
  `,
  styles: [`
    .payment-success {
      max-width: 500px;
      margin: 0 auto;
      padding: 40px 24px;
    }

    .loading-state, .success-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
    }

    .success-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #4caf50;
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
    }

    .payment-details {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      width: 100%;
      text-align: left;
      margin: 16px 0;
    }

    .payment-details p {
      margin: 8px 0;
      word-break: break-all;
    }

    .action-button {
      margin-top: 16px;
      min-width: 200px;
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
export class PaymentSuccessComponent implements OnInit {
  loading = true;
  success = false;
  error: string | null = null;
  sessionId: string | null = null;
  paymentStatus: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.sessionId = params['session_id'];
      if (!this.sessionId) {
        this.error = 'No session ID provided';
        this.loading = false;
        return;
      }

      this.verifyPayment();
    });
  }

  private verifyPayment(): void {
    if (!this.sessionId) return;

    this.paymentService.getSessionStatus(this.sessionId).subscribe({
      next: (status) => {
        this.paymentStatus = status.paymentStatus;
        this.success = status.paymentStatus === 'paid';
        this.loading = false;

        if (!this.success) {
          this.error = 'Payment not completed';
        }
      },
      error: (err) => {
        this.error = 'Failed to verify payment status';
        this.loading = false;
        console.error('Payment verification error:', err);
      }
    });
  }

  viewBooking(): void {
    this.router.navigate(['/booking/confirmation']);
  }

  retry(): void {
    this.error = null;
    this.loading = true;
    this.verifyPayment();
  }
}
