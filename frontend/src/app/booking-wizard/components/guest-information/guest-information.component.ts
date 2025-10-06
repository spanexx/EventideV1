import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, combineLatest } from 'rxjs';
import { take, filter, takeUntil } from 'rxjs/operators';
import * as BookingActions from '../../store-bookings/actions/booking.actions';
import * as BookingSelectors from '../../store-bookings/selectors/booking.selectors';
import { GuestInfo, Booking } from '../../../shared/models/booking.models';
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
          <button mat-raised-button color="primary" type="submit" [disabled]="guestForm.invalid || (loading$ | async)">
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
export class GuestInformationComponent implements OnInit, OnDestroy {
  guestForm!: any;
  private destroy$ = new Subject<void>();
  private providerId!: string;
  
  loading$!: any;
  error$!: any;
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
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
    console.log('═══════════════════════════════════════════════════');
    console.log('🔍 [Guest Information] Component initialized');
    console.log('═══════════════════════════════════════════════════');
    
    // Get providerId from parent route
    this.providerId = this.route.parent?.snapshot.paramMap.get('providerId') || '';
    console.log('📋 [Guest Information] Provider ID from route:', this.providerId);
    console.log('📋 [Guest Information] Form initial state:', this.guestForm.value);
    console.log('📋 [Guest Information] Form valid:', this.guestForm.valid);
    
    if (!this.providerId) {
      console.error('❌ [Guest Information] CRITICAL: No provider ID found in route!');
    }
    
    // Load existing guest info if available (for editing)
    this.store.select(BookingSelectors.selectGuestInfo)
      .pipe(takeUntil(this.destroy$))
      .subscribe(guestInfo => {
        console.log('📋 [Guest Information] Guest info from store:', guestInfo);
        if (guestInfo) {
          this.guestForm.patchValue(guestInfo);
          console.log('✅ [Guest Information] Form patched with existing data:', this.guestForm.value);
        }
      });

    // Log booking state
    this.store.select(BookingSelectors.selectBookingState).subscribe(state => {
      console.log('📦 [Guest Information] Full booking state:', state);
    });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
    console.log('═══════════════════════════════════════════════════');
    console.log('🎯 [Guest Information] submitForm() called');
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 [Guest Information] Form value:', this.guestForm.value);
    console.log('📋 [Guest Information] Form valid:', this.guestForm.valid);
    console.log('📋 [Guest Information] Form errors:', this.guestForm.errors);
    console.log('📋 [Guest Information] Provider ID:', this.providerId);
    
    if (!this.guestForm.valid || !this.providerId) {
      console.error('❌ [Guest Information] VALIDATION FAILED!');
      console.error('   - Form valid:', this.guestForm.valid);
      console.error('   - Provider ID:', this.providerId);
      console.error('   - Form errors:', this.guestForm.errors);
      return;
    }
    
    const guestInfo: GuestInfo = this.guestForm.value as GuestInfo;
    console.log('📤 [Guest Information] Dispatching setGuestInfo action:', guestInfo);
    this.store.dispatch(BookingActions.setGuestInfo({ guestInfo }));
    
    // Build complete booking request from store
    console.log('🔄 [Guest Information] Building complete booking from store...');
    combineLatest([
      this.store.select(BookingSelectors.selectDuration),
      this.store.select(BookingSelectors.selectSelectedSlot),
      this.store.select(BookingSelectors.selectGuestInfo)
    ]).pipe(
      take(1),
      filter(([duration, slot, info]) => !!duration && !!slot && !!info)
    ).subscribe(([duration, slot, info]) => {
      console.log('📦 [Guest Information] Store data retrieved:');
      console.log('   - Duration:', duration);
      console.log('   - Selected slot:', slot);
      console.log('   - Guest info:', info);
      
      const booking: Partial<Booking> = {
        providerId: this.providerId,
        availabilityId: slot!.id,
        guestName: info!.name,
        guestEmail: info!.email,
        guestPhone: info!.phone || undefined,
        startTime: slot!.startTime,
        endTime: slot!.endTime,
        notes: info!.notes || undefined
      };
      
      console.log('📋 [Guest Information] Complete booking payload:', booking);
      
      // Dispatch create booking action
      console.log('📤 [Guest Information] Dispatching createBooking action');
      this.store.dispatch(BookingActions.createBooking({ booking }));
    });
    
    // Listen for successful booking creation and navigate
    this.store.select(BookingSelectors.selectBooking)
      .pipe(
        filter(booking => !!booking),
        take(1),
        takeUntil(this.destroy$)
      )
      .subscribe((booking) => {
        console.log('✅ [Guest Information] Booking created successfully:', booking);
        console.log('🚀 [Guest Information] Navigating to confirmation');
        this.router.navigate(['/booking', this.providerId, 'confirmation']);
      });
  }
  
  goBack() {
    if (this.providerId) {
      this.router.navigate(['/booking', this.providerId, 'availability']);
    }
  }
}