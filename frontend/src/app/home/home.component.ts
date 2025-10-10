import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';
import { ProviderSearchService } from '../services/provider-search.service';
import { ProviderService, Provider } from '../provider-search/services/provider.service';
// Home subcomponents (standalone)
import { HeroNavComponent } from './components/hero/hero-nav.component';
import { HeroSearchBarComponent } from './components/hero/hero-search-bar.component';
import { HeroStatsComponent } from './components/hero/hero-stats.component';
import { AnimatedBackgroundComponent } from './components/hero/animated-background.component';
import { StatsDashboardComponent } from './components/stats-dashboard/stats-dashboard.component';
import { HowItWorksComponent } from './components/how-it-works/how-it-works.component';
import { FeaturedProvidersComponent } from './components/featured-providers/featured-providers.component';
import { TrustSectionComponent } from './components/trust/trust-section.component';
import { FinalCtaComponent } from './components/final-cta/final-cta.component';

// Using shared Provider interface from ProviderService

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
    MatChipsModule,
    MatSnackBarModule,
    // Standalone child components used in template
    HeroNavComponent,
    HeroSearchBarComponent,
    HeroStatsComponent,
    AnimatedBackgroundComponent,
    StatsDashboardComponent,
    HowItWorksComponent,
    FeaturedProvidersComponent,
    TrustSectionComponent,
    FinalCtaComponent,
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

  private searchService = inject(ProviderSearchService);
  private providerService = inject(ProviderService);
  private snackBar = inject(MatSnackBar);

  constructor(
    private router: Router,
    private http: HttpClient
  ) {}
  // Trust items for trust section
  trustItems = [
    { icon: 'security', title: 'Secure & Private', description: 'Your data is encrypted.' },
    { icon: 'verified_user', title: 'Verified Providers', description: 'Thoroughly vetted professionals.' },
    { icon: 'support_agent', title: '24/7 Support', description: 'We are here to help.' },
    { icon: 'thumb_up', title: 'Satisfaction Guaranteed', description: '98% rating.' },
  ];

  ngOnInit(): void {
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
    this.providerService
      .getProviders(false)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (providers) => {
          // Take top 6 as featured (could be improved with a dedicated flag)
          this.featuredProviders = (providers || []).slice(0, 6);
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

  async search() {
    if (!this.searchQuery.trim()) {
      this.browseProviders();
      return;
    }

    try {
      // Show loading indicator
      this.snackBar.open('🔍 Understanding your search...', '', { duration: 2000 });
      
      // Parse natural language query
      const parsed = await this.searchService.parseNaturalLanguageQuery(this.searchQuery);
      
      console.log('📊 Parsed query:', parsed);
      
      // Show interpretation to user
      if (parsed.confidence > 0.7) {
        this.snackBar.open(`✨ ${parsed.interpretation}`, '', { duration: 3000 });
      }
      
      // Navigate to search page with parsed criteria
      const queryParams: any = {};
      
      if (parsed.criteria.username) {
        queryParams.search = `@${parsed.criteria.username}`;
      } else {
        // Build search query from criteria
        const searchTerms: string[] = [];
        if (parsed.criteria.name) searchTerms.push(parsed.criteria.name);
        if (parsed.criteria.service) searchTerms.push(parsed.criteria.service);
        if (parsed.criteria.location) searchTerms.push(parsed.criteria.location);
        if (parsed.criteria.searchText) searchTerms.push(parsed.criteria.searchText);
        
        if (searchTerms.length > 0) {
          queryParams.search = searchTerms.join(' ');
        }
      }
      
      if (parsed.criteria.category) {
        queryParams.category = parsed.criteria.category;
      }
      
      if (parsed.criteria.rating) {
        queryParams.rating = parsed.criteria.rating;
      }
      
      // Add location-based filters if location is detected
      if (parsed.criteria.location) {
        // Parse location to extract city and potentially country
        const locationInfo = this.parseLocationInfo(parsed.criteria.location);
        if (locationInfo.city) {
          // Normalize city name (we'll do this properly in the provider search component)
          queryParams.city = locationInfo.city;
        }
        if (locationInfo.country) {
          queryParams.country = locationInfo.country;
        } else {
          // Default to USA if no country specified
          queryParams.country = 'USA';
        }
      }
      
      // Ensure we use the correct category name
      if (queryParams.category === 'Consulting') {
        queryParams.category = 'Business Consulting';
      }
      
      this.router.navigate(['/providers'], { queryParams });
      
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to simple search
      this.router.navigate(['/providers'], { 
        queryParams: { search: this.searchQuery } 
      });
    }
  }

  browseProviders() {
    this.router.navigate(['/providers']);
  }

  viewProvider(providerId: string) {
    this.router.navigate(['/provider', providerId]);
  }

  bookProvider(providerId: string) {
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

  /**
   * Parse location string to extract city and country information
   */
  private parseLocationInfo(location: string): { city: string | null; country: string | null } {
    if (!location) {
      return { city: null, country: null };
    }
    
    // Split by comma to separate location parts
    const parts = location.split(',').map(part => part.trim());
    
    if (parts.length === 0) {
      return { city: null, country: null };
    }
    
    // Simple heuristic: 
    // - If only one part, assume it's a city
    // - If two parts, first is city, second might be state/country
    // - If three parts, first is city, second is state, third is country
    
    let city: string | null = null;
    let country: string | null = null;
    
    if (parts.length >= 1) {
      city = parts[0];
    }
    
    if (parts.length >= 3) {
      // Third part is likely the country
      country = parts[2];
    } else if (parts.length >= 2) {
      // Check if second part looks like a country
      const potentialCountry = parts[parts.length - 1].toLowerCase();
      const commonCountries = ['usa', 'us', 'united states', 'uk', 'united kingdom', 'canada', 'australia'];
      if (commonCountries.includes(potentialCountry)) {
        country = parts[parts.length - 1];
      } else {
        // If second part doesn't look like a country, assume it's a city
        city = parts[0] + ' ' + parts[1]; // Combine first two parts as city name
      }
    }
    
    return { city, country };
  }
}