import { Injectable } from '@angular/core';
import { Provider } from './provider.service';

export interface ScoringFilters {
  category?: string;
  city?: string;
  country?: string;
  searchQuery?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProviderScoringService {

  /**
   * Score and sort providers based on relevance to filters
   */
  scoreProviders(providers: Provider[], filters: ScoringFilters): Provider[] {
    const scored = providers.map(provider => ({
      ...provider,
      matchScore: this.calculateScore(provider, filters),
      matchReasons: this.getMatchReasons(provider, filters)
    }));

    // Sort by score (highest first), then by rating
    scored.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore! - a.matchScore!;
      }
      return (b.rating || 0) - (a.rating || 0);
    });

    return scored;
  }

  /**
   * Calculate relevance score for a provider
   */
  private calculateScore(provider: Provider, filters: ScoringFilters): number {
    let score = 0;

    // Category matching (highest priority - 10 points for exact, 5 for related)
    if (filters.category) {
      const categoryFilter = filters.category.toLowerCase().trim();
      const hasExactMatch = provider.categories?.some(cat => cat.toLowerCase() === categoryFilter) ||
                            provider.customCategories?.some(cat => cat.toLowerCase() === categoryFilter);
      const hasPartialMatch = provider.categories?.some(cat => cat.toLowerCase().includes(categoryFilter)) ||
                              provider.customCategories?.some(cat => cat.toLowerCase().includes(categoryFilter));
      
      if (hasExactMatch) {
        score += 10;
      } else if (hasPartialMatch) {
        score += 5;
      }
    }
    
    // City matching (8 points)
    if (filters.city) {
      if (provider.locationDetails?.city?.toLowerCase() === filters.city.toLowerCase()) {
        score += 8;
      }
    }
    
    // Country matching (5 points)
    if (filters.country) {
      if (provider.locationDetails?.country?.toLowerCase() === filters.country.toLowerCase()) {
        score += 5;
      }
    }
    
    // Search query matching (7 points for service, 6 for category, 4 for business name, 3 for bio)
    if (filters.searchQuery?.trim()) {
      const query = filters.searchQuery.toLowerCase();
      const searchTerms = query.split(/\s+/).filter(term => term.length > 0);
      
      // Check services
      if (provider.services?.some(s => searchTerms.some(term => s.toLowerCase().includes(term)))) {
        score += 7;
      }
      
      // Check categories
      if (provider.categories?.some(c => searchTerms.some(term => c.toLowerCase().includes(term)))) {
        score += 6;
      }
      
      // Check business name
      if (provider.businessName?.toLowerCase().includes(query)) {
        score += 4;
      }
      
      // Check bio/description
      const bioText = [provider.bio, provider.businessDescription].filter(Boolean).join(' ').toLowerCase();
      if (searchTerms.some(term => bioText.includes(term))) {
        score += 3;
      }
    }
    
    return score;
  }

  /**
   * Get human-readable match reasons
   */
  private getMatchReasons(provider: Provider, filters: ScoringFilters): string[] {
    const reasons: string[] = [];

    if (filters.category) {
      const categoryFilter = filters.category.toLowerCase().trim();
      const hasExactMatch = provider.categories?.some(cat => cat.toLowerCase() === categoryFilter) ||
                            provider.customCategories?.some(cat => cat.toLowerCase() === categoryFilter);
      const hasPartialMatch = provider.categories?.some(cat => cat.toLowerCase().includes(categoryFilter)) ||
                              provider.customCategories?.some(cat => cat.toLowerCase().includes(categoryFilter));
      
      if (hasExactMatch) {
        reasons.push('Exact category match');
      } else if (hasPartialMatch) {
        reasons.push('Related category');
      }
    }
    
    if (filters.city && provider.locationDetails?.city?.toLowerCase() === filters.city.toLowerCase()) {
      reasons.push('City match');
    }
    
    if (filters.country && provider.locationDetails?.country?.toLowerCase() === filters.country.toLowerCase()) {
      reasons.push('Country match');
    }
    
    if (filters.searchQuery?.trim()) {
      const query = filters.searchQuery.toLowerCase();
      const searchTerms = query.split(/\s+/).filter(term => term.length > 0);
      
      if (provider.services?.some(s => searchTerms.some(term => s.toLowerCase().includes(term)))) {
        reasons.push('Service match');
      }
      
      if (provider.categories?.some(c => searchTerms.some(term => c.toLowerCase().includes(term)))) {
        reasons.push('Category keyword match');
      }
      
      if (provider.businessName?.toLowerCase().includes(query)) {
        reasons.push('Business name match');
      }
      
      const bioText = [provider.bio, provider.businessDescription].filter(Boolean).join(' ').toLowerCase();
      if (searchTerms.some(term => bioText.includes(term))) {
        reasons.push('Description match');
      }
    }

    return reasons;
  }

  /**
   * Apply hard filters (remove providers that don't match)
   */
  applyHardFilters(providers: Provider[], filters: {
    rating?: number;
    usernameSearch?: string;
  }): Provider[] {
    let filtered = providers;

    // Username search is a hard filter
    if (filters.usernameSearch) {
      const username = filters.usernameSearch.toLowerCase();
      filtered = filtered.filter(p => p.username?.toLowerCase().includes(username));
    }

    // Rating is a hard filter (quality threshold)
    if (filters.rating && filters.rating > 0) {
      const minRating = filters.rating;
      const maxRating = filters.rating < 5 ? filters.rating + 0.9 : 5.0;
      
      const inRange = filtered.filter(p => {
        const rating = p.rating || 0;
        return rating >= minRating && rating <= maxRating;
      });
      
      if (inRange.length > 0) {
        filtered = inRange;
      }
    }

    return filtered;
  }
}
