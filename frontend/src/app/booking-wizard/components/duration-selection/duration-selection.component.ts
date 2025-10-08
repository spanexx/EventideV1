import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import * as BookingActions from '../../store-bookings/actions/booking.actions';
import * as BookingSelectors from '../../store-bookings/selectors/booking.selectors';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-duration-selection',
  template: `
    <div class="duration-selection">
      <h2>Select Appointment Duration</h2>
      
      <div *ngIf="loading" class="loading">
        <p>Loading available durations...</p>
      </div>
      
      <div *ngIf="!loading && durationOptions.length === 0" class="error-message">
        <p>No available durations for this provider.</p>
      </div>
      
      <mat-form-field *ngIf="!loading && durationOptions.length > 0">
        <mat-select placeholder="Duration" [(ngModel)]="selectedDuration">
          <mat-option *ngFor="let option of durationOptions" [value]="option.value">
            {{option.label}}
          </mat-option>
        </mat-select>
      </mat-form-field>
      
      <div *ngIf="error$ | async as error" class="error-message">
        {{ error }}
      </div>
      
      <button mat-raised-button color="primary" (click)="selectDuration()" [disabled]="loading || !selectedDuration">Continue</button>
    </div>
  `,
  styles: [`
    .duration-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    
    mat-form-field {
      width: 200px;
    }
    
    .error-message {
      color: #f44336;
      text-align: center;
    }
    
    .loading {
      text-align: center;
      color: #666;
      padding: 20px;
    }
  `],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule
  ]
})
export class DurationSelectionComponent implements OnInit, OnDestroy {
  durationOptions: { value: number; label: string }[] = [];
  
  selectedDuration: number = 0;
  error$!: any;
  private providerId!: string;
  loading: boolean = true;
  private destroy$ = new Subject<void>();
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store
  ) {
    this.error$ = this.store.select(BookingSelectors.selectBookingError);
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  ngOnInit() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔍 [Duration Selection] Component initialized');
    console.log('═══════════════════════════════════════════════════');
    
    // Get providerId from parent route
    this.providerId = this.route.parent?.snapshot.paramMap.get('providerId') || '';
    console.log('📋 [Duration Selection] Provider ID from route:', this.providerId);
    
    if (!this.providerId) {
      console.error('❌ [Duration Selection] CRITICAL: No provider ID found in route!');
      this.loading = false;
      return;
    }
    
    // Load provider's availability to get unique durations
    this.store.dispatch(BookingActions.loadAvailableSlots({
      request: {
        providerId: this.providerId,
        date: new Date(),
        duration: 0 // Load all slots regardless of duration
      }
    }));
    
    // Get unique durations from provider's availability
    this.store.select(BookingSelectors.selectAvailability)
      .pipe(takeUntil(this.destroy$))
      .subscribe((slots: any) => {
        console.log('📋 [Duration Selection] Slots received:', slots);
        console.log('📋 [Duration Selection] Slots count:', slots?.length);
        
        if (slots && slots.length > 0) {
          // Log first slot to see structure
          console.log('📋 [Duration Selection] First slot structure:', slots[0]);
          
          // Extract unique durations, filtering out undefined/null values
          const durations = slots
            .map((slot: any) => slot.duration)
            .filter((duration: any) => duration !== undefined && duration !== null && !isNaN(duration));
          
          console.log('📋 [Duration Selection] All durations:', durations);
          
          const uniqueDurations = [...new Set(durations)] as number[];
          uniqueDurations.sort((a: number, b: number) => a - b);
          console.log('📋 [Duration Selection] Unique durations found:', uniqueDurations);
          
          // Create duration options
          this.durationOptions = uniqueDurations.map((duration: number) => ({
            value: duration,
            label: `${duration} minutes`
          }));
          
          console.log('✅ [Duration Selection] Duration options:', this.durationOptions);
          
          // Set default to first available duration
          if (!this.selectedDuration && this.durationOptions.length > 0) {
            this.selectedDuration = this.durationOptions[0].value;
            console.log('✅ [Duration Selection] Set default duration to:', this.selectedDuration);
          } else if (this.durationOptions.length === 0) {
            console.error('❌ [Duration Selection] No valid durations found in slots!');
          }
          
          this.loading = false;
        } else {
          console.warn('⚠️ [Duration Selection] No slots received or empty array');
        }
      });
    
    // Load previously selected duration if exists
    this.store.select(BookingSelectors.selectDuration)
      .pipe(takeUntil(this.destroy$))
      .subscribe(duration => {
        console.log('📋 [Duration Selection] Duration from store (raw):', duration);
        if (duration && this.durationOptions.some(opt => opt.value === duration)) {
          this.selectedDuration = duration;
          console.log('✅ [Duration Selection] Restored duration from store:', this.selectedDuration);
        }
      });

    // Monitor loading state
    this.store.select(BookingSelectors.selectBookingLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        console.log('⏳ [Duration Selection] Loading state from store:', loading);
        // Don't override local loading if we're still waiting for slots
        if (!loading && this.durationOptions.length === 0) {
          // If loading finished but no options, set a timeout fallback
          setTimeout(() => {
            if (this.durationOptions.length === 0) {
              console.warn('⚠️ [Duration Selection] No duration options after loading');
              this.loading = false;
            }
          }, 2000);
        }
      });

    // Log the entire booking state
    this.store.select(BookingSelectors.selectBookingState)
      .pipe(take(1))
      .subscribe(state => {
        console.log('📦 [Duration Selection] Full booking state:', state);
      });
  }
  
  selectDuration() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🎯 [Duration Selection] selectDuration() called');
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 [Duration Selection] Selected duration:', this.selectedDuration);
    console.log('📋 [Duration Selection] Duration type:', typeof this.selectedDuration);
    console.log('📋 [Duration Selection] Provider ID:', this.providerId);
    
    if (!this.selectedDuration || !this.providerId) {
      console.error('❌ [Duration Selection] VALIDATION FAILED - Missing required data!');
      console.error('   - Selected duration:', this.selectedDuration);
      console.error('   - Provider ID:', this.providerId);
      return;
    }
    
    // Dispatch duration to store
    const durationPayload = { duration: this.selectedDuration };
    console.log('📤 [Duration Selection] Dispatching setDuration action with payload:', durationPayload);
    this.store.dispatch(BookingActions.setDuration(durationPayload));
    
    // Verify the action was dispatched
    console.log('✅ [Duration Selection] Action dispatched successfully');
    
    // Wait a moment to verify store update
    setTimeout(() => {
      this.store.select(BookingSelectors.selectDuration).subscribe(duration => {
        console.log('🔄 [Duration Selection] Duration in store after dispatch:', duration);
      }).unsubscribe();
    }, 100);
    
    // Navigate to availability with providerId
    const navigationPath = ['/booking', this.providerId, 'availability'];
    console.log('🚀 [Duration Selection] Navigating to:', navigationPath);
    console.log('═══════════════════════════════════════════════════');
    this.router.navigate(navigationPath);
  }
}