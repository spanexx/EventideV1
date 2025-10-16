import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Booking, BookingStatus } from '../../models/booking.models';

@Component({
  selector: 'app-booking-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="booking-edit-dialog">
      <h2 mat-dialog-title>
        <mat-icon>edit</mat-icon>
        Edit Booking
      </h2>
      
      <form [formGroup]="bookingForm" (ngSubmit)="onSave()">
        <mat-dialog-content>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Guest Name</mat-label>
              <input matInput formControlName="guestName" required>
              <mat-error *ngIf="bookingForm.get('guestName')?.hasError('required')">
                Guest name is required
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Guest Email</mat-label>
              <input matInput type="email" formControlName="guestEmail" required>
              <mat-error *ngIf="bookingForm.get('guestEmail')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="bookingForm.get('guestEmail')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Phone (Optional)</mat-label>
              <input matInput formControlName="guestPhone">
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Start Time</mat-label>
              <input matInput 
                     type="datetime-local" 
                     formControlName="startTime" 
                     required>
              <mat-error *ngIf="bookingForm.get('startTime')?.hasError('required')">
                Start time is required
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Duration (minutes)</mat-label>
              <input matInput 
                     type="number" 
                     formControlName="duration" 
                     min="15" 
                     step="15" 
                     required>
              <mat-error *ngIf="bookingForm.get('duration')?.hasError('required')">
                Duration is required
              </mat-error>
              <mat-error *ngIf="bookingForm.get('duration')?.hasError('min')">
                Minimum duration is 15 minutes
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status" required>
                <mat-option value="pending">Pending</mat-option>
                <mat-option value="confirmed">Confirmed</mat-option>
                <mat-option value="cancelled">Cancelled</mat-option>
                <mat-option value="completed">Completed</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Notes</mat-label>
              <textarea matInput 
                        formControlName="notes" 
                        rows="3" 
                        placeholder="Additional notes or requirements..."></textarea>
            </mat-form-field>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button type="button" (click)="onCancel()">
            Cancel
          </button>
          <button mat-raised-button 
                  color="primary" 
                  type="submit" 
                  [disabled]="bookingForm.invalid">
            <mat-icon>save</mat-icon>
            Save Changes
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .booking-edit-dialog {
      min-width: 500px;
      max-width: 600px;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-lg);
      
      mat-icon {
        color: var(--primary);
      }
    }

    mat-dialog-content {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      max-height: 60vh;
      overflow-y: auto;
    }

    .form-row {
      display: flex;
      flex-direction: column;
    }

    mat-form-field {
      width: 100%;
    }

    mat-dialog-actions {
      padding-top: var(--spacing-lg);
      gap: var(--spacing-sm);
    }

    @media (max-width: 600px) {
      .booking-edit-dialog {
        min-width: unset;
        width: 100%;
      }
    }
  `]
})
export class BookingEditDialogComponent {
  bookingForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BookingEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { booking: Booking }
  ) {
    this.bookingForm = this.createForm();
  }

  private createForm(): FormGroup {
    const booking = this.data.booking;
    
    return this.fb.group({
      guestName: [booking.guestName || '', Validators.required],
      guestEmail: [booking.guestEmail || '', [Validators.required, Validators.email]],
      guestPhone: [booking.guestPhone || ''],
      startTime: [this.formatDateTimeLocal(booking.startTime?.toString() || ''), Validators.required],
      duration: [booking.duration || 60, [Validators.required, Validators.min(15)]],
      status: [booking.status || 'pending', Validators.required],
      notes: [booking.notes || '']
    });
  }

  private formatDateTimeLocal(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  onSave(): void {
    if (this.bookingForm.valid) {
      const formValue = this.bookingForm.value;
      
      // Calculate end time based on start time and duration
      const startTime = new Date(formValue.startTime);
      const endTime = new Date(startTime.getTime() + (formValue.duration * 60000));
      
      const updatedBooking = {
        ...this.data.booking,
        ...formValue,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };

      this.dialogRef.close(updatedBooking);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
