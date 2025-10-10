import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProviderCardComponent } from './provider-card.component';
import { Provider } from '../../../provider-search/services/provider.service';

@Component({
  selector: 'app-featured-providers',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatChipsModule, MatProgressSpinnerModule, MatButtonModule, MatTooltipModule, ProviderCardComponent],
  template: `
    <section class="featured-section">
      <div class="section-header">
        <h2 class="section-title">Meet Our Top Providers</h2>
        <p class="section-subtitle">Handpicked professionals ready to serve you</p>
      </div>

      <div *ngIf="loading" class="loading-state">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Discovering amazing providers...</p>
      </div>

      <div *ngIf="!loading && providers.length > 0" class="providers-showcase">
        <app-provider-card
          *ngFor="let provider of providers"
          [provider]="provider"
          (view)="view.emit($event)"
          (bookEvent)="bookEvent.emit($event)"
        ></app-provider-card>
      </div>

      <div class="view-all-section">
        <button mat-icon-button class="view-all-btn" (click)="browse.emit()" 
                matTooltip="Explore all providers" matTooltipPosition="above">
          <mat-icon>explore</mat-icon>
        </button>
      </div>
    </section>
  `
  ,
  styles: [`
    .featured-section { 
      padding: 100px 20px; 
      max-width: 1400px; 
      margin: 0 auto;
      background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%);
      position: relative;
    }
    
    .section-header {
      text-align: center;
      margin-bottom: 80px;
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
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
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
    
    .providers-showcase { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); 
      gap: 40px; 
      margin-bottom: 80px;
    }
    
    .view-all-section { 
      text-align: center; 
      margin-top: 60px;
    }
    
    .view-all-btn { 
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 2px solid rgba(102, 126, 234, 0.2);
      color: #667eea;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 
        0 8px 32px rgba(102, 126, 234, 0.1),
        0 4px 16px rgba(102, 126, 234, 0.05);
      position: relative;
      overflow: hidden;
    }
    
    .view-all-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .view-all-btn:hover {
      background: rgba(102, 126, 234, 0.08);
      border-color: rgba(102, 126, 234, 0.3);
      color: #5a67d8;
    }
    
    .view-all-btn:hover::before {
      opacity: 1;
    }
    
    .view-all-btn mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      transition: transform 0.2s ease;
    }
    
    .view-all-btn:hover mat-icon {
      transform: scale(1.1);
    }
    
    .loading-state { 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      justify-content: center; 
      padding: 120px 20px; 
      gap: 24px;
    }
    
    .loading-state p { 
      font-size: 18px; 
      color: #64748b;
      font-weight: 500;
    }
    
    @media (max-width: 768px) {
      .featured-section {
        padding: 60px 16px;
      }
      
      .section-title {
        font-size: 36px;
        letter-spacing: -1px;
      }
      
      .section-header {
        margin-bottom: 50px;
      }
      
      .providers-showcase {
        grid-template-columns: 1fr;
        gap: 24px;
        margin-bottom: 50px;
      }
      
      .view-all-btn {
        width: 64px;
        height: 64px;
      }
      
      .view-all-btn mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }
  `]
})
export class FeaturedProvidersComponent {
  @Input() providers: Provider[] = [];
  @Input() loading: boolean = false;
  @Output() view = new EventEmitter<string>();
  @Output() bookEvent = new EventEmitter<string>();
  @Output() browse = new EventEmitter<void>();

  // ProviderCard emits events; no additional handlers required here
}
