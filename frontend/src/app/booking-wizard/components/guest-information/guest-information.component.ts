import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Subject, combineLatest } from 'rxjs';
import { take, filter, takeUntil, tap } from 'rxjs/operators';
import * as BookingActions from '../../store-bookings/actions/booking.actions';
import * as BookingSelectors from '../../store-bookings/selectors/booking.selectors';
import { GuestInfo, Booking } from '../../../shared/models/booking.models';
import { ProviderInfoService } from '../../services/provider-info.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-guest-information',
  templateUrl: './guest-information.component.html',
  styleUrls: ['./guest-information.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  standalone: true
})
export class GuestInformationComponent implements OnInit, OnDestroy {
  guestForm: ReturnType<typeof FormBuilder.prototype.group>;
  private destroy$ = new Subject<void>();
  private providerId: string = '';
  loading$: ReturnType<typeof Store.prototype.select>;
  error$: ReturnType<typeof Store.prototype.select>;
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private store: Store,
    private providerInfoService: ProviderInfoService
  ) {
    this.guestForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^(\+\d{1,3})?\d{10,15}$/)]],
      notes: ['']
    }, {
      validators: [this.validatePhoneIfProvided]
    });
    
    this.loading$ = this.store.select(BookingSelectors.selectBookingLoading);
    this.error$ = this.store.select(BookingSelectors.selectBookingError);
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
    this.store.select(BookingSelectors.selectBookingState)
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
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
      this.store.select(BookingSelectors.selectSelectedSlot),
      this.store.select(BookingSelectors.selectGuestInfo)
    ]).pipe(
      take(1),
      filter(([slot, info]) => !!slot && !!info),
      tap(([slot, info]) => {
        console.log('📦 [Guest Information] Data for booking:', { 
          slot,
          info,
          duration: slot?.duration
        });
      })
    ).subscribe(([slot, info]) => {
      console.log('📦 [Guest Information] Store data retrieved:');
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
        duration: slot!.duration,
        notes: info!.notes || undefined
      };
      
      if (!booking.availabilityId || !booking.guestEmail || !booking.guestName) {
        console.error('❌ [Guest Information] Missing required booking data:', booking);
        return;
      }

      console.log('📋 [Guest Information] Complete booking payload:', booking);
      
      // Dispatch create booking action
      console.log('📤 [Guest Information] Dispatching createBooking action');
      this.store.dispatch(BookingActions.createBooking({ booking }));

      // Wait for loading to start
      this.store.select(BookingSelectors.selectBookingLoading)
        .pipe(
          filter(loading => loading === true),
          take(1)
        )
        .subscribe(() => {
          console.log('⏳ [Guest Information] Booking creation started...');
        });
      
      // Listen for successful booking creation and navigate
      combineLatest([
        this.store.select(BookingSelectors.selectBooking),
        this.store.select(BookingSelectors.selectBookingError),
        this.store.select(BookingSelectors.selectBookingLoading)
      ])
      .pipe(
        takeUntil(this.destroy$),
        tap(([booking, error, loading]: [Booking | null, string | null, boolean]) => {
          console.log('🔄 [Guest Information] Booking state update:', { 
            bookingId: booking?.id,
            error,
            loading,
            hasBooking: !!booking,
            hasError: !!error
          });
        }),
        filter(([_, __, loading]) => loading === false), // Wait for loading to complete
        take(1)
      )
      .subscribe(([booking, error, _]) => {
        if (booking) {
          console.log('✅ [Guest Information] Booking created successfully:', {
            id: booking.id,
            status: booking.status,
            serialKey: booking.serialKey,
            totalAmount: booking.totalAmount,
            paymentStatus: booking.paymentStatus
          });

          const requiresPayment = this.providerInfoService.requiresPayment();
          const bookingRequiresPayment = booking.totalAmount && booking.totalAmount > 0;

          if (requiresPayment && bookingRequiresPayment && booking.paymentStatus === 'pending') {
            this.router.navigate(['/booking', this.providerId, 'payment-checkout'], {
              queryParams: { bookingId: booking.id }
            });
          } else {
            this.router.navigate(['/booking', this.providerId, 'confirmation']);
          }
        } else if (error) {
          console.error('❌ [Guest Information] Booking creation failed:', error);
        } else {
          console.error('⚠️ [Guest Information] No booking and no error received');
        }
      });
    });
  }
  
  goBack() {
    if (this.providerId) {
      this.router.navigate(['/booking', this.providerId, 'availability']);
    }
  }
}
