import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FilterOptions } from '../../services/smart-calendar-manager.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-calendar-filter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <h2 matDialogTitle>Filter Calendar</h2>
    <mat-dialog-content>
      <form [formGroup]="filterForm">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Slot Type</mat-label>
          <mat-select formControlName="type">
            <mat-option value="all">All Slots</mat-option>
            <mat-option value="booked">Booked Slots</mat-option>
            <mat-option value="available">Available Slots</mat-option>
          </mat-select>
        </mat-form-field>
        
        <div class="date-range-container">
          <mat-form-field appearance="fill" class="half-width">
            <mat-label>Start Date</mat-label>
            <input matInput [matDatepicker]="startDatePicker" formControlName="startDate">
            <mat-datepicker-toggle matSuffix [for]="startDatePicker"></mat-datepicker-toggle>
            <mat-datepicker #startDatePicker></mat-datepicker>
          </mat-form-field>
          
          <mat-form-field appearance="fill" class="half-width">
            <mat-label>End Date</mat-label>
            <input matInput [matDatepicker]="endDatePicker" formControlName="endDate">
            <mat-datepicker-toggle matSuffix [for]="endDatePicker"></mat-datepicker-toggle>
            <mat-datepicker #endDatePicker></mat-datepicker>
          </mat-form-field>
        </div>
        
        <div class="duration-container">
          <mat-form-field appearance="fill" class="half-width">
            <mat-label>Minimum Duration (minutes)</mat-label>
            <input matInput type="number" formControlName="minDuration">
          </mat-form-field>
          
          <mat-form-field appearance="fill" class="half-width">
            <mat-label>Maximum Duration (minutes)</mat-label>
            <input matInput type="number" formControlName="maxDuration">
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onApply()">Apply Filters</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .half-width {
      width: 48%;
      margin-bottom: 16px;
    }
    
    .date-range-container, .duration-container {
      display: flex;
      justify-content: space-between;
    }
    
    @media (max-width: 600px) {
      .half-width {
        width: 100%;
      }
      
      .date-range-container, .duration-container {
        flex-direction: column;
      }
    }
  `]
})
export class CalendarFilterDialogComponent {
  filterForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CalendarFilterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { filters: FilterOptions }
  ) {
    this.filterForm = this.fb.group({
      type: [data.filters?.type || 'all'],
      startDate: [data.filters?.dateRange?.start || null],
      endDate: [data.filters?.dateRange?.end || null],
      minDuration: [data.filters?.minDuration || null],
      maxDuration: [data.filters?.maxDuration || null]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onApply(): void {
    const formValue = this.filterForm.value;
    const filters: FilterOptions = {
      type: formValue.type
    };

    if (formValue.startDate || formValue.endDate) {
      filters.dateRange = {
        start: formValue.startDate || new Date(),
        end: formValue.endDate || new Date()
      };
    }

    if (formValue.minDuration) {
      filters.minDuration = formValue.minDuration;
    }

    if (formValue.maxDuration) {
      filters.maxDuration = formValue.maxDuration;
    }

    this.dialogRef.close(filters);
  }
}