import { Injectable, inject, OnInit } from '@angular/core';
import { DynamicSearchKeywordsService, SearchKeyword } from './dynamic-search-keywords.service';
import { ALL_SERVICE_KEYWORDS, getCategoryForKeyword } from './search-keywords';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdvancedSearchService {
  private dynamicKeywords = inject(DynamicSearchKeywordsService);
  
  private cachedDynamicKeywords: SearchKeyword[] = [];
  private cachedCategories: string[] = [];

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Load dynamic keywords and categories
      this.cachedDynamicKeywords = await firstValueFrom(this.dynamicKeywords.getKeywords());
      this.cachedCategories = await firstValueFrom(this.dynamicKeywords.getCategories());
      console.log('Advanced search service initialized with', this.cachedDynamicKeywords.length, 'dynamic keywords');
    } catch (error) {
      console.warn('Failed to load dynamic keywords, using static keywords only:', error);
    }
  }

  /**
   * Get category for a keyword using both static and dynamic keywords
   */
  getCategoryForKeyword(keyword: string): string | null {
    const lowerKeyword = keyword.toLowerCase().trim();
    
    // First check dynamic keywords
    const dynamicMatch = this.cachedDynamicKeywords.find(kw => 
      kw.keyword.toLowerCase() === lowerKeyword || 
      (kw.synonyms && kw.synonyms.some(syn => syn.toLowerCase() === lowerKeyword))
    );
    
    if (dynamicMatch) {
      return dynamicMatch.category;
    }
    
    // Fall back to static keywords
    return getCategoryForKeyword(keyword);
  }

  /**
   * Get all available service keywords (static + dynamic)
   */
  getAllServiceKeywords(): string[] {
    const dynamicKeywords = this.cachedDynamicKeywords.map(kw => kw.keyword);
    return [...new Set([...ALL_SERVICE_KEYWORDS, ...dynamicKeywords])];
  }

  /**
   * Get all available categories (static + dynamic)
   */
  getAllCategories(): string[] {
    const staticCategories = [
      'Software Development', 'Design', 'Marketing', 'Business Consulting',
      'Financial Services', 'Legal Services', 'Health & Wellness', 'Education',
      'Media & Entertainment', 'Writing', 'Real Estate', 'HR Consulting',
      'Logistics', 'Hospitality', 'Cybersecurity', 'Data Analytics'
    ];
    
    return [...new Set([...staticCategories, ...this.cachedCategories])];
  }

  /**
   * Get search suggestions with enhanced logic
   */
  async getEnhancedSuggestions(query: string): Promise<{ keyword: string; category: string }[]> {
    if (!query || query.length < 2) {
      return [];
    }
    
    try {
      // Get dynamic suggestions
      const dynamicSuggestions = await firstValueFrom(this.dynamicKeywords.getSuggestions(query));
      
      // Get static keyword matches
      const lowerQuery = query.toLowerCase();
      const staticMatches = ALL_SERVICE_KEYWORDS
        .filter(keyword => keyword.toLowerCase().includes(lowerQuery))
        .slice(0, 10)
        .map(keyword => ({
          keyword,
          category: getCategoryForKeyword(keyword) || 'Other'
        }));
      
      // Combine and deduplicate
      const allSuggestions = [...dynamicSuggestions, ...staticMatches];
      const uniqueSuggestions = new Map<string, { keyword: string; category: string }>();
      
      allSuggestions.forEach(suggestion => {
        if (!uniqueSuggestions.has(suggestion.keyword.toLowerCase())) {
          uniqueSuggestions.set(suggestion.keyword.toLowerCase(), suggestion);
        }
      });
      
      return Array.from(uniqueSuggestions.values());
    } catch (error) {
      console.warn('Failed to get enhanced suggestions:', error);
      return [];
    }
  }

  /**
   * Expand query using both static and dynamic logic
   */
  async expandQuery(query: string): Promise<string> {
    if (!query) return query;
    
    try {
      // Try dynamic expansion first
      const expanded = await this.dynamicKeywords.expandQuery(query);
      if (expanded !== query) {
        return expanded;
      }
      
      // Fall back to static expansion logic
      return this.expandQueryStatic(query);
    } catch (error) {
      console.warn('Failed to expand query dynamically, using static expansion:', error);
      return this.expandQueryStatic(query);
    }
  }

  /**
   * Static query expansion logic
   */
  private expandQueryStatic(query: string): string {
    const terms = query.toLowerCase().split(/\s+/);
    const expandedTerms = new Set<string>(terms);
    
    // Add common variations and synonyms
    const expansions: { [key: string]: string[] } = {
      'dev': ['developer', 'development'],
      'devs': ['developers', 'development'],
      'consult': ['consultant', 'consulting'],
      'consults': ['consultants', 'consulting'],
      'photo': ['photographer', 'photography'],
      'design': ['designer', 'designing'],
      'market': ['marketing', 'marketer'],
      'write': ['writer', 'writing'],
      'teach': ['teacher', 'teaching'],
      'train': ['trainer', 'training']
    };
    
    terms.forEach(term => {
      if (expansions[term]) {
        expansions[term].forEach(expansion => expandedTerms.add(expansion));
      }
    });
    
    return Array.from(expandedTerms).join(' ');
  }

  /**
   * Smart category matching that considers context and weights
   */
  async getSmartCategoryMatch(service: string, context?: string): Promise<string | null> {
    // Try direct match first
    let category = this.getCategoryForKeyword(service);
    if (category) {
      return category;
    }
    
    // If no direct match, try context-aware matching
    if (context) {
      // Look for keywords in context that might help categorize
      const contextTerms = context.toLowerCase().split(/\s+/);
      
      // Check if any context terms match known categories
      for (const term of contextTerms) {
        const termCategory = this.getCategoryForKeyword(term);
        if (termCategory) {
          return termCategory;
        }
      }
    }
    
    return null;
  }
}