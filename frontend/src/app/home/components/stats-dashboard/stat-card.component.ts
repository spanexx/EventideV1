import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';

export interface StatCardModel {
  value: number;
  label: string;
  icon: string;
  color?: string;
  target?: number;
}

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, MatIconModule],
  template: `
    <div class="stat-card">
      <div class="stat-card-inner">
        <div class="stat-card-header">
          <div class="stat-icon" [style.background]="stat.color">
            <mat-icon>{{ stat.icon }}</mat-icon>
          </div>
          <div class="stat-trend">
            <mat-icon class="trend-icon">trending_up</mat-icon>
            <span>+12%</span>
          </div>
        </div>
        
        <div class="stat-content">
          <div class="stat-value">{{ stat.value.toLocaleString() }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
        
        <div class="stat-progress" *ngIf="stat.target">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="getProgress()"></div>
          </div>
          <div class="stat-footer">
            <span class="stat-target">Target: {{ stat.target.toLocaleString() }}</span>
            <span class="stat-percentage">{{ getProgress().toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
      box-shadow: 
        0 10px 40px rgba(0, 0, 0, 0.04),
        0 4px 12px rgba(0, 0, 0, 0.02),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);
    }
    
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .stat-card:hover {
      background: rgba(102, 126, 234, 0.08);
      border-color: rgba(102, 126, 234, 0.2);
    }
    
    .stat-card:hover::before {
      opacity: 1;
    }
    
    .stat-card-inner {
      padding: 32px;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
    }
    
    .stat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }
    
    .stat-icon::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(45deg, rgba(255, 255, 255, 0.2), transparent);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .stat-card:hover .stat-icon::before {
      opacity: 1;
    }
    
    .stat-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: white;
      z-index: 1;
      position: relative;
    }
    
    .stat-trend {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #10b981;
      font-size: 14px;
      font-weight: 600;
      background: rgba(16, 185, 129, 0.1);
      padding: 8px 12px;
      border-radius: 12px;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    
    .trend-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    
    .stat-content {
      flex: 1;
      margin-bottom: 24px;
    }
    
    .stat-value {
      font-size: 48px;
      font-weight: 900;
      margin-bottom: 8px;
      color: #1e293b;
      line-height: 1;
      letter-spacing: -1px;
    }
    
    .stat-label {
      font-size: 16px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .stat-progress {
      margin-top: auto;
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background: rgba(148, 163, 184, 0.2);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      border-radius: 4px;
      transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    .progress-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
      animation: shimmer 2s infinite;
    }
    
    @keyframes shimmer {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    
    .stat-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }
    
    .stat-percentage {
      color: #667eea;
      font-weight: 700;
    }
    
    @media (max-width: 768px) {
      .stat-card-inner {
        padding: 24px;
      }
      
      .stat-value {
        font-size: 36px;
      }
      
      .stat-icon {
        width: 56px;
        height: 56px;
      }
      
      .stat-icon mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }
  `]
})
export class StatCardComponent {
  @Input() stat!: StatCardModel;
  getProgress(): number { return this.stat?.target ? (this.stat.value / (this.stat.target || 1)) * 100 : 0; }
}
