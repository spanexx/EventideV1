import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import * as BookingSelectors from '../../store/selectors/booking.selectors';
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
      <mat-form-field>
        <mat-select placeholder="Duration" [(ngModel)]="selectedDuration">
          <mat-option *ngFor="let option of durationOptions" [value]="option.value">
            {{option.label}}
          </mat-option>
        </mat-select>
      </mat-form-field>
      
      <div *ngIf="error$ | async as error" class="error-message">
        {{ error }}
      </div>
      
      <button mat-raised-button color="primary" (click)="selectDuration()">Continue</button>
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
export class DurationSelectionComponent {
  durationOptions = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '60 minutes' },
    { value: 90, label: '90 minutes' }
  ];
  
  selectedDuration: number = 30;
  error$!: any;
  
  constructor(
    private router: Router,
    private store: Store
  ) {
    this.error$ = this.store.select(BookingSelectors.selectBookingError);
  }
  
  selectDuration() {
    // In a real implementation, we would dispatch an action to set the duration
    // For now, we'll just navigate to the next step
    this.router.navigate(['/booking/availability']);
  }
}