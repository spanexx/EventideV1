import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as BookingActions from '../../store/actions/booking.actions';
import * as BookingSelectors from '../../store/selectors/booking.selectors';
import { GuestInfo } from '../../models/booking.models';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-guest-information',
  template: `
    <div class="guest-information">
      <h2>Your Information</h2>
      <form [formGroup]="guestForm" (ngSubmit)="submitForm()">
        <mat-form-field>
          <input matInput placeholder="Full Name" formControlName="name">
          <mat-error *ngIf="guestForm.get('name')?.hasError('required')">
            Name is required
          </mat-error>
        </mat-form-field>
        
        <mat-form-field>
          <input matInput placeholder="Email" formControlName="email">
          <mat-error *ngIf="guestForm.get('email')?.hasError('required')">
            Email is required
          </mat-error>
          <mat-error *ngIf="guestForm.get('email')?.hasError('email')">
            Please enter a valid email address
          </mat-error>
        </mat-form-field>
        
        <mat-form-field>
          <input matInput placeholder="Phone" formControlName="phone">
          <mat-error *ngIf="guestForm.get('phone')?.hasError('invalidPhone')">
            Please enter a valid phone number
          </mat-error>
        </mat-form-field>
        
        <mat-form-field>
          <textarea matInput placeholder="Notes (optional)" formControlName="notes" rows="3"></textarea>
        </mat-form-field>
        
        <div class="actions">
          <button mat-button (click)="goBack()">Back</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="guestForm.invalid || loading$ | async">
            <span *ngIf="!(loading$ | async)">Confirm Booking</span>
            <span *ngIf="loading$ | async">Processing...</span>
          </button>
        </div>
      </form>
      
      <div *ngIf="error$ | async as error" class="error-message">
        {{ error }}
      </div>
    </div>
  `,
  styles: [`
    .guest-information {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    
    form {
      width: 100%;
      max-width: 400px;
    }
    
    mat-form-field {
      width: 100%;
    }
    
    .actions {
      display: flex;
      justify-content: space-between;
      width: 100%;
      margin-top: 20px;
    }
    
    .error-message {
      color: #f44336;
      text-align: center;
      margin-top: 10px;
    }
  `],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ]
})
export class GuestInformationComponent implements OnInit {
  guestForm!: any;
  
  loading$!: any;
  error$!: any;
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private store: Store
  ) {
    // Add custom phone validator
    this.guestForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      notes: ['']
    }, {
      validators: [this.validatePhoneIfProvided]
    });
    
    this.loading$ = this.store.select(BookingSelectors.selectBookingLoading);
    this.error$ = this.store.select(BookingSelectors.selectBookingError);
    
    // Add custom phone validator
    this.guestForm.get('phone')?.setValidators([Validators.pattern(/^(\+\d{1,3})?\d{10,15}$/)]);
  }
  
  ngOnInit(): void {
    // Load existing guest info if available (for editing)
    this.store.select(BookingSelectors.selectGuestInfo).subscribe(guestInfo => {
      if (guestInfo) {
        this.guestForm.patchValue(guestInfo);
      }
    });
  }
  
  validatePhoneIfProvided(control: AbstractControl): ValidationErrors | null {
    const phone = control.get('phone');
    if (phone && phone.value && phone.value.trim() !== '') {
      const phonePattern = /^(\+\d{1,3})?\d{10,15}$/;
      return phonePattern.test(phone.value) ? null : { invalidPhone: true };
    }
    return null;
  }
  
  submitForm() {
    if (this.guestForm.valid) {
      const guestInfo: GuestInfo = this.guestForm.value as GuestInfo;
      this.store.dispatch(BookingActions.setGuestInfo({ guestInfo }));
      // In a real implementation, we would dispatch an action to create the booking
      // For now, we'll just navigate to the confirmation page
      this.router.navigate(['/booking/confirmation']);
    }
  }
  
  goBack() {
    this.router.navigate(['/booking/availability']);
  }
}