import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

export interface RecommendationDialogData {
  recommendations: any[];
}

@Component({
  selector: 'app-smart-calendar-recommendations-dialog',
  templateUrl: './smart-calendar-recommendations-dialog.component.html',
  styleUrls: ['./smart-calendar-recommendations-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule]
})
export class SmartCalendarRecommendationsDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RecommendationDialogData
  ) {}
}