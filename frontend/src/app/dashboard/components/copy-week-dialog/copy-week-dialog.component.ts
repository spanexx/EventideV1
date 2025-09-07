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
  selector: 'app-copy-week-dialog',
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
  templateUrl: './copy-week-dialog.component.html',
  styleUrl: './copy-week-dialog.component.scss'
})
export class CopyWeekDialogComponent {
  sourceWeek: Date = new Date();
  targetWeek: Date = new Date();

  constructor(
    public dialogRef: MatDialogRef<CopyWeekDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Set target week to next week by default
    this.targetWeek.setDate(this.targetWeek.getDate() + 7);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onCopyClick(): void {
    // Return the selected weeks for copying
    // The actual copying is handled in the availability component
    this.dialogRef.close({
      sourceWeek: this.sourceWeek,
      targetWeek: this.targetWeek
    });
  }
}