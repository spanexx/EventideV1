import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { StatCardComponent } from './stat-card.component';

export interface StatItem {
  value: number;
  label: string;
  icon: string;
  color: string;
  target: number;
}

@Component({
  selector: 'app-stats-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, MatIconModule, StatCardComponent],
  template: `
    <section class="stats-dashboard">
      <div class="section-header">
        <h2 class="section-title">Platform Insights</h2>
        <p class="section-subtitle">Real-time data from our growing community</p>
      </div>

      <div class="stats-grid">
        <app-stat-card *ngFor="let stat of stats" [stat]="stat"></app-stat-card>
      </div>
    </section>
  `
  ,
  styles: [`
    .stats-dashboard { 
      padding: 100px 20px; 
      max-width: 1400px; 
      margin: 0 auto; 
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      position: relative;
      overflow: hidden;
    }
    
    .stats-dashboard::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 50%);
      pointer-events: none;
    }
    
    .section-header { 
      text-align: center; 
      margin-bottom: 80px; 
      position: relative;
      z-index: 1;
    }
    
    .section-title { 
      font-size: 56px; 
      font-weight: 900; 
      margin: 0 0 24px 0; 
      color: #1e293b; 
      letter-spacing: -2px; 
      position: relative; 
      display: inline-block;
      background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .section-title::after { 
      content: ''; 
      position: absolute; 
      bottom: -12px; 
      left: 50%; 
      transform: translateX(-50%); 
      width: 80px; 
      height: 6px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      border-radius: 3px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }
    
    .section-subtitle { 
      font-size: 20px; 
      color: #64748b; 
      margin: 0; 
      font-weight: 500; 
      line-height: 1.6;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .stats-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); 
      gap: 32px;
      position: relative;
      z-index: 1;
    }
    
    @media (max-width: 768px) {
      .stats-dashboard {
        padding: 60px 16px;
      }
      
      .section-title {
        font-size: 36px;
        letter-spacing: -1px;
      }
      
      .section-header {
        margin-bottom: 50px;
      }
      
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }
    }
  `]
})
export class StatsDashboardComponent { @Input() stats: StatItem[] = []; }
