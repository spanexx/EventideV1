import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-complete-booking-dialog',
  template: `
    <h2 mat-dialog-title>Complete Booking</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Reason for early completion (optional)</mat-label>
          <textarea matInput formControlName="reason" rows="3" 
                    placeholder="Enter reason if completing before scheduled end time"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onComplete()">Complete</button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule
  ]
})
export class CompleteBookingDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CompleteBookingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { bookingId: string; isEarly: boolean }
  ) {
    this.form = this.fb.group({
      reason: ['', data.isEarly ? [Validators.required] : []]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onComplete(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        reason: this.form.value.reason
      });
    }
  }
}
