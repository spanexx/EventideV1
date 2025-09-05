import { Component, Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import * as AvailabilityActions from '../../store/actions/availability.actions';
import { Availability } from '../../models/availability.models';

@Component({
  selector: 'app-availability-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
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
    private store: Store
  ) {
    this.isNew = !data.availability;
    
    if (data.availability) {
      this.availability = { ...data.availability };
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

  onSaveClick(): void {
    if (this.isNew) {
      this.store.dispatch(AvailabilityActions.createAvailability({ availability: this.availability }));
    } else {
      this.store.dispatch(AvailabilityActions.updateAvailability({ availability: this.availability }));
    }
    this.dialogRef.close(this.availability);
  }
}