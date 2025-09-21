import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface AIInsightSummary {
  conflictsCount: number;
  patternsCount: number;
  optimizationsCount: number;
  summary: string;
  lastUpdate?: Date;
  hasHighPriorityIssues: boolean;
}

@Component({
  selector: 'app-ai-insights-compact',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="ai-compact-insights">
      <mat-card-content>
        <!-- Loading State -->
        <div *ngIf="loading" class="status-item loading">
          <mat-spinner diameter="24"></mat-spinner>
          <span>Analyzing...</span>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !loading" class="status-item error">
          <mat-icon>error_outline</mat-icon>
          <span>AI unavailable</span>
          <button mat-icon-button (click)="retry.emit()" matTooltip="Retry">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>

        <!-- AI Insights Summary -->
        <div *ngIf="insights && !loading && !error" class="insights-summary">
          
          <!-- Priority Alert -->
          <div *ngIf="insights.hasHighPriorityIssues" class="priority-alert">
            <mat-icon class="alert-icon">priority_high</mat-icon>
            <span>High priority issues detected</span>
          </div>

          <!-- Metrics Row -->
          <div class="metrics-row">
            
            <!-- Conflicts -->
            <div class="metric-item" 
                 [class.has-issues]="insights.conflictsCount > 0"
                 (click)="viewDetails.emit('conflicts')"
                 matTooltip="View conflict details">
              <mat-icon [class.warning]="insights.conflictsCount > 0">warning</mat-icon>
              <div class="metric-content">
                <span class="metric-count">{{ insights.conflictsCount }}</span>
                <span class="metric-label">Conflicts</span>
              </div>
            </div>

            <!-- Patterns -->
            <div class="metric-item" 
                 [class.has-data]="insights.patternsCount > 0"
                 (click)="viewDetails.emit('patterns')"
                 matTooltip="View pattern analysis">
              <mat-icon [class.active]="insights.patternsCount > 0">trending_up</mat-icon>
              <div class="metric-content">
                <span class="metric-count">{{ insights.patternsCount }}</span>
                <span class="metric-label">Patterns</span>
              </div>
            </div>

            <!-- Optimizations -->
            <div class="metric-item" 
                 [class.has-data]="insights.optimizationsCount > 0"
                 (click)="viewDetails.emit('optimizations')"
                 matTooltip="View optimization opportunities">
              <mat-icon [class.active]="insights.optimizationsCount > 0">tune</mat-icon>
              <div class="metric-content">
                <span class="metric-count">{{ insights.optimizationsCount }}</span>
                <span class="metric-label">Optimizations</span>
              </div>
            </div>

          </div>

          <!-- Summary Text -->
          <div class="summary-text" *ngIf="insights.summary">
            {{ insights.summary }}
          </div>

          <!-- Actions -->
          <div class="actions-row">
            <button mat-stroked-button 
                    size="small"
                    (click)="viewDetails.emit('all')"
                    class="view-all-btn">
              <mat-icon>analytics</mat-icon>
              View All Insights
            </button>
            
            <button mat-icon-button 
                    (click)="refresh.emit()"
                    [disabled]="loading"
                    matTooltip="Refresh AI analysis"
                    class="refresh-btn">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>

        </div>

        <!-- No Data State -->
        <div *ngIf="!insights && !loading && !error" class="no-data">
          <mat-icon>psychology</mat-icon>
          <span>No AI insights</span>
          <button mat-button (click)="generate.emit()" class="generate-btn">
            Generate
          </button>
        </div>

      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .ai-compact-insights {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: 12px 0;
    }

    .ai-compact-insights .mat-mdc-card-content {
      padding: 16px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 12px;
      justify-content: center;
      padding: 8px;
    }

    .status-item.loading {
      color: rgba(255, 255, 255, 0.8);
    }

    .status-item.error {
      color: #ffcdd2;
    }

    .insights-summary {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .priority-alert {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(244, 67, 54, 0.2);
      padding: 8px 12px;
      border-radius: 4px;
      border-left: 4px solid #f44336;
    }

    .alert-icon {
      color: #ff5722;
    }

    .metrics-row {
      display: flex;
      justify-content: space-around;
      gap: 8px;
    }

    .metric-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      flex: 1;
      min-width: 0;
    }

    .metric-item:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .metric-item.has-issues {
      background: rgba(255, 152, 0, 0.2);
      border: 1px solid rgba(255, 152, 0, 0.5);
    }

    .metric-item.has-data {
      background: rgba(76, 175, 80, 0.2);
      border: 1px solid rgba(76, 175, 80, 0.5);
    }

    .metric-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: rgba(255, 255, 255, 0.7);
    }

    .metric-item mat-icon.warning {
      color: #ff9800;
    }

    .metric-item mat-icon.active {
      color: #4caf50;
    }

    .metric-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .metric-count {
      font-size: 18px;
      font-weight: 600;
      line-height: 1;
    }

    .metric-label {
      font-size: 11px;
      opacity: 0.8;
      line-height: 1;
    }

    .summary-text {
      font-size: 13px;
      opacity: 0.9;
      text-align: center;
      line-height: 1.4;
    }

    .actions-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .view-all-btn {
      flex: 1;
      color: white;
      border-color: rgba(255, 255, 255, 0.5);
    }

    .view-all-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: white;
    }

    .refresh-btn {
      color: rgba(255, 255, 255, 0.8);
    }

    .refresh-btn:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 12px;
      opacity: 0.8;
    }

    .no-data mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .generate-btn {
      color: white;
      background: rgba(255, 255, 255, 0.2);
    }

    .generate-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    @media (max-width: 768px) {
      .metrics-row {
        gap: 4px;
      }

      .metric-label {
        font-size: 10px;
      }

      .summary-text {
        font-size: 12px;
      }

      .actions-row {
        flex-direction: column;
        gap: 8px;
      }

      .view-all-btn {
        width: 100%;
      }
    }
  `]
})
export class AIInsightsCompactComponent {
  @Input() insights: AIInsightSummary | null = null;
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  
  @Output() refresh = new EventEmitter<void>();
  @Output() generate = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();
  @Output() viewDetails = new EventEmitter<string>();
}