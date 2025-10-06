import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { environment } from '../../environments/environment';

interface Provider {
  id: string;
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

interface Statistic {
  value: number;
  label: string;
  icon: string;
  color: string;
  target: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  searchQuery = '';
  featuredProviders: Provider[] = [];
  loadingProviders = false;
  private destroy$ = new Subject<void>();

  // Animated statistics
  animatedStats = {
    providers: 0,
    bookings: 0,
    satisfaction: 0
  };

  // Statistics for dashboard
  statistics: Statistic[] = [
    { value: 1247, label: 'Active Providers', icon: 'people', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', target: 2000 },
    { value: 15683, label: 'Total Bookings', icon: 'event_available', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', target: 20000 },
    { value: 98, label: 'Satisfaction Rate', icon: 'sentiment_very_satisfied', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', target: 100 },
    { value: 4.9, label: 'Average Rating', icon: 'star', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', target: 5 }
  ];

  // Steps for how it works
  steps = [
    {
      icon: 'search',
      title: 'Discover Providers',
      description: 'Browse through our curated list of verified professionals or search by service, location, and availability.'
    },
    {
      icon: 'event',
      title: 'Choose Your Time',
      description: 'Select from real-time available slots that fit your schedule. Instant confirmation guaranteed.'
    },
    {
      icon: 'qr_code_2',
      title: 'Get Your QR Code',
      description: 'Receive instant confirmation with a unique QR code for seamless check-in and tracking.'
    }
  ];

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadFeaturedProviders();
    this.animateStats();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private animateStats() {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    const targets = {
      providers: 1247,
      bookings: 15683,
      satisfaction: 98
    };

    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      this.animatedStats.providers = Math.floor(targets.providers * progress);
      this.animatedStats.bookings = Math.floor(targets.bookings * progress);
      this.animatedStats.satisfaction = Math.floor(targets.satisfaction * progress);

      if (currentStep >= steps) {
        clearInterval(timer);
        this.animatedStats = targets;
      }
    }, interval);
  }

  private loadFeaturedProviders() {
    this.loadingProviders = true;
    
    this.http.get<any>(`${environment.apiUrl}/public/providers?limit=6`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.featuredProviders = response.providers || [];
          this.loadingProviders = false;
        },
        error: (err) => {
          console.error('Failed to load providers:', err);
          this.loadingProviders = false;
        }
      });
  }

  getProviderName(provider: Provider): string {
    if (provider.businessName) {
      return provider.businessName;
    }
    if (provider.firstName || provider.lastName) {
      return `${provider.firstName || ''} ${provider.lastName || ''}`.trim();
    }
    return 'Provider';
  }

  search() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/providers'], { 
        queryParams: { search: this.searchQuery } 
      });
    } else {
      this.browseProviders();
    }
  }

  browseProviders() {
    this.router.navigate(['/providers']);
  }

  viewProvider(providerId: string) {
    this.router.navigate(['/provider', providerId]);
  }

  bookProvider(event: Event, providerId: string) {
    event.stopPropagation();
    this.router.navigate(['/booking', providerId, 'duration']);
  }

  scrollToHowItWorks() {
    const element = document.querySelector('.how-it-works-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
  }

  navigateToSignup() {
    this.router.navigate(['/auth/signup']);
  }

  navigateToBookingLookup() {
    this.router.navigate(['/booking-lookup']);
  }
}
