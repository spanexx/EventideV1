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

  getRecommendationIcon(type: string): string {
    switch (type) {
      case 'low_occupancy':
        return 'schedule';
      case 'high_occupancy':
        return 'event_busy';
      case 'conflicts':
        return 'warning';
      case 'view_change':
        return 'visibility';
      default:
        return 'lightbulb';
    }
  }

  getRecommendationTitle(type: string): string {
    switch (type) {
      case 'low_occupancy':
        return 'Low Calendar Occupancy';
      case 'high_occupancy':
        return 'High Calendar Occupancy';
      case 'conflicts':
        return 'Schedule Conflicts Detected';
      case 'view_change':
        return 'View Optimization';
      default:
        return 'Smart Recommendation';
    }
  }
}