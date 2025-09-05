import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import * as BookingActions from '../../store/actions/booking.actions';
import * as BookingSelectors from '../../store/selectors/booking.selectors';
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
      
      <div class="slots-grid" *ngIf="!(loading$ | async)">
        <button 
          *ngFor="let slot of availableSlots$ | async" 
          mat-raised-button
          [color]="selectedSlot?.id === slot.id ? 'primary' : 'basic'"
          (click)="selectSlot(slot)"
          [disabled]="slot.isBooked">
          {{ slot.startTime | date:'shortTime' }}
          <span *ngIf="slot.isBooked" class="booked-indicator">Booked</span>
        </button>
      </div>
      
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
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      width: 100%;
      max-width: 400px;
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
  `],
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class AvailabilitySlotsComponent {
  currentDate = new Date();
  selectedSlot: any | null = null;
  
  availableSlots$!: any;
  loading$!: any;
  error$!: any;
  
  constructor(
    private router: Router,
    private store: Store
  ) {
    // Initialize observables after store is injected
    this.availableSlots$ = this.store.select(BookingSelectors.selectAvailability);
    this.loading$ = this.store.select(BookingSelectors.selectBookingLoading);
    this.error$ = this.store.select(BookingSelectors.selectBookingError);
    
    // Load available slots for the current date
    this.store.dispatch(BookingActions.loadAvailableSlots({
      request: {
        providerId: 'provider-123', // This would come from route parameters or store in a real app
        date: this.currentDate,
        duration: 30 // This would come from the previously selected duration
      }
    }));
  }
  
  selectSlot(slot: any) {
    this.selectedSlot = slot;
  }
  
  confirmSlot() {
    if (this.selectedSlot) {
      // In a real implementation, we would dispatch an action to set the selected slot
      this.store.dispatch(BookingActions.setSelectedSlot({ slot: this.selectedSlot }));
      // For now, we'll just navigate to the next step
      this.router.navigate(['/booking/information']);
    }
  }
  
  previousDay() {
    // Navigate to previous day
    this.currentDate.setDate(this.currentDate.getDate() - 1);
    this.loadSlotsForDate();
  }
  
  nextDay() {
    // Navigate to next day
    this.currentDate.setDate(this.currentDate.getDate() + 1);
    this.loadSlotsForDate();
  }
  
  goBack() {
    this.router.navigate(['/booking/duration']);
  }
  
  private loadSlotsForDate() {
    this.store.dispatch(BookingActions.loadAvailableSlots({
      request: {
        providerId: 'provider-123',
        date: this.currentDate,
        duration: 30
      }
    }));
  }
}