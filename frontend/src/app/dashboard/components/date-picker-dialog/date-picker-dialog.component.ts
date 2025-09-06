import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-date-picker-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule
  ],
  templateUrl: './date-picker-dialog.component.html',
  styleUrl: './date-picker-dialog.component.scss'
})
export class DatePickerDialogComponent {
  selectedDate: Date = new Date();

  constructor(
    public dialogRef: MatDialogRef<DatePickerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    if (data && data.date) {
      this.selectedDate = new Date(data.date);
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onGoToDate(): void {
    this.dialogRef.close(this.selectedDate);
  }
}