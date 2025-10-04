import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';

export interface AIInsightData {
  patterns?: {
    patterns: Array<{
      type: string;
      description: string;
      confidence: number;
      impact: string;
      recommendation: string;
    }>;
    trends: {
      bookingTrends: string;
      peakHours: string[];
      seasonality: string;
      utilization: string;
    };
    insights: string[];
    summary: string;
  };
  conflicts?: {
    hasConflicts: boolean;
    conflicts: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      suggestions: string[];
    }>;
    summary: string;
  };
  optimizations?: {
    optimizations: Array<{
      type: string;
      impact: 'low' | 'medium' | 'high';
      description: string;
      recommendation: string;
      estimatedImprovement: string;
    }>;
    summary: string;
  };
  summary?: string;
  lastUpdate?: Date;
}

@Component({
  selector: 'app-ai-insights-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatExpansionModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="ai-insights-panel">
      <mat-card-header>
        <mat-card-title class="ai-title">
          <mat-icon class="ai-icon">psychology</mat-icon>
          AI Insights & Analysis
        </mat-card-title>
        <mat-card-subtitle *ngIf="aiData?.lastUpdate">
          Last updated: {{ aiData?.lastUpdate | date:'short' }}
        </mat-card-subtitle>
        <div class="header-actions">
          <button mat-icon-button 
                  (click)="refresh.emit()"
                  [disabled]="loading"
                  matTooltip="Refresh AI analysis">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </mat-card-header>

      <mat-card-content>
        <!-- Loading State -->
        <div *ngIf="loading" class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Generating AI insights...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !loading" class="error-state">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <p>{{ error }}</p>
          <button mat-stroked-button (click)="refresh.emit()">
            <mat-icon>refresh</mat-icon>
            Retry
          </button>
        </div>

        <!-- AI Insights Content -->
        <div *ngIf="aiData && !loading && !error" class="insights-content">
          
          <!-- Summary Card -->
          <div *ngIf="aiData.summary" class="summary-section">
            <h3>
              <mat-icon>summarize</mat-icon>
              Quick Summary
            </h3>
            <p class="summary-text">{{ aiData.summary }}</p>
          </div>

          <!-- Conflicts Section -->
          <mat-expansion-panel *ngIf="aiData.conflicts?.hasConflicts" 
                              class="conflicts-panel"
                              [expanded]="(aiData.conflicts?.conflicts?.length || 0) <= 3">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon class="warning-icon">warning</mat-icon>
                Conflicts Detected ({{ aiData.conflicts?.conflicts?.length || 0 }})
              </mat-panel-title>
            </mat-expansion-panel-header>
            
            <div class="conflicts-content">
              <div *ngFor="let conflict of aiData.conflicts?.conflicts || []" 
                   class="conflict-item"
                   [class]="'severity-' + conflict.severity">
                <div class="conflict-header">
                  <mat-chip [class]="'severity-chip-' + conflict.severity">
                    {{ conflict.severity | uppercase }}
                  </mat-chip>
                  <span class="conflict-type">{{ conflict.type | titlecase }}</span>
                </div>
                <p class="conflict-description">{{ conflict.description }}</p>
                <div *ngIf="conflict.suggestions.length" class="suggestions">
                  <strong>Suggestions:</strong>
                  <ul>
                    <li *ngFor="let suggestion of conflict.suggestions">{{ suggestion }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </mat-expansion-panel>

          <!-- Patterns Section -->
          <mat-expansion-panel *ngIf="aiData.patterns?.patterns?.length" 
                              class="patterns-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon class="patterns-icon">trending_up</mat-icon>
                Patterns & Trends ({{ aiData.patterns?.patterns?.length || 0 }})
              </mat-panel-title>
            </mat-expansion-panel-header>
            
            <div class="patterns-content">
              <div *ngFor="let pattern of aiData.patterns?.patterns || []" class="pattern-item">
                <div class="pattern-header">
                  <span class="pattern-type">{{ pattern.type | titlecase }}</span>
                  <mat-chip class="confidence-chip">
                    {{ pattern.confidence }}% confident
                  </mat-chip>
                </div>
                <p class="pattern-description">{{ pattern.description }}</p>
                <div class="pattern-impact">
                  <strong>Impact:</strong> {{ pattern.impact }}
                </div>
                <div class="pattern-recommendation">
                  <strong>Recommendation:</strong> {{ pattern.recommendation }}
                </div>
              </div>

              <!-- Trends Summary -->
              <div *ngIf="aiData.patterns?.trends" class="trends-summary">
                <h4>Trends Overview</h4>
                <div class="trend-items">
                  <div class="trend-item">
                    <strong>Booking Trends:</strong> {{ aiData.patterns?.trends?.bookingTrends }}
                  </div>
                  <div class="trend-item" *ngIf="aiData.patterns?.trends?.peakHours?.length">
                    <strong>Peak Hours:</strong> 
                    <mat-chip-listbox>
                      <mat-chip *ngFor="let hour of aiData.patterns?.trends?.peakHours || []">
                        {{ hour }}
                      </mat-chip>
                    </mat-chip-listbox>
                  </div>
                  <div class="trend-item">
                    <strong>Utilization:</strong> {{ aiData.patterns?.trends?.utilization }}
                  </div>
                </div>
              </div>
            </div>
          </mat-expansion-panel>

          <!-- Optimizations Section -->
          <mat-expansion-panel *ngIf="aiData.optimizations?.optimizations?.length" 
                              class="optimizations-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon class="optimization-icon">tune</mat-icon>
                Optimization Opportunities ({{ aiData.optimizations?.optimizations?.length || 0 }})
              </mat-panel-title>
            </mat-expansion-panel-header>
            
            <div class="optimizations-content">
              <div *ngFor="let optimization of aiData.optimizations?.optimizations || []" 
                   class="optimization-item"
                   [class]="'impact-' + optimization.impact">
                <div class="optimization-header">
                  <span class="optimization-type">{{ optimization.type | titlecase }}</span>
                  <mat-chip [class]="'impact-chip-' + optimization.impact">
                    {{ optimization.impact | uppercase }} Impact
                  </mat-chip>
                </div>
                <p class="optimization-description">{{ optimization.description }}</p>
                <div class="optimization-recommendation">
                  <strong>Recommendation:</strong> {{ optimization.recommendation }}
                </div>
                <div class="optimization-improvement">
                  <strong>Expected Improvement:</strong> {{ optimization.estimatedImprovement }}
                </div>
              </div>
            </div>
          </mat-expansion-panel>

          <!-- Key Insights -->
          <div *ngIf="aiData.patterns?.insights?.length" class="insights-section">
            <h3>
              <mat-icon>lightbulb</mat-icon>
              Key Insights
            </h3>
            <div class="insights-list">
              <div *ngFor="let insight of aiData.patterns?.insights || []" class="insight-item">
                <mat-icon class="insight-icon">arrow_forward</mat-icon>
                <span>{{ insight }}</span>
              </div>
            </div>
          </div>

        </div>

        <!-- No Data State -->
        <div *ngIf="!aiData && !loading && !error" class="no-data-state">
          <mat-icon class="no-data-icon">analytics</mat-icon>
          <p>No AI insights available</p>
          <p class="no-data-subtitle">Load availability data to generate AI insights</p>
          <button mat-raised-button color="primary" (click)="refresh.emit()">
            <mat-icon>psychology</mat-icon>
            Generate Insights
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .ai-insights-panel {
      margin: 16px 0;
      max-width: 100%;
    }

    .ai-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ai-icon {
      color: #7c4dff;
    }

    .header-actions {
      margin-left: auto;
    }

    .loading-state, .error-state, .no-data-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px;
      text-align: center;
    }

    .error-icon, .no-data-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #f44336;
      margin-bottom: 16px;
    }

    .no-data-icon {
      color: #9e9e9e;
    }

    .insights-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .summary-section {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
    }

    .summary-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 8px 0;
    }

    .conflicts-panel .mat-expansion-panel-header {
      background: #fff3e0;
    }

    .severity-chip-high {
      background: #f44336;
      color: white;
    }

    .severity-chip-medium {
      background: #ff9800;
      color: white;
    }

    .severity-chip-low {
      background: #4caf50;
      color: white;
    }

    .conflict-item, .pattern-item, .optimization-item {
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      margin: 8px 0;
    }

    .conflict-header, .pattern-header, .optimization-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .suggestions ul {
      margin: 8px 0;
      padding-left: 20px;
    }

    .trends-summary {
      background: #e8f5e8;
      padding: 16px;
      border-radius: 8px;
      margin-top: 16px;
    }

    .trend-items {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .insights-section {
      background: #f3e5f5;
      padding: 16px;
      border-radius: 8px;
    }

    .insights-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
    }

    .insights-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .insight-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .insight-icon {
      color: #7c4dff;
      font-size: 18px;
    }

    .warning-icon {
      color: #ff9800;
    }

    .patterns-icon {
      color: #2196f3;
    }

    .optimization-icon {
      color: #4caf50;
    }

    .impact-chip-high {
      background: #4caf50;
      color: white;
    }

    .impact-chip-medium {
      background: #2196f3;
      color: white;
    }

    .impact-chip-low {
      background: #9e9e9e;
      color: white;
    }

    .confidence-chip {
      background: #e3f2fd;
      color: #1976d2;
    }

    @media (max-width: 768px) {
      .ai-insights-panel {
        margin: 8px 0;
      }

      .conflict-header, .pattern-header, .optimization-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }
  `]
})
export class AIInsightsPanelComponent {
  @Input() aiData: AIInsightData | null = null;
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  
  @Output() refresh = new EventEmitter<void>();
}