import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';

export interface AIRecommendation {
  id: string;
  type: 'optimization' | 'conflict-resolution' | 'efficiency' | 'revenue';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: string;
  action: string;
  estimatedTime?: string;
  estimatedBenefit?: string;
}

@Component({
  selector: 'app-ai-recommendations',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatListModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="ai-recommendations">
      <mat-card-header>
        <mat-card-title>
          <mat-icon class="recommendations-icon">recommend</mat-icon>
          AI Recommendations
          <mat-chip *ngIf="recommendations.length" 
                   [matBadge]="recommendations.length"
                   matBadgeColor="accent"
                   class="count-chip">
            {{ recommendations.length }} suggestions
          </mat-chip>
        </mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <!-- No Recommendations -->
        <div *ngIf="!recommendations.length" class="no-recommendations">
          <mat-icon class="no-data-icon">thumb_up</mat-icon>
          <h3>All Good!</h3>
          <p>No specific recommendations at this time. Your calendar appears to be well-optimized.</p>
        </div>

        <!-- Recommendations List -->
        <mat-list *ngIf="recommendations.length" class="recommendations-list">
          <mat-list-item *ngFor="let rec of recommendations; trackBy: trackByRecommendation"
                         [class]="'priority-' + rec.priority"
                         class="recommendation-item">
            
            <div class="recommendation-content">
              
              <!-- Header -->
              <div class="recommendation-header">
                <div class="title-section">
                  <mat-icon [class]="'type-icon type-' + rec.type">{{ getTypeIcon(rec.type) }}</mat-icon>
                  <h4 class="recommendation-title">{{ rec.title }}</h4>
                </div>
                <mat-chip [class]="'priority-chip priority-' + rec.priority">
                  {{ rec.priority | uppercase }}
                </mat-chip>
              </div>

              <!-- Description -->
              <p class="recommendation-description">{{ rec.description }}</p>

              <!-- Impact & Benefit -->
              <div class="recommendation-details">
                <div class="detail-item" *ngIf="rec.impact">
                  <mat-icon class="detail-icon">trending_up</mat-icon>
                  <span><strong>Impact:</strong> {{ rec.impact }}</span>
                </div>
                
                <div class="detail-item" *ngIf="rec.estimatedBenefit">
                  <mat-icon class="detail-icon">monetization_on</mat-icon>
                  <span><strong>Benefit:</strong> {{ rec.estimatedBenefit }}</span>
                </div>
                
                <div class="detail-item" *ngIf="rec.estimatedTime">
                  <mat-icon class="detail-icon">schedule</mat-icon>
                  <span><strong>Time:</strong> {{ rec.estimatedTime }}</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="recommendation-actions">
                <button mat-raised-button 
                        color="primary"
                        (click)="applyRecommendation.emit(rec)"
                        class="apply-btn">
                  <mat-icon>check</mat-icon>
                  {{ rec.action }}
                </button>
                
                <button mat-button 
                        (click)="dismissRecommendation.emit(rec.id)"
                        class="dismiss-btn">
                  <mat-icon>close</mat-icon>
                  Dismiss
                </button>
                
                <button mat-icon-button 
                        (click)="moreInfo.emit(rec)"
                        matTooltip="More information">
                  <mat-icon>info</mat-icon>
                </button>
              </div>

            </div>
          </mat-list-item>
        </mat-list>

        <!-- Quick Actions -->
        <div *ngIf="recommendations.length" class="quick-actions">
          <button mat-stroked-button 
                  (click)="applyAllHigh()"
                  [disabled]="!hasHighPriorityRecommendations">
            <mat-icon>done_all</mat-icon>
            Apply All High Priority
          </button>
          
          <button mat-button (click)="dismissAll.emit()">
            <mat-icon>clear_all</mat-icon>
            Dismiss All
          </button>
        </div>

      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .ai-recommendations {
      margin: 16px 0;
    }

    .recommendations-icon {
      color: #4caf50;
    }

    .count-chip {
      margin-left: 12px;
      background: #e8f5e8;
      color: #2e7d32;
    }

    .no-recommendations {
      text-align: center;
      padding: 32px 16px;
      color: #666;
    }

    .no-data-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #4caf50;
      margin-bottom: 16px;
    }

    .recommendations-list {
      padding: 0;
    }

    .recommendation-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin: 8px 0;
      padding: 0;
      height: auto;
    }

    .recommendation-item.priority-high {
      border-left: 4px solid #f44336;
      background: #fff3e0;
    }

    .recommendation-item.priority-medium {
      border-left: 4px solid #ff9800;
      background: #f3e5f5;
    }

    .recommendation-item.priority-low {
      border-left: 4px solid #4caf50;
      background: #e8f5e8;
    }

    .recommendation-content {
      padding: 16px;
      width: 100%;
    }

    .recommendation-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .type-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .type-icon.type-optimization {
      color: #2196f3;
    }

    .type-icon.type-conflict-resolution {
      color: #f44336;
    }

    .type-icon.type-efficiency {
      color: #4caf50;
    }

    .type-icon.type-revenue {
      color: #ff9800;
    }

    .recommendation-title {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
    }

    .priority-chip {
      font-size: 10px;
      min-height: 24px;
    }

    .priority-chip.priority-high {
      background: #f44336;
      color: white;
    }

    .priority-chip.priority-medium {
      background: #ff9800;
      color: white;
    }

    .priority-chip.priority-low {
      background: #4caf50;
      color: white;
    }

    .recommendation-description {
      margin: 8px 0;
      color: #666;
      line-height: 1.5;
    }

    .recommendation-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin: 12px 0;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }

    .detail-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #666;
    }

    .recommendation-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .apply-btn {
      min-width: 120px;
    }

    .dismiss-btn {
      color: #666;
    }

    .quick-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      padding: 16px 0;
      border-top: 1px solid #e0e0e0;
      margin-top: 16px;
    }

    @media (max-width: 768px) {
      .recommendation-header {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }

      .recommendation-actions {
        flex-direction: column;
        width: 100%;
      }

      .apply-btn, .dismiss-btn {
        width: 100%;
      }

      .quick-actions {
        flex-direction: column;
      }

      .quick-actions button {
        width: 100%;
      }
    }
  `]
})
export class AIRecommendationsComponent {
  @Input() recommendations: AIRecommendation[] = [];
  
  @Output() applyRecommendation = new EventEmitter<AIRecommendation>();
  @Output() dismissRecommendation = new EventEmitter<string>();
  @Output() dismissAll = new EventEmitter<void>();
  @Output() moreInfo = new EventEmitter<AIRecommendation>();

  get hasHighPriorityRecommendations(): boolean {
    return this.recommendations.some(rec => rec.priority === 'high');
  }

  trackByRecommendation(index: number, rec: AIRecommendation): string {
    return rec.id;
  }

  getTypeIcon(type: string): string {
    const icons = {
      'optimization': 'tune',
      'conflict-resolution': 'warning',
      'efficiency': 'speed',
      'revenue': 'attach_money'
    };
    return icons[type as keyof typeof icons] || 'recommend';
  }

  applyAllHigh(): void {
    const highPriorityRecs = this.recommendations.filter(rec => rec.priority === 'high');
    highPriorityRecs.forEach(rec => this.applyRecommendation.emit(rec));
  }
}