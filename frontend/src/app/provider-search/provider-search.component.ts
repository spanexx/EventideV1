import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProviderSearchHeaderComponent } from './components/provider-search-header.component';
import { ProviderSearchCategoryComponent } from './components/provider-search-category.component';
import { ProviderSearchResultsComponent } from './components/provider-search-results.component';
import { Provider, ProviderService } from './services/provider.service';
import { ProviderScoringService } from './services/provider-scoring.service';
import { ProviderFilterService } from './services/provider-filter.service';
import * as SearchFiltersActions from '../store/search-filters/search-filters.actions';
import * as SearchFiltersSelectors from '../store/search-filters/search-filters.selectors';
import * as ProvidersActions from '../store/providers/providers.actions';
import * as ProvidersSelectors from '../store/providers/providers.selectors';

@Component({
  selector: 'app-provider-search',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    ProviderSearchHeaderComponent,
    ProviderSearchCategoryComponent,
    ProviderSearchResultsComponent
  ],
  templateUrl: './provider-search.component.html',
  styleUrls: ['./provider-search.component.scss']
})
export class ProviderSearchComponent implements OnInit, OnDestroy {
  searchQuery: string = '';
  providers: Provider[] = [];
  allProviders: Provider[] = [];
  loading: boolean = false;
  error: string | null = null;
  searched: boolean = false;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalProviders: number = 0;
  totalPages: number = 0;


  
  // Filters
  selectedCategory: string = '';
  selectedRating: number = 0;
  selectedCountry: string = '';
  selectedCity: string = '';
  hoverRating: number = 0;
  availableCategories: string[] = [];
  availableCountries: string[] = [];
  availableCities: string[] = [];
  maxVisibleCategories: number = 6;
  
  // Expose Math to template
  Math = Math;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store,
    private providerService: ProviderService,
    private scoringService: ProviderScoringService,
    private filterService: ProviderFilterService
  ) {}

  ngOnInit() {
    console.log('🌍 Initializing provider search component');

    const searchQuery$ = this.store.select(SearchFiltersSelectors.selectSearchQuery);
    const selectedCategory$ = this.store.select(SearchFiltersSelectors.selectSelectedCategory);
    const selectedRating$ = this.store.select(SearchFiltersSelectors.selectSelectedRating);
    const selectedCountry$ = this.store.select(SearchFiltersSelectors.selectSelectedCountry);
    const selectedCity$ = this.store.select(SearchFiltersSelectors.selectSelectedCity);
    const availableCountries$ = this.store.select(SearchFiltersSelectors.selectAvailableCountries);
    const availableCities$ = this.store.select(SearchFiltersSelectors.selectAvailableCities);
    const availableCategories$ = this.store.select(SearchFiltersSelectors.selectAvailableCategories);

    // Subscribe to store values
    searchQuery$.subscribe(q => {
      console.log('🌍 Search query from store:', q);
      this.searchQuery = q;
    });
    selectedCategory$.subscribe(c => {
      console.log('🌍 Selected category from store:', c);
      this.selectedCategory = c;
    });
    selectedRating$.subscribe(r => {
      console.log('🌍 Selected rating from store:', r);
      this.selectedRating = r;
    });
    selectedCountry$.subscribe(c => {
      console.log('🌍 Selected country from store:', c);
      this.selectedCountry = c;
    });
    selectedCity$.subscribe(c => {
      console.log('🏙️ Selected city from store:', c);
      this.selectedCity = c;
    });
    availableCountries$.subscribe(c => {
      console.log('🌍 Available countries from store:', c);
      this.availableCountries = c;
    });
    availableCities$.subscribe(c => {
      console.log('🏙️ Available cities from store:', c);
      this.availableCities = c;
    });
    availableCategories$.subscribe(c => {
      console.log('📁 Available categories from store:', c);
      this.availableCategories = c;
    });

    // Handle query params
    this.route.queryParams.subscribe(params => {
      console.log('🌍 Route params:', params);
      if (params['search']) {
        this.store.dispatch(SearchFiltersActions.setSearchQuery({ query: params['search'] }));
      }
      if (params['category']) {
        this.store.dispatch(SearchFiltersActions.setSelectedCategory({ category: params['category'] }));
      }
      if (params['rating']) {
        this.store.dispatch(SearchFiltersActions.setSelectedRating({ rating: parseInt(params['rating']) }));
      }
      if (params['country']) {
        console.log('🌍 Setting country from params:', params['country']);
        this.store.dispatch(SearchFiltersActions.setSelectedCountry({ country: params['country'] }));
        this.selectedCountry = params['country'];
        // Extract cities for the selected country
        if (this.allProviders.length > 0) {
          this.extractCitiesForCountry(params['country']);
        }
      }
      if (params['city']) {
        // Normalize the city name to match the case in available cities
        const normalizedCity = this.filterService.normalizeCityName(params['city'], this.availableCities);
        this.store.dispatch(SearchFiltersActions.setSelectedCity({ city: normalizedCity }));
        this.selectedCity = normalizedCity;
      }
      
      this.loadAllProviders();
    });
  }


  loadAllProviders() {
    // Subscribe to providers from store first
    combineLatest([
      this.store.select(ProvidersSelectors.selectAllProviders),
      this.store.select(ProvidersSelectors.selectProvidersLoading),
      this.store.select(ProvidersSelectors.selectProvidersError),
      this.store.select(ProvidersSelectors.selectIsCacheValid)
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([providers, loading, error, isCacheValid]) => {
      this.allProviders = providers;
      this.loading = loading;
      this.error = error;
      
      // If we have cached providers, use them immediately
      if (providers.length > 0 && isCacheValid) {
        console.log('✅ Using cached providers:', providers.length);
        this.loading = false; // Set loading to false for cached data
        
        // Extract filter options
        this.extractCategories();
        this.extractCountries();
        
        // If country is selected, extract cities
        if (this.selectedCountry) {
          this.extractCitiesForCountry(this.selectedCountry);
          
          // Normalize city name if needed
          if (this.selectedCity) {
            const normalizedCity = this.filterService.getProperCasedCity(this.selectedCity, this.availableCities);
            if (normalizedCity !== this.selectedCity) {
              this.selectedCity = normalizedCity;
              this.store.dispatch(SearchFiltersActions.setSelectedCity({ city: normalizedCity }));
            }
          }
        }
        
        this.applyFilters();
      } else if (providers.length > 0 && !loading) {
        // Fresh data loaded
        console.log('✅ Providers loaded from API:', providers.length);
        
        // Extract filter options
        this.extractCategories();
        this.extractCountries();
        
        // If country is selected, extract cities
        if (this.selectedCountry) {
          this.extractCitiesForCountry(this.selectedCountry);
          
          // Normalize city name if needed
          if (this.selectedCity) {
            const normalizedCity = this.filterService.getProperCasedCity(this.selectedCity, this.availableCities);
            if (normalizedCity !== this.selectedCity) {
              this.selectedCity = normalizedCity;
              this.store.dispatch(SearchFiltersActions.setSelectedCity({ city: normalizedCity }));
            }
          }
        }
        
        this.applyFilters();
      }
    });
    
    // Dispatch action to load providers (will use cache if valid)
    this.store.dispatch(ProvidersActions.loadProviders());
  }

  extractCategories() {
    this.availableCategories = this.filterService.extractCategories(this.allProviders);
    this.store.dispatch(SearchFiltersActions.setAvailableCategories({ categories: this.availableCategories }));
  }

  extractCountries() {
    this.availableCountries = this.filterService.extractCountries(this.allProviders);
    this.store.dispatch(SearchFiltersActions.setAvailableCountries({ countries: this.availableCountries }));
  }
  
  extractCitiesForCountry(country: string) {
    this.availableCities = this.filterService.extractCitiesForCountry(this.allProviders, country);
    this.store.dispatch(SearchFiltersActions.setAvailableCities({ cities: this.availableCities }));
    
    // Normalize selected city if needed
    if (this.selectedCity) {
      const normalizedCity = this.filterService.getProperCasedCity(this.selectedCity, this.availableCities);
      if (normalizedCity !== this.selectedCity) {
        this.selectedCity = normalizedCity;
        this.store.dispatch(SearchFiltersActions.setSelectedCity({ city: normalizedCity }));
      }
    }
  }

  applyFilters() {
    console.log('🔍 Applying scoring and filters:', {
      searchQuery: this.searchQuery,
      selectedCategory: this.selectedCategory,
      selectedRating: this.selectedRating,
      selectedCountry: this.selectedCountry,
      selectedCity: this.selectedCity,
      totalProviders: this.allProviders.length
    });
  
    // Use scoring service to score and sort providers
    const scored = this.scoringService.scoreProviders(this.allProviders, {
      category: this.selectedCategory,
      city: this.selectedCity,
      country: this.selectedCountry,
      searchQuery: this.searchQuery
    });
    
    console.log('📊 Top 10 scored providers:', scored.slice(0, 10).map(p => 
      `${p.username}(score:${p.matchScore}, rating:${p.rating}, reasons:${p.matchReasons?.join(', ')})`
    ));
  
    // Apply hard filters using scoring service
    const usernameSearch = this.searchQuery.startsWith('@') ? this.searchQuery.substring(1) : undefined;
    const filtered = this.scoringService.applyHardFilters(scored, {
      rating: this.selectedRating,
      usernameSearch
    });
  
    this.providers = filtered;
    this.totalProviders = filtered.length;
    this.totalPages = Math.ceil(this.totalProviders / this.pageSize);
    this.currentPage = 1;
  
    console.log('📊 Scored and filtered results:', this.totalProviders, 'providers');
    console.log('Top 5 by relevance:', this.providers.slice(0, 5).map(p => 
      `${p.username}(score:${p.matchScore}, rating:${p.rating})`
    ));
  }

  search() {
    this.store.dispatch(SearchFiltersActions.setSearchQuery({ query: this.searchQuery }));
    this.searched = true;
    this.applyFilters();
  }

  selectCategory(category: string) {
    this.store.dispatch(SearchFiltersActions.setSelectedCategory({ category }));
    this.selectedCategory = category;
    this.applyFilters();
  }

  selectRating(rating: number) {
    this.store.dispatch(SearchFiltersActions.setSelectedRating({ rating }));
    this.selectedRating = rating;
    this.hoverRating = 0;
    console.log(`🌟 Selected rating: ${rating}`);
    this.applyFilters();
  }

  clearRating() {
    this.selectedRating = 0;
    this.hoverRating = 0;
    console.log('🌟 Rating filter cleared');
    this.applyFilters();
  }

  getVisibleCategories(): string[] {
    return this.availableCategories.slice(0, this.maxVisibleCategories);
  }

  getHiddenCategories(): string[] {
    return this.availableCategories.slice(this.maxVisibleCategories);
  }

  clearFilters() {
    this.store.dispatch(SearchFiltersActions.clearFilters());
    this.selectedCategory = '';
    this.selectedRating = 0;
    this.selectedCountry = '';
    this.selectedCity = '';
    this.hoverRating = 0;
    this.searchQuery = '';
    this.availableCities = []; // Clear cities when clearing filters
    console.log('🧹 Filters cleared');
    this.applyFilters();
  }
  selectCountry(country: string) {
    console.log('🌍 Selecting country:', country);
    console.log('🌍 Available countries:', this.availableCountries);
    this.store.dispatch(SearchFiltersActions.setSelectedCountry({ country }));
    this.selectedCountry = country;
    if (country) {
      console.log(`🌍 Extracting cities for country: ${country}`);
      this.extractCitiesForCountry(country);
      // Clear the selected city if it doesn't match the new country's cities
      if (this.selectedCity) {
        const normalizedCity = this.filterService.normalizeCityName(this.selectedCity, this.availableCities);
        if (normalizedCity !== this.selectedCity) {
          this.selectedCity = normalizedCity;
          this.store.dispatch(SearchFiltersActions.setSelectedCity({ city: normalizedCity }));
        }
      }
    } else {
      this.availableCities = [];
      this.selectedCity = '';
      this.store.dispatch(SearchFiltersActions.setSelectedCity({ city: '' }));
    }
    this.applyFilters();
  }

  selectCity(city: string) {
    // Normalize the city name to match the case in available cities
    const normalizedCity = this.filterService.normalizeCityName(city, this.availableCities);
    this.store.dispatch(SearchFiltersActions.setSelectedCity({ city: normalizedCity }));
    this.selectedCity = normalizedCity;
    this.applyFilters();
  }

  getFullName(provider: Provider): string {
    if (provider.firstName && provider.lastName) {
      return `${provider.firstName} ${provider.lastName}`;
    }
    return provider.name || provider.email;
  }

  getServices(provider: Provider): string[] {
    return provider.services || provider.specialties || [];
  }

  getPaginatedProviders(): Provider[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.providers.slice(start, end);
  }

  isOutsideRatingRange(provider: Provider): boolean {
    if (this.selectedRating === 0) return false;
    
    const rating = provider.rating || 0;
    const minRating = this.selectedRating;
    const maxRating = this.selectedRating < 5 ? this.selectedRating + 0.9 : 5.0;
    
    return rating < minRating || rating > maxRating;
  }

  isFirstBelowRating(index: number): boolean {
    if (this.selectedRating === 0) return false;
    
    const paginatedProviders = this.getPaginatedProviders();
    const provider = paginatedProviders[index];
    const rating = provider.rating || 0;
    
    const minRating = this.selectedRating;
    const maxRating = this.selectedRating < 5 ? this.selectedRating + 0.9 : 5.0;
    
    // Check if this provider is outside the rating range
    const isOutsideRange = rating < minRating || rating > maxRating;
    if (!isOutsideRange) return false;
    
    // Check if previous provider was in range (or doesn't exist)
    if (index === 0) {
      return true;
    }
    
    const previousProvider = paginatedProviders[index - 1];
    const prevRating = previousProvider.rating || 0;
    const prevInRange = prevRating >= minRating && prevRating <= maxRating;
    
    return prevInRange;
  }

  viewProvider(providerId: string | undefined) {
    if (!providerId) return;
    this.router.navigate(['/provider', providerId]);
  }

  bookProvider(providerId: string | undefined) {
    if (!providerId) return;
    this.router.navigate(['/booking', providerId, 'duration']);
  }

  onPageChange(page: number) {
    this.currentPage = page;
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.onPageChange(this.currentPage + 1);
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.onPageChange(this.currentPage - 1);
    }
  }

  handlePageClick(page: number | string) {
    if (typeof page === 'number') {
      this.onPageChange(page);
    }
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (this.currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (this.currentPage < this.totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(this.totalPages);
    }
    
    return pages;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
