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
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../environments/environment';

interface Provider {
  id: string;
  email: string;
  username?: string;
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
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './provider-profile.component.html',
  styleUrls: ['./provider-profile.component.scss']
})
export class ProviderProfileComponent implements OnInit, OnDestroy {
  provider: Provider | null = null;
  providerId: string | null = null;
  loading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.providerId = params['id'];
        if (this.providerId) {
          this.loadProvider();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProvider() {
    this.loading = true;
    this.error = null;

    this.http.get<any>(`${environment.apiUrl}/public/providers/${this.providerId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.provider = response.data || response;
          console.log('✅ [Provider Profile] Loaded provider:', this.provider);
          console.log('📋 [Provider Profile] Username:', this.provider?.username);
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
