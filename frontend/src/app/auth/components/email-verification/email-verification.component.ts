import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-email-verification',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="verification-container">
      <div *ngIf="loading" class="loading-spinner">
        <mat-spinner></mat-spinner>
        <p>Verifying your email...</p>
      </div>
      <div *ngIf="!loading && error" class="error-message">
        <h2>Email Verification Failed</h2>
        <p>{{ errorMessage }}</p>
        <button (click)="resendVerification()" class="resend-button">
          Resend Verification Email
        </button>
      </div>
      <div *ngIf="!loading && !error && verified" class="success-message">
        <h2>Email Verified Successfully!</h2>
        <p>You can now close this window and return to the application.</p>
      </div>
    </div>
  `,
  styles: [`
    .verification-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 300px;
      padding: 2rem;
      text-align: center;
    }

    .loading-spinner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .error-message {
      color: #f44336;
    }

    .success-message {
      color: #4caf50;
    }

    .resend-button {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background-color: #2196f3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .resend-button:hover {
      background-color: #1976d2;
    }
  `]
})
export class EmailVerificationComponent implements OnInit {
  loading = true;
  error = false;
  verified = false;
  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading = false;
      this.error = true;
      this.errorMessage = 'Invalid verification link';
      return;
    }

    this.verifyEmail(token);
  }

  private verifyEmail(token: string): void {
    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.verified = true;
        this.error = false;
        this.loading = false;
        
        // Show success message
        this.snackBar.open('Email verified successfully!', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });

        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 3000);
      },
      error: (err: any) => {
        this.error = true;
        this.errorMessage = err.message || 'Failed to verify email';
        this.loading = false;
        
        this.snackBar.open('Failed to verify email: ' + this.errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  resendVerification(): void {
    this.authService.resendVerificationEmail().subscribe({
      next: () => {
        this.snackBar.open('Verification email sent successfully!', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      },
      error: (err: any) => {
        this.snackBar.open(
          'Failed to resend verification email: ' + (err.message || 'Unknown error'),
          'Close',
          {
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }
}
