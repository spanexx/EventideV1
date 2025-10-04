import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { ContentMetrics } from '../../services/smart-calendar-manager.service';

export interface AnalysisDialogData {
  metrics: ContentMetrics;
  viewRecommendation: string;
  occupancyRate: number;
}

@Component({
  selector: 'app-smart-calendar-analysis-dialog',
  templateUrl: './smart-calendar-analysis-dialog.component.html',
  styleUrls: ['./smart-calendar-analysis-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule]
})
export class SmartCalendarAnalysisDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AnalysisDialogData
  ) {}
}