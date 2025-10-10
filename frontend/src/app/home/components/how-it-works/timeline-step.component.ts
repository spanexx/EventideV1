import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface TimelineStepModel {
  stepNumber: number;
  icon: string;
  title: string;
  description: string;
}
@Component({
  selector: 'app-timeline-step',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="timeline-step">
      <div class="step-number">{{ step.stepNumber }}</div>
      <div class="step-content">
        <div class="step-icon-wrapper"><mat-icon class="step-icon">{{ step.icon }}</mat-icon></div>
        <h3 class="step-title">{{ step.title }}</h3>
        <p class="step-description">{{ step.description }}</p>
      </div>
    </div>
  `,
  styles: [`
    .timeline-step { 
      display: flex; 
      gap: 40px; 
      margin-bottom: 80px; 
      align-items: flex-start;
      position: relative;
    }
    
    .timeline-step:last-child { 
      margin-bottom: 0; 
    }
    
    .step-number { 
      flex-shrink: 0; 
      width: 64px; 
      height: 64px; 
      border-radius: 50%; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 24px; 
      font-weight: 900;
      box-shadow: 
        0 8px 32px rgba(102, 126, 234, 0.3),
        0 4px 16px rgba(102, 126, 234, 0.2);
      position: relative;
      z-index: 2;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .step-number::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      opacity: 0;
      transition: opacity 0.3s ease;
      z-index: -1;
    }
    
    .timeline-step:hover .step-number {
      transform: scale(1.1);
      box-shadow: 
        0 12px 40px rgba(102, 126, 234, 0.4),
        0 6px 20px rgba(102, 126, 234, 0.3);
    }
    
    .timeline-step:hover .step-number::before {
      opacity: 0.2;
    }
    
    .step-content { 
      flex: 1; 
      padding: 32px; 
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 20px; 
      box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.1),
        0 8px 25px rgba(0, 0, 0, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    
    .step-content::before {
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
    
    .timeline-step:hover .step-content {
      transform: translateY(-4px);
      box-shadow: 
        0 30px 80px rgba(0, 0, 0, 0.15),
        0 12px 35px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
      border-color: rgba(255, 255, 255, 0.4);
    }
    
    .timeline-step:hover .step-content::before {
      opacity: 1;
    }
    
    .step-icon-wrapper { 
      width: 72px; 
      height: 72px; 
      border-radius: 18px; 
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      display: flex; 
      align-items: center; 
      justify-content: center; 
      margin-bottom: 24px;
      box-shadow: 
        0 8px 25px rgba(0, 0, 0, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }
    
    .timeline-step:hover .step-icon-wrapper {
      transform: scale(1.05);
      box-shadow: 
        0 12px 35px rgba(0, 0, 0, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }
    
    .step-icon { 
      font-size: 36px; 
      width: 36px; 
      height: 36px; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transition: transform 0.2s ease;
    }
    
    .timeline-step:hover .step-icon {
      transform: scale(1.1);
    }
    
    .step-title { 
      font-size: 24px; 
      font-weight: 700; 
      margin: 0 0 16px 0; 
      color: #1e293b;
      line-height: 1.2;
      letter-spacing: -0.5px;
    }
    
    .step-description { 
      font-size: 16px; 
      line-height: 1.7; 
      color: #64748b; 
      margin: 0;
      font-weight: 400;
    }
    
    @media (max-width: 768px) { 
      .timeline-step { 
        flex-direction: column; 
        gap: 20px;
        margin-bottom: 40px;
      } 
      
      .step-number { 
        align-self: flex-start;
        width: 56px;
        height: 56px;
        font-size: 20px;
      }
      
      .step-content {
        padding: 24px;
      }
      
      .step-icon-wrapper {
        width: 64px;
        height: 64px;
      }
      
      .step-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }
      
      .step-title {
        font-size: 20px;
      }
      
      .step-description {
        font-size: 15px;
      }
    }
  `]
})
export class TimelineStepComponent {
  @Input() step!: TimelineStepModel;
}
