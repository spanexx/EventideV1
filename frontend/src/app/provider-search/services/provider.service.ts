import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Provider {
  _id: string;
  id?: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  businessDescription?: string;
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
  customCategories?: string[];
  specialties?: string[];
  availableDurations?: number[];
  rating?: number;
  reviewCount?: number;
  matchScore?: number;
  matchReasons?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private cache$ = new BehaviorSubject<Provider[]>([]);
  private lastFetched: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private API_URL = `${environment.apiUrl}/public/providers`;

  constructor(private http: HttpClient) {}

  /**
   * Get providers with caching
   * @param forceRefresh - Force refresh even if cache is valid
   */
  getProviders(forceRefresh = false): Observable<Provider[]> {
    const now = Date.now();
    const isCacheValid = (now - this.lastFetched) < this.CACHE_DURATION;
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && isCacheValid && this.cache$.value.length > 0) {
      console.log('📦 Using cached providers:', this.cache$.value.length);
      return this.cache$.asObservable();
    }
    
    console.log('🌐 Fetching providers from API...');
    return this.http.get<any>(`${this.API_URL}?limit=100`).pipe(
      map(response => {
        const data = response.data || response;
        return Array.isArray(data) ? data : (data.providers || []);
      }),
      tap(providers => {
        this.cache$.next(providers);
        this.lastFetched = now;
        console.log('✅ Providers cached:', providers.length);
      })
    );
  }

  /**
   * Get cached providers synchronously
   */
  getCachedProviders(): Provider[] {
    return this.cache$.value;
  }

  /**
   * Check if cache is valid
   */
  isCacheValid(): boolean {
    const now = Date.now();
    return (now - this.lastFetched) < this.CACHE_DURATION && this.cache$.value.length > 0;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache$.next([]);
    this.lastFetched = 0;
    console.log('🗑️ Provider cache cleared');
  }

  /**
   * Get cache age in seconds
   */
  getCacheAge(): number {
    return Math.floor((Date.now() - this.lastFetched) / 1000);
  }
}
