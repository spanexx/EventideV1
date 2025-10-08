import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';


interface Provider {
  _id: string;
  id?: string;
  name: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  bio?: string;
  location?: string;
  locationDetails?: {
    country?: string;
    countryCode?: string;
    city?: string;
    cityCode?: string;
    address?: string;
  };
  contactPhone?: string;
  services?: string[];
  categories?: string[];
  availableDurations?: number[];
  rating?: number;
  reviewCount?: number;
  matchScore?: number;
  matchReasons?: string[];
}

@Component({
  selector: 'app-provider-search-results',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './provider-search-results.component.html',
  styleUrls: ['./provider-search-results.component.scss']
})
export class ProviderSearchResultsComponent {
  @Input() loading: boolean = false;
  @Input() providers: Provider[] = [];
  @Input() selectedRating: number = 0;
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 10;
  @Input() totalProviders: number = 0;
  @Input() totalPages: number = 0;
  @Input() selectedCountry: string = '';
  @Input() selectedCity: string = '';
  @Input() availableCountries: string[] = [];
  @Input() availableCities: string[] = [];
  
  @Output() viewProvider = new EventEmitter<string>();
  @Output() bookProvider = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() previousPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();
  @Output() countryChange = new EventEmitter<string>();
  @Output() cityChange = new EventEmitter<string>();


  Math = Math;

  getFullName(provider: Provider): string {
    if (provider.firstName && provider.lastName) {
      return `${provider.firstName} ${provider.lastName}`;
    }
    return provider.name || provider.email;
  }

  getServices(provider: Provider): string[] {
    return provider.services || [];
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
    
    const provider = this.providers[index];
    const rating = provider.rating || 0;
    
    const minRating = this.selectedRating;
    const maxRating = this.selectedRating < 5 ? this.selectedRating + 0.9 : 5.0;
    
    const isOutsideRange = rating < minRating || rating > maxRating;
    if (!isOutsideRange) return false;
    
    if (index === 0) return true;
    
    const previousProvider = this.providers[index - 1];
    const prevRating = previousProvider.rating || 0;
    const prevInRange = prevRating >= minRating && prevRating <= maxRating;
    
    return prevInRange;
  }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (this.currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(this.totalPages - 1, this.currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (this.currentPage < this.totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(this.totalPages);
    }
    
    return pages;
  }

  handlePageClick(page: number | string) {
    if (typeof page === 'number') {
      this.pageChange.emit(page);
    }
  }

  getMatchQuality(provider: Provider): 'perfect' | 'good' | 'fair' | 'none' {
    const score = provider.matchScore || 0;
    if (score >= 15) return 'perfect';
    if (score >= 8) return 'good';
    if (score >= 3) return 'fair';
    return 'none';
  }

  getMatchBadgeText(provider: Provider): string {
    const quality = this.getMatchQuality(provider);
    switch (quality) {
      case 'perfect': return 'Perfect Match';
      case 'good': return 'Good Match';
      case 'fair': return 'Partial Match';
      default: return '';
    }
  }

  showMatchBadge(provider: Provider): boolean {
    return (provider.matchScore || 0) >= 3;
  }
}
