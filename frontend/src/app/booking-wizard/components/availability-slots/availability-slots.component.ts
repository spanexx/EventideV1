import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Subject, combineLatest, merge } from 'rxjs';
import { takeUntil, filter, map, startWith, withLatestFrom } from 'rxjs/operators';
import * as BookingActions from '../../store-bookings/actions/booking.actions';
import * as BookingSelectors from '../../store-bookings/selectors/booking.selectors';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-availability-slots',
  template: `
    <div class="availability-slots">
      <h2>Select a Time Slot</h2>
      <div class="date-navigation">
        <button mat-icon-button (click)="previousDay()"><mat-icon>chevron_left</mat-icon></button>
        <span class="current-date">{{ currentDate | date:'fullDate' }}</span>
        <button mat-icon-button (click)="nextDay()"><mat-icon>chevron_right</mat-icon></button>
      </div>
      
      <div *ngIf="loading$ | async" class="loading">
        <mat-spinner diameter="30"></mat-spinner>
        <span>Loading available slots...</span>
      </div>
      
      <div *ngIf="error$ | async as error" class="error-message">
        {{ error }}
      </div>
      
      <ng-container *ngIf="!(loading$ | async)">
        <ng-container *ngIf="filteredSlots$ | async as slots">
          <div class="slots-grid" *ngIf="$any(slots) && $any(slots).length > 0">
            <button 
              *ngFor="let slot of $any(slots)" 
              mat-raised-button
              [color]="selectedSlot?.id === slot.id ? 'primary' : 'basic'"
              (click)="selectSlot(slot)"
              class="slot-button">
              <div class="slot-date">{{ slot.startTime | date:'EEE, MMM d' }}</div>
              <div class="slot-time">{{ slot.startTime | date:'shortTime' }}</div>
            </button>
          </div>
          
          <div class="no-slots-message" *ngIf="!$any(slots) || $any(slots).length === 0">
            <p>No available slots for the selected duration. Please go back and select a different duration.</p>
          </div>
        </ng-container>
      </ng-container>
      
      <div class="actions">
        <button mat-button (click)="goBack()">Back</button>
        <button mat-raised-button color="primary" [disabled]="!selectedSlot || (loading$ | async)" (click)="confirmSlot()">Continue</button>
      </div>
    </div>
  `,
  styles: [`
    .availability-slots {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    
    .date-navigation {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    
    .current-date {
      font-size: 18px;
      font-weight: 500;
    }
    
    .loading {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #666;
    }
    
    .slots-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      width: 100%;
      max-width: 500px;
    }
    
    .slot-button {
      padding: 12px !important;
      min-height: 70px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    
    .slot-date {
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 4px;
      opacity: 0.8;
    }
    
    .slot-time {
      font-size: 16px;
      font-weight: 600;
    }
    
    .booked-indicator {
      display: block;
      font-size: 10px;
      margin-top: 4px;
    }
    
    .actions {
      display: flex;
      justify-content: space-between;
      width: 100%;
      max-width: 400px;
      margin-top: 20px;
    }
    
    .error-message {
      color: #f44336;
      text-align: center;
    }
    
    .no-slots-message {
      text-align: center;
      padding: 20px;
      color: #666;
    }
    
    .no-slots-message p {
      margin: 0;
    }
  `],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class AvailabilitySlotsComponent implements OnInit, OnDestroy {
  currentDate = new Date();
  selectedSlot: any | null = null;
  private destroy$ = new Subject<void>();
  private currentDate$ = new Subject<Date>();
  private providerId!: string;
  private selectedDuration: number = 30;
  
  availableSlots$: any;
  filteredSlots$: any;
  loading$: any;
  error$: any;
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store
  ) {
    // Initialize observables
    this.availableSlots$ = this.store.select(BookingSelectors.selectAvailability);
    this.loading$ = this.store.select(BookingSelectors.selectBookingLoading);
    this.error$ = this.store.select(BookingSelectors.selectBookingError);
  }
  
  ngOnInit() {
    console.log('🔍 [Availability Slots] Component initialized');
    
    // Get providerId from parent route
    this.providerId = this.route.parent?.snapshot.paramMap.get('providerId') || '';
    console.log('📋 [Availability Slots] Provider ID from route:', this.providerId);
    console.log('📋 [Availability Slots] Current date:', this.currentDate);
    console.log('📋 [Availability Slots] Route snapshot:', this.route.snapshot);
    console.log('📋 [Availability Slots] Parent route snapshot:', this.route.parent?.snapshot);
    
    // Get selected duration from store (without filter to see what's actually there)
    this.store.select(BookingSelectors.selectDuration)
      .pipe(takeUntil(this.destroy$))
      .subscribe(duration => {
        console.log('📋 [Availability Slots] Duration from store (raw):', duration);
        
        if (duration) {
          this.selectedDuration = duration;
          console.log('✅ [Availability Slots] Set selected duration to:', this.selectedDuration);
          this.loadSlotsForDate();
        } else {
          console.warn('⚠️ [Availability Slots] No duration in store! Using default:', this.selectedDuration);
          // Load with default duration anyway
          this.loadSlotsForDate();
        }
      });

    // Filter slots to only show those matching the selected duration AND current date
    // Use merge to trigger re-filtering when either slots or date changes
    this.filteredSlots$ = merge(
      this.availableSlots$,
      this.currentDate$.pipe(withLatestFrom(this.availableSlots$), map(([_, slots]) => slots))
    ).pipe(
      map((slots: any) => {
        console.log('🔍 [Availability Slots] Filtering slots...');
        console.log('📊 [Availability Slots] Total slots from API:', slots?.length || 0);
        console.log('📅 [Availability Slots] Current selected date:', this.currentDate);
        console.log('📋 [Availability Slots] Selected duration:', this.selectedDuration);
        
        if (!slots || slots.length === 0) {
          console.log('📊 [Availability Slots] No slots to filter');
          return [];
        }
        
        // Get current date at midnight for comparison
        const currentDateOnly = new Date(this.currentDate);
        currentDateOnly.setHours(0, 0, 0, 0);
        
        // Filter slots that match BOTH duration AND date AND are not booked
        const filtered = slots.filter((slot: any) => {
          const slotDate = new Date(slot.startTime);
          slotDate.setHours(0, 0, 0, 0);
          
          const durationMatches = slot.duration === this.selectedDuration;
          const dateMatches = slotDate.getTime() === currentDateOnly.getTime();
          const notBooked = !slot.isBooked;
          
          return durationMatches && dateMatches && notBooked;
        });
        
        console.log('📊 [Availability Slots] Filtered slots (duration + date match):', filtered.length);
        
        if (filtered.length === 0 && slots.length > 0) {
          console.warn('⚠️ [Availability Slots] No slots match selected duration and date!');
          console.warn('   Selected duration:', this.selectedDuration);
          console.warn('   Selected date:', currentDateOnly.toDateString());
          console.warn('   Available dates:', [...new Set(slots.map((s: any) => new Date(s.startTime).toDateString()))]);
        } else if (filtered.length > 0) {
          console.log('✅ [Availability Slots] Showing filtered slots:', filtered.map((s: any) => ({
            id: s.id,
            date: new Date(s.startTime).toDateString(),
            time: new Date(s.startTime).toTimeString(),
            duration: s.duration
          })));
        }
        
        return filtered;
      })
    );
    
    // Log available slots changes
    this.availableSlots$.pipe(takeUntil(this.destroy$)).subscribe((slots: any) => {
      console.log('📦 [Availability Slots] Available slots updated:', slots);
      console.log('📊 [Availability Slots] Number of slots:', slots?.length || 0);
      if (slots && slots.length > 0) {
        console.log('🎯 [Availability Slots] First slot example:', slots[0]);
      }
    });

    // Log loading state changes
    this.loading$.pipe(takeUntil(this.destroy$)).subscribe((loading: any) => {
      console.log('⏳ [Availability Slots] Loading state:', loading);
    });

    // Log error state changes
    this.error$.pipe(takeUntil(this.destroy$)).subscribe((error: any) => {
      if (error) {
        console.error('❌ [Availability Slots] Error:', error);
      }
    });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  selectSlot(slot: any) {
    console.log('🎯 [Availability Slots] Slot selected:', slot);
    this.selectedSlot = slot;
    console.log('✅ [Availability Slots] Current selected slot:', this.selectedSlot);
  }
  
  confirmSlot() {
    console.log('🎯 [Availability Slots] confirmSlot() called');
    console.log('📋 [Availability Slots] Selected slot:', this.selectedSlot);
    console.log('📋 [Availability Slots] Provider ID:', this.providerId);
    
    if (this.selectedSlot && this.providerId) {
      // Dispatch selected slot to store
      console.log('📤 [Availability Slots] Dispatching setSelectedSlot action:', this.selectedSlot);
      this.store.dispatch(BookingActions.setSelectedSlot({ slot: this.selectedSlot }));
      
      // Navigate to guest information
      const navigationPath = ['/booking', this.providerId, 'information'];
      console.log('🚀 [Availability Slots] Navigating to:', navigationPath);
      this.router.navigate(navigationPath);
    } else {
      console.error('❌ [Availability Slots] Cannot confirm - missing data!');
      console.error('   - Selected slot:', this.selectedSlot);
      console.error('   - Provider ID:', this.providerId);
    }
  }
  
  previousDay() {
    console.log('⬅️ [Availability Slots] Previous day clicked');
    // Create new date (avoid mutation)
    this.currentDate = new Date(this.currentDate);
    this.currentDate.setDate(this.currentDate.getDate() - 1);
    console.log('📅 [Availability Slots] New current date:', this.currentDate);
    this.currentDate$.next(this.currentDate);
    this.loadSlotsForDate();
  }
  
  nextDay() {
    console.log('➡️ [Availability Slots] Next day clicked');
    // Create new date (avoid mutation)
    this.currentDate = new Date(this.currentDate);
    this.currentDate.setDate(this.currentDate.getDate() + 1);
    console.log('📅 [Availability Slots] New current date:', this.currentDate);
    this.currentDate$.next(this.currentDate);
    this.loadSlotsForDate();
  }
  
  goBack() {
    if (this.providerId) {
      this.router.navigate(['/booking', this.providerId, 'duration']);
    }
  }
  
  private loadSlotsForDate() {
    console.log('📡 [Availability Slots] loadSlotsForDate() called');
    console.log('📋 [Availability Slots] Provider ID:', this.providerId);
    console.log('📋 [Availability Slots] Selected duration:', this.selectedDuration);
    console.log('📋 [Availability Slots] Current date:', this.currentDate);
    
    if (this.providerId && this.selectedDuration) {
      const request = {
        providerId: this.providerId,
        date: new Date(this.currentDate),
        duration: this.selectedDuration
      };
      console.log('📤 [Availability Slots] Dispatching loadAvailableSlots action with request:', request);
      this.store.dispatch(BookingActions.loadAvailableSlots({ request }));
    } else {
      console.error('❌ [Availability Slots] Cannot load slots - missing data!');
      console.error('   - Provider ID:', this.providerId);
      console.error('   - Selected duration:', this.selectedDuration);
    }
  }
}