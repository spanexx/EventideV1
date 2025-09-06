import { Component, Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import * as AvailabilityActions from '../../store/actions/availability.actions';
import { Availability } from '../../models/availability.models';
import { MockAvailabilityService } from '../../services/mock-availability.service';

@Component({
  selector: 'app-availability-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatSelectModule,
    MatSnackBarModule,
    FormsModule
  ],
  templateUrl: './availability-dialog.component.html',
  styleUrl: './availability-dialog.component.scss'
})
export class AvailabilityDialogComponent {
  availability: Availability;
  isNew: boolean;

  constructor(
    public dialogRef: MatDialogRef<AvailabilityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { availability: Availability | null, date: Date },
    private store: Store,
    private mockAvailabilityService: MockAvailabilityService,
    private snackBar: MatSnackBar
  ) {
    this.isNew = !data.availability;
    
    if (data.availability) {
      this.availability = { ...data.availability };
      // Calculate duration based on start and end times for existing slots
      if (this.availability.startTime && this.availability.endTime) {
        const start = new Date(this.availability.startTime);
        const end = new Date(this.availability.endTime);
        this.availability.duration = (end.getTime() - start.getTime()) / (1000 * 60);
      }
    } else {
      this.availability = {
        id: '',
        providerId: 'provider-123',
        date: data.date,
        startTime: new Date(data.date.setHours(9, 0, 0, 0)),
        endTime: new Date(data.date.setHours(10, 0, 0, 0)),
        isBooked: false,
        isRecurring: false,
        duration: 60
      };
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onDurationChange(): void {
    // Update end time based on duration
    if (this.availability.startTime) {
      const start = new Date(this.availability.startTime);
      start.setMinutes(start.getMinutes() + this.availability.duration);
      this.availability.endTime = start;
    }
  }

  onSaveClick(): void {
    // Ensure end time is correctly set based on duration before saving
    this.onDurationChange();
    
    // Check for conflicts
    if (this.mockAvailabilityService.hasConflicts(this.availability)) {
      this.snackBar.open('This slot conflicts with an existing availability slot!', 'Close', {
        duration: 3000,
        verticalPosition: 'top',
        horizontalPosition: 'center',
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    if (this.isNew) {
      this.store.dispatch(AvailabilityActions.createAvailability({ availability: this.availability }));
    } else {
      this.store.dispatch(AvailabilityActions.updateAvailability({ availability: this.availability }));
    }
    this.dialogRef.close(this.availability);
  }
}