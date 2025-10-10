import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TimelineStepComponent } from './timeline-step.component';

export interface HowItWorksStep {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, MatIconModule, TimelineStepComponent],
  template: `
    <section class="how-it-works-section">
      <div class="section-header">
        <h2 class="section-title">Simple. Elegant. Effective.</h2>
        <p class="section-subtitle">Your journey to the perfect appointment in three steps</p>
      </div>
      <div class="timeline-container">
        <div class="timeline-line"></div>
        <app-timeline-step *ngFor="let step of steps; let i = index" [step]="{ stepNumber: i + 1, icon: step.icon, title: step.title, description: step.description }"></app-timeline-step>
      </div>
    </section>
  `,
  styles: [`
    .how-it-works-section { 
      padding: 120px 20px; 
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
      position: relative;
      overflow: hidden;
    }
    
    .how-it-works-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
      pointer-events: none;
    }
    
    .section-header {
      text-align: center;
      margin-bottom: 100px;
      position: relative;
      z-index: 1;
    }
    
    .section-title {
      font-size: 56px;
      font-weight: 900;
      margin: 0 0 24px 0;
      color: white;
      letter-spacing: -2px;
      position: relative;
      display: inline-block;
      background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
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
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
    }
    
    .section-subtitle {
      font-size: 20px;
      color: #cbd5e1;
      margin: 0;
      font-weight: 500;
      line-height: 1.6;
      max-width: 600px;
      margin: 0 auto;
    }
    
    .timeline-container { 
      max-width: 1000px; 
      margin: 0 auto; 
      padding: 60px 0; 
      position: relative;
      z-index: 1;
    }
    
    .timeline-line { 
      position: absolute; 
      left: 32px; 
      top: 80px; 
      bottom: 80px; 
      width: 4px; 
      background: linear-gradient(to bottom, 
        #667eea 0%, 
        #764ba2 50%, 
        #667eea 100%
      );
      border-radius: 2px;
      box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
    }
    
    .timeline-line::before {
      content: '';
      position: absolute;
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 16px;
      height: 16px;
      background: #667eea;
      border-radius: 50%;
      box-shadow: 0 0 20px rgba(102, 126, 234, 0.5);
    }
    
    .timeline-line::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 16px;
      height: 16px;
      background: #764ba2;
      border-radius: 50%;
      box-shadow: 0 0 20px rgba(118, 75, 162, 0.5);
    }
    
    @media (max-width: 768px) { 
      .how-it-works-section {
        padding: 80px 16px;
      }
      
      .section-title {
        font-size: 36px;
        letter-spacing: -1px;
      }
      
      .section-header {
        margin-bottom: 60px;
      }
      
      .timeline-container {
        padding: 40px 0;
      }
      
      .timeline-line { 
        display: none; 
      } 
    }
  `]
})
export class HowItWorksComponent { @Input() steps: HowItWorksStep[] = []; }
