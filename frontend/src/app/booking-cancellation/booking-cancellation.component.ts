import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { BookingFacadeService } from '../dashboard/services/booking/booking-facade.service';

@Component({
  selector: 'app-booking-cancellation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatStepperModule
  ],
  templateUrl: './booking-cancellation.component.html',
  styleUrls: ['./booking-cancellation.component.scss']
})
export class BookingCancellationComponent implements OnInit {
  emailFormGroup!: FormGroup;
  codeFormGroup!: FormGroup;
  
  bookingId: string = '';
  serialKey: string = '';
  loading = false;
  error: string | null = null;
  success = false;
  codeSent = false;
  
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private bookingFacade: BookingFacadeService
  ) {}

  ngOnInit(): void {
    // Get booking ID from route params
    this.route.params.subscribe(params => {
      this.bookingId = params['id'];
    });

    // Get serial key from router state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      this.serialKey = navigation.extras.state['serialKey'] || '';
    }

    // Initialize forms
    this.emailFormGroup = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.codeFormGroup = this.formBuilder.group({
      code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern(/^\d{6}$/)]]
    });
  }

  /**
   * Step 1: Request cancellation code
   */
  requestCancellation(): void {
    if (this.emailFormGroup.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;
    
    // Disable email input while loading
    this.emailFormGroup.get('email')?.disable();

    const email = this.emailFormGroup.value.email;

    // Pass serial key for additional verification
    this.bookingFacade.requestCancellation(this.bookingId, email, this.serialKey).subscribe({
      next: (response) => {
        this.loading = false;
        this.codeSent = true;
        this.error = null;
        // Keep email disabled after code is sent
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Failed to send verification code. Please try again.';
        // Re-enable email on error
        this.emailFormGroup.get('email')?.enable();
      }
    });
  }

  /**
   * Step 2: Verify code and cancel booking
   */
  verifyCancellation(): void {
    if (this.codeFormGroup.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;
    
    // Disable code input while loading
    this.codeFormGroup.get('code')?.disable();

    const email = this.emailFormGroup.value.email;
    const code = this.codeFormGroup.value.code;

    this.bookingFacade.verifyCancellation(this.bookingId, email, code).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        this.error = null;
        
        // Redirect to success page after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/booking-lookup']);
        }, 3000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Invalid verification code. Please try again.';
        // Re-enable code input on error
        this.codeFormGroup.get('code')?.enable();
      }
    });
  }

  /**
   * Resend verification code
   */
  resendCode(): void {
    this.codeFormGroup.reset();
    this.codeFormGroup.get('code')?.enable();
    this.error = null;
    this.codeSent = false;
    // Re-enable email temporarily for resend
    this.emailFormGroup.get('email')?.enable();
    this.requestCancellation();
  }

  /**
   * Cancel the cancellation process
   */
  cancelProcess(): void {
    this.router.navigate(['/booking-lookup', this.serialKey || '']);
  }
}
