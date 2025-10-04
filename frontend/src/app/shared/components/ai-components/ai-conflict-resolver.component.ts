import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';

export interface AIConflict {
  id: string;
  type: 'overlap' | 'buffer' | 'capacity' | 'pattern';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  affectedSlots: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    title?: string;
  }>;
  suggestions: Array<{
    action: string;
    description: string;
    impact: string;
  }>;
}

@Component({
  selector: 'app-ai-conflict-resolver',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatListModule,
    MatTooltipModule,
    MatExpansionModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="ai-conflict-resolver" *ngIf="conflicts.length">
      <mat-card-header>
        <mat-card-title>
          <mat-icon class="conflict-icon">warning</mat-icon>
          Schedule Conflicts
          <mat-chip class="conflicts-count" 
                   [class]="getCountChipClass()">
            {{ conflicts.length }} {{ conflicts.length === 1 ? 'conflict' : 'conflicts' }}
          </mat-chip>
        </mat-card-title>
        <mat-card-subtitle>
          AI-detected scheduling issues requiring attention
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        
        <!-- Quick Actions -->
        <div class="quick-actions">
          <button mat-raised-button 
                  color="warn"
                  (click)="resolveAllHigh()"
                  [disabled]="!hasHighSeverityConflicts">
            <mat-icon>auto_fix_high</mat-icon>
            Auto-Resolve Critical
          </button>
          
          <button mat-stroked-button 
                  (click)="showAllSuggestions()"
                  class="suggestions-btn">
            <mat-icon>lightbulb</mat-icon>
            View All Suggestions
          </button>
        </div>

        <!-- Conflicts List -->
        <mat-accordion class="conflicts-accordion">
          <mat-expansion-panel *ngFor="let conflict of conflicts; trackBy: trackByConflict"
                              [class]="'severity-' + conflict.severity"
                              [expanded]="conflict.severity === 'high'">
            
            <mat-expansion-panel-header>
              <mat-panel-title>
                <div class="conflict-header">
                  <mat-icon [class]="'severity-icon severity-' + conflict.severity">
                    {{ getSeverityIcon(conflict.severity) }}
                  </mat-icon>
                  <span class="conflict-title">{{ conflict.title }}</span>
                  <mat-chip [class]="'severity-chip severity-' + conflict.severity">
                    {{ conflict.severity | uppercase }}
                  </mat-chip>
                </div>
              </mat-panel-title>
            </mat-expansion-panel-header>

            <div class="conflict-details">
              
              <!-- Description -->
              <p class="conflict-description">{{ conflict.description }}</p>

              <!-- Affected Slots -->
              <div class="affected-slots" *ngIf="conflict.affectedSlots.length">
                <h4>
                  <mat-icon>schedule</mat-icon>
                  Affected Time Slots
                </h4>
                <div class="slots-list">
                  <mat-chip-listbox>
                    <mat-chip *ngFor="let slot of conflict.affectedSlots"
                             class="slot-chip"
                             (click)="highlightSlot.emit(slot)">
                      {{ formatTimeSlot(slot) }}
                    </mat-chip>
                  </mat-chip-listbox>
                </div>
              </div>

              <!-- Resolution Suggestions -->
              <div class="suggestions" *ngIf="conflict.suggestions.length">
                <h4>
                  <mat-icon>auto_fix_normal</mat-icon>
                  Suggested Resolutions
                </h4>
                <div class="suggestions-list">
                  <div *ngFor="let suggestion of conflict.suggestions; index as i" 
                       class="suggestion-item">
                    <div class="suggestion-content">
                      <div class="suggestion-action">
                        <strong>{{ suggestion.action }}</strong>
                      </div>
                      <div class="suggestion-description">
                        {{ suggestion.description }}
                      </div>
                      <div class="suggestion-impact">
                        <mat-icon class="impact-icon">trending_up</mat-icon>
                        <span>{{ suggestion.impact }}</span>
                      </div>
                    </div>
                    <div class="suggestion-actions">
                      <button mat-mini-fab 
                              color="primary"
                              (click)="applySuggestion.emit({ conflict, suggestion })"
                              [matTooltip]="'Apply: ' + suggestion.action">
                        <mat-icon>check</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Conflict Actions -->
              <div class="conflict-actions">
                <button mat-raised-button 
                        color="primary"
                        (click)="resolveConflict.emit(conflict)">
                  <mat-icon>auto_fix_high</mat-icon>
                  Auto-Resolve
                </button>
                
                <button mat-button 
                        (click)="manualResolve.emit(conflict)">
                  <mat-icon>edit</mat-icon>
                  Manual Resolution
                </button>
                
                <button mat-button 
                        color="warn"
                        (click)="ignoreConflict.emit(conflict.id)">
                  <mat-icon>visibility_off</mat-icon>
                  Ignore
                </button>
              </div>

            </div>
          </mat-expansion-panel>
        </mat-accordion>

      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .ai-conflict-resolver {
      margin: 16px 0;
      border-left: 4px solid #f44336;
    }

    .conflict-icon {
      color: #f44336;
    }

    .conflicts-count {
      margin-left: 12px;
    }

    .conflicts-count.high-severity {
      background: #f44336;
      color: white;
    }

    .conflicts-count.medium-severity {
      background: #ff9800;
      color: white;
    }

    .conflicts-count.low-severity {
      background: #4caf50;
      color: white;
    }

    .quick-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .suggestions-btn {
      color: #ff9800;
      border-color: #ff9800;
    }

    .conflicts-accordion {
      margin-top: 16px;
    }

    .severity-high .mat-expansion-panel-header {
      background: #ffebee;
      color: #c62828;
    }

    .severity-medium .mat-expansion-panel-header {
      background: #fff3e0;
      color: #ef6c00;
    }

    .severity-low .mat-expansion-panel-header {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .conflict-header {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
    }

    .severity-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .severity-icon.severity-high {
      color: #f44336;
    }

    .severity-icon.severity-medium {
      color: #ff9800;
    }

    .severity-icon.severity-low {
      color: #4caf50;
    }

    .conflict-title {
      flex: 1;
      font-weight: 500;
    }

    .severity-chip {
      font-size: 10px;
      min-height: 24px;
    }

    .severity-chip.severity-high {
      background: #f44336;
      color: white;
    }

    .severity-chip.severity-medium {
      background: #ff9800;
      color: white;
    }

    .severity-chip.severity-low {
      background: #4caf50;
      color: white;
    }

    .conflict-details {
      padding: 16px 0;
    }

    .conflict-description {
      margin: 0 0 16px 0;
      color: #666;
      line-height: 1.5;
    }

    .affected-slots, .suggestions {
      margin: 16px 0;
    }

    .affected-slots h4, .suggestions h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 500;
    }

    .slots-list {
      margin: 8px 0;
    }

    .slot-chip {
      margin: 4px;
      cursor: pointer;
      background: #e3f2fd;
      color: #1565c0;
    }

    .slot-chip:hover {
      background: #bbdefb;
    }

    .suggestions-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .suggestion-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #fafafa;
    }

    .suggestion-content {
      flex: 1;
    }

    .suggestion-action {
      margin-bottom: 4px;
      color: #1976d2;
    }

    .suggestion-description {
      margin-bottom: 8px;
      color: #666;
      font-size: 14px;
    }

    .suggestion-impact {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #4caf50;
    }

    .impact-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .suggestion-actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .conflict-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
      flex-wrap: wrap;
    }

    @media (max-width: 768px) {
      .quick-actions {
        flex-direction: column;
      }

      .quick-actions button {
        width: 100%;
      }

      .conflict-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .suggestion-item {
        flex-direction: column;
        gap: 8px;
      }

      .suggestion-actions {
        flex-direction: row;
        align-self: stretch;
      }

      .conflict-actions {
        flex-direction: column;
      }

      .conflict-actions button {
        width: 100%;
      }
    }
  `]
})
export class AIConflictResolverComponent {
  @Input() conflicts: AIConflict[] = [];
  
  @Output() resolveConflict = new EventEmitter<AIConflict>();
  @Output() manualResolve = new EventEmitter<AIConflict>();
  @Output() ignoreConflict = new EventEmitter<string>();
  @Output() applySuggestion = new EventEmitter<{ conflict: AIConflict; suggestion: any }>();
  @Output() highlightSlot = new EventEmitter<any>();

  get hasHighSeverityConflicts(): boolean {
    return this.conflicts.some(conflict => conflict.severity === 'high');
  }

  trackByConflict(index: number, conflict: AIConflict): string {
    return conflict.id;
  }

  getSeverityIcon(severity: string): string {
    const icons = {
      'high': 'error',
      'medium': 'warning',
      'low': 'info'
    };
    return icons[severity as keyof typeof icons] || 'info';
  }

  getCountChipClass(): string {
    const highCount = this.conflicts.filter(c => c.severity === 'high').length;
    const mediumCount = this.conflicts.filter(c => c.severity === 'medium').length;
    
    if (highCount > 0) return 'high-severity';
    if (mediumCount > 0) return 'medium-severity';
    return 'low-severity';
  }

  formatTimeSlot(slot: any): string {
    const start = new Date(slot.startTime).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    const end = new Date(slot.endTime).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
    return `${start} - ${end}`;
  }

  resolveAllHigh(): void {
    const highSeverityConflicts = this.conflicts.filter(c => c.severity === 'high');
    highSeverityConflicts.forEach(conflict => this.resolveConflict.emit(conflict));
  }

  showAllSuggestions(): void {
    // Expand all panels to show suggestions
    // This would typically trigger a UI state change
  }
}