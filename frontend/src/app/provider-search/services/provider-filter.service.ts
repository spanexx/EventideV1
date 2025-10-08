import { Injectable } from '@angular/core';
import { Provider } from './provider.service';

@Injectable({
  providedIn: 'root'
})
export class ProviderFilterService {

  /**
   * Extract unique countries from providers
   */
  extractCountries(providers: Provider[]): string[] {
    const countrySet = new Set<string>();
    
    providers.forEach(provider => {
      if (provider.locationDetails?.country) {
        countrySet.add(provider.locationDetails.country);
      }
    });
    
    const countries = Array.from(countrySet).sort();
    console.log('🌍 Extracted countries:', countries.length);
    return countries;
  }

  /**
   * Extract cities for a specific country
   */
  extractCitiesForCountry(providers: Provider[], country: string): string[] {
    const citySet = new Set<string>();
    
    providers.forEach(provider => {
      if (provider.locationDetails?.country === country && provider.locationDetails?.city) {
        citySet.add(provider.locationDetails.city);
      }
    });
    
    const cities = Array.from(citySet).sort();
    console.log(`🏙️ Extracted cities for ${country}:`, cities.length);
    return cities;
  }

  /**
   * Extract categories sorted by rating and review count
   */
  extractCategories(providers: Provider[]): string[] {
    const categoryStats = new Map<string, { totalRating: number; totalReviews: number; count: number }>();
    
    // Collect stats for each category
    providers.forEach(provider => {
      const categories = [...(provider.categories || []), ...(provider.customCategories || [])];
      categories.forEach(cat => {
        if (!categoryStats.has(cat)) {
          categoryStats.set(cat, { totalRating: 0, totalReviews: 0, count: 0 });
        }
        const stats = categoryStats.get(cat)!;
        stats.totalRating += provider.rating || 0;
        stats.totalReviews += provider.reviewCount || 0;
        stats.count += 1;
      });
    });
    
    // Sort categories by average rating (desc), then by total reviews (desc)
    const categories = Array.from(categoryStats.entries())
      .sort((a, b) => {
        const avgRatingA = a[1].totalRating / a[1].count;
        const avgRatingB = b[1].totalRating / b[1].count;
        
        if (Math.abs(avgRatingA - avgRatingB) > 0.1) {
          return avgRatingB - avgRatingA; // Higher rating first
        }
        
        return b[1].totalReviews - a[1].totalReviews; // More reviews first
      })
      .map(entry => entry[0]);
    
    console.log('📊 Extracted categories:', categories.length);
    return categories;
  }

  /**
   * Normalize city name to match proper casing
   */
  normalizeCityName(city: string, availableCities: string[]): string {
    if (!city) return city;
    
    const lowerCity = city.toLowerCase().trim();
    const match = availableCities.find(c => c.toLowerCase().trim() === lowerCity);
    
    if (match) {
      return match; // Return the properly cased version
    }
    
    // If no match found, title case the city name
    return city.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Get properly cased city name from available cities
   */
  getProperCasedCity(city: string, availableCities: string[]): string {
    if (!city) return city;
    
    const lowerCity = city.toLowerCase().trim();
    const match = availableCities.find(c => c.toLowerCase().trim() === lowerCity);
    return match || city;
  }
}
