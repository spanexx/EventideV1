import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../environments/environment';

interface Provider {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  bio?: string;
  location?: string;
  contactPhone?: string;
  services?: string[];
  availableDurations?: number[];
  rating?: number;
  reviewCount?: number;
  subscriptionTier: string;
  picture?: string;
}

@Component({
  selector: 'app-provider-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="provider-profile-container">
      <div *ngIf="loading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading provider information...</p>
      </div>

      <div *ngIf="error" class="error-container">
        <mat-icon class="error-icon">error</mat-icon>
        <h2>Provider Not Found</h2>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="goBack()">
          Go Back
        </button>
      </div>

      <div *ngIf="provider && !loading" class="profile-content">
        <!-- Header Card -->
        <mat-card class="header-card">
          <div class="header-content">
            <div class="provider-avatar">
              <img 
                *ngIf="provider.picture" 
                [src]="provider.picture" 
                [alt]="getProviderName()"
                class="avatar-image">
              <div *ngIf="!provider.picture" class="avatar-placeholder">
                <mat-icon>person</mat-icon>
              </div>
            </div>
            
            <div class="provider-info">
              <h1>{{ getProviderName() }}</h1>
              <p class="business-name" *ngIf="provider.businessName">
                {{ provider.businessName }}
              </p>
              
              <div class="rating-section" *ngIf="provider.rating && provider.rating > 0">
                <div class="stars">
                  <mat-icon *ngFor="let star of getStars()" class="star-icon">star</mat-icon>
                  <mat-icon *ngFor="let star of getEmptyStars()" class="star-icon empty">star_border</mat-icon>
                </div>
                <span class="rating-text">{{ provider.rating }} ({{ provider.reviewCount }} reviews)</span>
              </div>

              <div class="contact-info">
                <div class="info-item" *ngIf="provider.location">
                  <mat-icon>location_on</mat-icon>
                  <span>{{ provider.location }}</span>
                </div>
                <div class="info-item" *ngIf="provider.contactPhone">
                  <mat-icon>phone</mat-icon>
                  <span>{{ provider.contactPhone }}</span>
                </div>
                <div class="info-item">
                  <mat-icon>email</mat-icon>
                  <span>{{ provider.email }}</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            mat-raised-button 
            color="primary" 
            class="book-button"
            (click)="bookAppointment()">
            <mat-icon>event</mat-icon>
            Book Appointment
          </button>
        </mat-card>

        <!-- About Section -->
        <mat-card class="section-card" *ngIf="provider.bio">
          <h2>About</h2>
          <p class="bio-text">{{ provider.bio }}</p>
        </mat-card>

        <!-- Services Section -->
        <mat-card class="section-card" *ngIf="provider.services && provider.services.length > 0">
          <h2>Services</h2>
          <div class="services-list">
            <mat-chip-set>
              <mat-chip *ngFor="let service of provider.services">
                {{ service }}
              </mat-chip>
            </mat-chip-set>
          </div>
        </mat-card>

        <!-- Available Durations Section -->
        <mat-card class="section-card" *ngIf="provider.availableDurations && provider.availableDurations.length > 0">
          <h2>Appointment Durations</h2>
          <div class="durations-list">
            <div class="duration-item" *ngFor="let duration of provider.availableDurations">
              <mat-icon>schedule</mat-icon>
              <span>{{ duration }} minutes</span>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .provider-profile-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 400px;
      text-align: center;
    }

    .error-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
      margin-bottom: 16px;
    }

    .profile-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .header-card {
      position: relative;
    }

    .header-content {
      display: flex;
      gap: 24px;
      margin-bottom: 20px;
    }

    .provider-avatar {
      flex-shrink: 0;
    }

    .avatar-image {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar-placeholder mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #9e9e9e;
    }

    .provider-info {
      flex: 1;
    }

    .provider-info h1 {
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 500;
    }

    .business-name {
      font-size: 18px;
      color: #666;
      margin: 0 0 16px 0;
    }

    .rating-section {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .stars {
      display: flex;
      gap: 2px;
    }

    .star-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #ffc107;
    }

    .star-icon.empty {
      color: #e0e0e0;
    }

    .rating-text {
      font-size: 14px;
      color: #666;
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #666;
    }

    .info-item mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .book-button {
      width: 100%;
      height: 48px;
      font-size: 16px;
    }

    .book-button mat-icon {
      margin-right: 8px;
    }

    .section-card {
      padding: 24px;
    }

    .section-card h2 {
      margin: 0 0 16px 0;
      font-size: 24px;
      font-weight: 500;
    }

    .bio-text {
      line-height: 1.6;
      color: #666;
      white-space: pre-wrap;
    }

    .services-list mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .durations-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }

    .duration-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .duration-item mat-icon {
      color: #1976d2;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .contact-info {
        align-items: center;
      }

      .provider-info h1 {
        font-size: 24px;
      }
    }
  `]
})
export class ProviderProfileComponent implements OnInit, OnDestroy {
  provider: Provider | null = null;
  loading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();
  private providerId!: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.providerId = this.route.snapshot.paramMap.get('id') || '';
    const accessCode = this.route.snapshot.paramMap.get('accessCode');
    
    if (!this.providerId) {
      this.error = 'No provider ID provided';
      this.loading = false;
      return;
    }

    this.loadProvider(accessCode || undefined);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProvider(accessCode?: string) {
    this.loading = true;
    this.error = null;

    const url = accessCode 
      ? `${environment.apiUrl}/public/providers/${this.providerId}/${accessCode}`
      : `${environment.apiUrl}/public/providers/${this.providerId}`;

    this.http.get<Provider>(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (provider) => {
          this.provider = provider;
          this.loading = false;
        },
        error: (err) => {
          if (err.status === 403) {
            this.error = 'This provider profile is private. Please use the correct access link.';
          } else {
            this.error = err.error?.message || 'Failed to load provider information';
          }
          this.loading = false;
        }
      });
  }

  getProviderName(): string {
    if (!this.provider) return '';
    
    if (this.provider.businessName) {
      return this.provider.businessName;
    }
    
    if (this.provider.firstName || this.provider.lastName) {
      return `${this.provider.firstName || ''} ${this.provider.lastName || ''}`.trim();
    }
    
    return this.provider.email;
  }

  getStars(): number[] {
    const rating = Math.floor(this.provider?.rating || 0);
    return Array(rating).fill(0);
  }

  getEmptyStars(): number[] {
    const rating = Math.floor(this.provider?.rating || 0);
    return Array(5 - rating).fill(0);
  }

  bookAppointment() {
    if (this.providerId) {
      this.router.navigate(['/booking', this.providerId, 'duration']);
    }
  }

  goBack() {
    this.router.navigate(['/providers']);
  }
}
