import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthState } from '../store/auth/reducers/auth.reducer';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import * as AuthActions from '../store/auth/actions/auth.actions';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="verify-email-container">
      <div class="verify-email-card">
        <div class="verify-email-header">
          <h2>Email Verification</h2>
        </div>
        
        <div class="verify-email-content">
          <div *ngIf="isVerifying" class="loading-state">
            <div class="spinner"></div>
            <p>Verifying your email address...</p>
          </div>
          
          <div *ngIf="verificationSuccess" class="success-state">
            <div class="success-icon">✓</div>
            <h3>Email Verified Successfully!</h3>
            <p>Your email address has been verified. You can now log in to your account.</p>
            <button class="btn btn-primary" (click)="navigateToLogin()">
              Go to Login
            </button>
          </div>
          
          <div *ngIf="verificationError" class="error-state">
            <div class="error-icon">✗</div>
            <h3>Verification Failed</h3>
            <p>{{ errorMessage }}</p>
            <div class="error-actions">
              <button class="btn btn-secondary" (click)="navigateToLogin()">
                Back to Login
              </button>
              <button class="btn btn-primary" (click)="resendVerification()">
                Resend Verification Email
              </button>
            </div>
          </div>
          
          <div *ngIf="!token && !isVerifying" class="no-token-state">
            <div class="warning-icon">⚠</div>
            <h3>Invalid Verification Link</h3>
            <p>This verification link is invalid or has expired.</p>
            <button class="btn btn-primary" (click)="navigateToLogin()">
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verify-email-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .verify-email-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      max-width: 500px;
      width: 100%;
      overflow: hidden;
    }

    .verify-email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }

    .verify-email-header h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .verify-email-content {
      padding: 40px 30px;
      text-align: center;
    }

    .loading-state, .success-state, .error-state, .no-token-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .success-icon {
      width: 60px;
      height: 60px;
      background: #4CAF50;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 30px;
      font-weight: bold;
    }

    .error-icon {
      width: 60px;
      height: 60px;
      background: #f44336;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 30px;
      font-weight: bold;
    }

    .warning-icon {
      width: 60px;
      height: 60px;
      background: #ff9800;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 30px;
      font-weight: bold;
    }

    h3 {
      margin: 0;
      font-size: 20px;
      color: #333;
    }

    p {
      margin: 0;
      color: #666;
      line-height: 1.5;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      text-decoration: none;
      display: inline-block;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
      margin-right: 10px;
    }

    .btn-secondary:hover {
      background: #5a6268;
      transform: translateY(-2px);
    }

    .error-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }

    @media (max-width: 480px) {
      .verify-email-container {
        padding: 10px;
      }
      
      .verify-email-content {
        padding: 30px 20px;
      }
      
      .error-actions {
        flex-direction: column;
        gap: 10px;
      }
      
      .btn-secondary {
        margin-right: 0;
      }
    }
  `]
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  token: string | null = null;
  isVerifying = false;
  verificationSuccess = false;
  verificationError = false;
  errorMessage = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store<{ auth: AuthState }>,
    private authService: AuthService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('[VerifyEmailComponent] Component initialized');
    
    // Get token from query parameters
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params: any) => {
      console.log('[VerifyEmailComponent] Query params received:', params);
      this.token = params['token'];
      console.log('[VerifyEmailComponent] Token extracted:', { 
        hasToken: !!this.token, 
        tokenLength: this.token?.length,
        tokenPreview: this.token?.substring(0, 20) + '...'
      });
      
      if (this.token) {
        console.log('[VerifyEmailComponent] Token found, calling verifyEmail()');
        this.verifyEmail();
      } else {
        console.warn('[VerifyEmailComponent] No token found in query params');
      }
    });

    // Subscribe to auth state to handle verification results
    this.store.select(state => state.auth).pipe(takeUntil(this.destroy$)).subscribe((authState: AuthState) => {
      console.log('[VerifyEmailComponent] Auth state updated:', {
        isLoading: authState.isLoading,
        verificationSuccess: authState.verificationSuccess,
        hasError: !!authState.error,
        error: authState.error
      });
      
      if (authState.isLoading) {
        this.isVerifying = true;
        this.verificationSuccess = false;
        this.verificationError = false;
      } else {
        this.isVerifying = false;
        
        if (authState.verificationSuccess) {
          this.verificationSuccess = true;
          this.verificationError = false;
          console.log('[VerifyEmailComponent] Setting verificationSuccess = true, triggering change detection');
        } else if (authState.error) {
          this.verificationError = true;
          this.verificationSuccess = false;
          this.errorMessage = authState.error;
          console.log('[VerifyEmailComponent] Setting verificationError = true, triggering change detection');
        }
      }
      
      // Trigger change detection since we're using OnPush strategy
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  verifyEmail() {
    console.log('[VerifyEmailComponent] verifyEmail() called with token:', {
      hasToken: !!this.token,
      tokenPreview: this.token?.substring(0, 20) + '...'
    });
    
    if (this.token) {
      console.log('[VerifyEmailComponent] Dispatching verifyEmail action');
      this.store.dispatch(AuthActions.verifyEmail({ token: this.token }));
    } else {
      console.error('[VerifyEmailComponent] No token available for verification');
    }
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }

  resendVerification() {
    this.authService.resendVerificationEmail().subscribe({
      next: () => {
        this.notificationService.success('Verification email sent successfully! Please check your inbox.');
      },
      error: (error) => {
        this.notificationService.error(`Failed to resend verification email: ${error.message || 'Unknown error'}`);
      }
    });
  }
}
