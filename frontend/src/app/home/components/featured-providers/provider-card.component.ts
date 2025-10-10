import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ProviderCardModel {
  id?: string;
  businessName?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  location?: string;
  rating?: number;
  reviewCount?: number;
  picture?: string;
  services?: string[];
}

@Component({
  selector: 'app-provider-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatChipsModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="provider-card-enhanced" (click)="onView()">
      <div class="provider-image-container">
        <img *ngIf="provider.picture" [src]="provider.picture" [alt]="displayName" class="provider-image">
        <div *ngIf="!provider.picture" class="provider-image-placeholder">
          <mat-icon>person</mat-icon>
        </div>
        <div class="provider-badge">
          <mat-icon>verified</mat-icon>
        </div>
      </div>

      <div class="provider-details">
        <h3 class="provider-name">{{ displayName }}</h3>
        <div class="provider-meta">
          <div class="provider-rating" *ngIf="(provider.rating ?? 0) > 0">
            <mat-icon class="star-icon">star</mat-icon>
            <span class="rating-value">{{ provider.rating }}</span>
            <span class="rating-count">({{ provider.reviewCount }})</span>
          </div>
          <div class="provider-location" *ngIf="provider.location">
            <mat-icon>location_on</mat-icon>
            <span>{{ provider.location }}</span>
          </div>
        </div>

        <p class="provider-bio" *ngIf="provider.bio">{{ provider.bio | slice:0:120 }}{{ provider.bio && provider.bio.length > 120 ? '...' : '' }}</p>

        <div class="provider-services" *ngIf="provider.services?.length">
          <mat-chip *ngFor="let service of provider.services!.slice(0, 3)">{{ service }}</mat-chip>
        </div>

        <div class="provider-actions">
          <button mat-icon-button class="action-btn book-btn" (click)="onBook($event)"
                  matTooltip="Book appointment" matTooltipPosition="above">
            <mat-icon>event</mat-icon>
          </button>
          <button mat-icon-button class="action-btn view-btn"
                  matTooltip="View profile" matTooltipPosition="above">
            <mat-icon>visibility</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `
  ,
  styles: [`
    .provider-card-enhanced { 
      background: rgba(255, 255, 255, 0.95); 
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 20px; 
      overflow: hidden; 
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.06),
        0 4px 16px rgba(0, 0, 0, 0.04),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
      cursor: pointer; 
      border: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
    }
    
    .provider-card-enhanced::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    .provider-card-enhanced:hover { 
      background: rgba(102, 126, 234, 0.05);
      border-color: rgba(102, 126, 234, 0.2);
    }
    
    .provider-card-enhanced:hover::before {
      opacity: 1;
    }
    
    .provider-image-container { 
      position: relative; 
      width: 100%; 
      height: 260px; 
      overflow: hidden; 
    }
    
    .provider-image { 
      width: 100%; 
      height: 100%; 
      object-fit: cover; 
    }
    
    .provider-image-placeholder { 
      width: 100%; 
      height: 100%; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      display: flex; 
      align-items: center; 
      justify-content: center; 
    }
    
    .provider-image-placeholder mat-icon { 
      font-size: 80px; 
      width: 80px; 
      height: 80px; 
      color: #fff; 
    }
    
    .provider-badge { 
      position: absolute; 
      top: 16px; 
      right: 16px; 
      width: 44px; 
      height: 44px; 
      border-radius: 50%; 
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      display: flex; 
      align-items: center; 
      justify-content: center; 
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .provider-badge mat-icon { 
      font-size: 24px; 
      width: 24px; 
      height: 24px; 
      color: #667eea; 
    }
    
    .provider-details { 
      padding: 28px; 
    }
    
    .provider-name { 
      font-size: 24px; 
      font-weight: 700; 
      margin: 0 0 16px 0; 
      color: #1e293b;
      line-height: 1.2;
    }
    
    .provider-meta { 
      display: flex; 
      align-items: center; 
      gap: 16px; 
      margin-bottom: 20px; 
      flex-wrap: wrap; 
    }
    
    .provider-rating { 
      display: flex; 
      align-items: center; 
      gap: 6px; 
    }
    
    .star-icon { 
      font-size: 18px; 
      width: 18px; 
      height: 18px; 
      color: #fbbf24; 
    }
    
    .rating-value { 
      font-weight: 600; 
      color: #1e293b; 
    }
    
    .rating-count { 
      color: #64748b; 
      font-size: 14px; 
    }
    
    .provider-location { 
      display: flex; 
      align-items: center; 
      gap: 6px; 
      color: #64748b; 
      font-size: 14px; 
    }
    
    .provider-location mat-icon { 
      font-size: 16px; 
      width: 16px; 
      height: 16px; 
    }
    
    .provider-bio { 
      font-size: 15px; 
      line-height: 1.6; 
      color: #64748b; 
      margin-bottom: 20px; 
    }
    
    .provider-services { 
      display: flex; 
      flex-wrap: wrap; 
      gap: 8px; 
      margin-bottom: 24px; 
    }
    
    .provider-actions { 
      display: flex; 
      gap: 12px; 
      justify-content: center;
    }
    
    .action-btn {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(102, 126, 234, 0.2);
      color: #667eea;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.1);
    }
    
    .action-btn:hover {
      background: rgba(102, 126, 234, 0.08);
      border-color: rgba(102, 126, 234, 0.3);
      color: #5a67d8;
    }
    
    .action-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      transition: transform 0.2s ease;
    }
    
    .action-btn:hover mat-icon {
      transform: scale(1.1);
    }
    
    .book-btn {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    }
    
    .book-btn:hover {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
    }
  `]
})
export class ProviderCardComponent {
  @Input() provider!: ProviderCardModel;
  @Output() view = new EventEmitter<string>();
  @Output() bookEvent = new EventEmitter<string>();

  get displayName(): string {
    if (!this.provider) return 'Provider';
    if (this.provider.businessName) return this.provider.businessName;
    const name = `${this.provider.firstName || ''} ${this.provider.lastName || ''}`.trim();
    return name || (this.provider as any).name || 'Provider';
  }

  onBook(e: Event) {
    e.stopPropagation();
    if (this.provider.id) this.bookEvent.emit(this.provider.id);
  }

  onView() {
    if (this.provider.id) this.view.emit(this.provider.id);
  }
}
