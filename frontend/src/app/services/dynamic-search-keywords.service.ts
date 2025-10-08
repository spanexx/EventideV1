import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SearchKeyword {
  keyword: string;
  category: string;
  synonyms?: string[];
  weight?: number;
  relatedKeywords?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DynamicSearchKeywordsService {
  private http = inject(HttpClient);
  private API_URL = `${environment.apiUrl}/search-keywords`;
  
  private keywordsCache = new Map<string, SearchKeyword[]>();
  private categoriesCache: string[] | null = null;
  private lastFetchTime = new Map<string, number>();

  /**
   * Get all search keywords, with optional category filter
   */
  getKeywords(category?: string): Observable<SearchKeyword[]> {
    const cacheKey = category || 'all';
    const cached = this.keywordsCache.get(cacheKey);
    const lastFetch = this.lastFetchTime.get(cacheKey) || 0;
    const now = Date.now();
    
    // Use cached data if less than 5 minutes old
    if (cached && (now - lastFetch) < 5 * 60 * 1000) {
      return new BehaviorSubject<SearchKeyword[]>(cached).asObservable();
    }
    
    const params: any = {};
    if (category) {
      params.category = category;
    }
    
    return this.http.get<SearchKeyword[]>(this.API_URL, { params });
  }

  /**
   * Get all available categories
   */
  getCategories(): Observable<string[]> {
    const now = Date.now();
    
    // Use cached categories if less than 5 minutes old
    if (this.categoriesCache && (now - (this.lastFetchTime.get('categories') || 0)) < 5 * 60 * 1000) {
      return new BehaviorSubject<string[]>(this.categoriesCache).asObservable();
    }
    
    return this.http.get<string[]>(`${this.API_URL}/categories`);
  }

  /**
   * Get search suggestions for a query
   */
  getSuggestions(query: string): Observable<SearchKeyword[]> {
    if (!query || query.length < 2) {
      return new BehaviorSubject<SearchKeyword[]>([]).asObservable();
    }
    
    return this.http.get<SearchKeyword[]>(`${this.API_URL}/suggestions`, {
      params: { q: query }
    });
  }

  /**
   * Expand query with related keywords
   */
  async expandQuery(query: string): Promise<string> {
    if (!query) return query;
    
    try {
      const result = await firstValueFrom(
        this.http.get<{ expandedQuery: string }>(`${this.API_URL}/expand`, {
          params: { q: query }
        })
      );
      return result.expandedQuery;
    } catch (error) {
      console.warn('Failed to expand query, returning original:', error);
      return query;
    }
  }

  /**
   * Initialize the service by fetching initial data
   */
  async initialize(): Promise<void> {
    try {
      // Fetch categories
      const categories = await firstValueFrom(this.getCategories());
      this.categoriesCache = categories;
      this.lastFetchTime.set('categories', Date.now());
      
      console.log('Dynamic search keywords service initialized with', categories.length, 'categories');
    } catch (error) {
      console.error('Failed to initialize dynamic search keywords service:', error);
    }
  }

  /**
   * Update local cache with fresh data
   */
  updateCache(category: string | undefined, keywords: SearchKeyword[]): void {
    const cacheKey = category || 'all';
    this.keywordsCache.set(cacheKey, keywords);
    this.lastFetchTime.set(cacheKey, Date.now());
  }
}