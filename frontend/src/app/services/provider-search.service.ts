import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { GeminiAIService } from './gemini-ai.service';
import { ALL_SERVICE_KEYWORDS, LOCATION_KEYWORDS, getCategoryForKeyword } from './search-keywords';
import { AdvancedSearchService } from './advanced-search.service';

export interface SearchCriteria {
  service?: string;
  location?: string;
  username?: string;
  name?: string;
  category?: string;
  rating?: number;
  searchText?: string;
}

export interface ParsedQuery {
  criteria: SearchCriteria;
  interpretation: string;
  confidence: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProviderSearchService {
  private http = inject(HttpClient);
  private geminiAI = inject(GeminiAIService);
  private advancedSearch = inject(AdvancedSearchService);
  private API_URL = `${environment.apiUrl}/public/providers`;

  /**
   * Parse natural language query into structured search criteria
   * @param query Natural language search query
   * @returns Parsed search criteria with AI interpretation
   */
  async parseNaturalLanguageQuery(query: string): Promise<ParsedQuery> {
    try {
      console.log(`🔍 Parsing query: "${query}"`);
      
      // Use AI to understand the query
      const aiResult = await this.understandProviderQuery(query);
      
      if (aiResult) {
        console.log('✅ AI parsing successful:', aiResult);
        return aiResult;
      }
    } catch (error) {
      console.warn('⚠️ AI parsing failed, using rule-based fallback:', error);
    }
    
    // Fallback to rule-based parsing
    return this.parseQueryRuleBased(query);
  }

  /**
   * Use AI to understand provider search query
   */
  private async understandProviderQuery(query: string): Promise<ParsedQuery> {
    const prompt = `You are a search query parser for a provider booking platform. 
Parse the following natural language query into structured search criteria.

Query: "${query}"

Extract the following information if present:
- service: What service is the user looking for? (e.g., "web developer", "photographer", "consultant")
- location: Where is the user looking? (city, state, country)
- username: Is the user searching for a specific username? (starts with @)
- name: Is the user searching for a provider by name? (first name, last name, or business name)
- category: What category does this fall under? (e.g., "Web Development", "Photography", "Consulting")
- rating: Minimum rating if specified (1-5)

Respond ONLY with valid JSON in this exact format:
{
  "criteria": {
    "service": "extracted service or null",
    "location": "extracted location or null",
    "username": "extracted username without @ or null",
    "name": "extracted name or null",
    "category": "extracted category or null",
    "rating": number or null,
    "searchText": "general search text if no specific criteria"
  },
  "interpretation": "Brief explanation of what you understood",
  "confidence": 0.0 to 1.0
}

Examples:
Query: "web developer in poland"
Response: {"criteria":{"service":"web developer","location":"poland","category":"Web Development"},"interpretation":"Looking for web developers in Poland","confidence":0.9}

Query: "find @johnsmith"
Response: {"criteria":{"username":"johnsmith"},"interpretation":"Searching for user johnsmith","confidence":1.0}

Query: "5 star photographer in New York"
Response: {"criteria":{"service":"photographer","location":"New York","category":"Photography","rating":5},"interpretation":"Looking for 5-star photographers in New York","confidence":0.95}

Query: "Sarah Johnson business consultant"
Response: {"criteria":{"name":"Sarah Johnson","service":"business consultant","category":"Business Consulting"},"interpretation":"Searching for Sarah Johnson who is a business consultant","confidence":0.85}

Now parse this query:`;

    try {
      const response = await this.geminiAI.generateContent(prompt, {
        temperature: 0.3,
        maxOutputTokens: 1024
      });
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate structure
        if (parsed.criteria && typeof parsed.interpretation === 'string') {
          return {
            criteria: this.cleanCriteria(parsed.criteria),
            interpretation: parsed.interpretation,
            confidence: parsed.confidence || 0.7
          };
        }
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }
    
    throw new Error('AI parsing failed');
  }

  /**
   * Rule-based query parsing as fallback
   */
  private parseQueryRuleBased(query: string): ParsedQuery {
    const lowerQuery = query.toLowerCase().trim();
    const criteria: SearchCriteria = {};
    let interpretation = '';
    let confidence = 0.6;

    // Check for username search (@username)
    const usernameMatch = query.match(/@(\w+)/);
    if (usernameMatch) {
      criteria.username = usernameMatch[1];
      interpretation = `Searching for user @${usernameMatch[1]}`;
      confidence = 1.0;
      return { criteria, interpretation, confidence };
    }

    // Enhanced location parsing with better regex
    // Look for patterns like "in [location]", "at [location]", "located in [location]"
    for (const keyword of LOCATION_KEYWORDS) {
      const locationRegex = new RegExp(`${keyword}\\s+([\\w\\s,]+?)(?:\\s+(?:with|who|that|and|rated|near)|$)`, 'i');
      const locationMatch = query.match(locationRegex);
      if (locationMatch) {
        criteria.location = locationMatch[1].trim();
        break;
      }
    }

    // Check for rating patterns like "5 star", "4 stars", "rated 5"
    const ratingMatch = lowerQuery.match(/(?:rated\s+)?(\d)(?:\s*(?:star|stars|\+))?/);
    if (ratingMatch) {
      criteria.rating = parseInt(ratingMatch[1]);
    }

    // Enhanced service/category parsing using advanced search
    // Look for service keywords first
    const allKeywords = this.advancedSearch.getAllServiceKeywords();
    for (const service of allKeywords) {
      if (lowerQuery.includes(service.toLowerCase())) {
        criteria.service = service;
        // Try to get category for this service
        const category = this.advancedSearch.getCategoryForKeyword(service);
        if (category) {
          criteria.category = category;
        }
        break;
      }
    }
    
    // If location found but no service, try to extract service from before location
    if (criteria.location && !criteria.service) {
      for (const keyword of LOCATION_KEYWORDS) {
        const parts = query.split(new RegExp(`\\b${keyword}\\b`, 'i'));
        if (parts.length > 1) {
          const beforeLocation = parts[0].trim();
          if (beforeLocation) {
            criteria.service = beforeLocation;
            // Try to get category for extracted service
            const category = this.advancedSearch.getCategoryForKeyword(beforeLocation);
            if (category) {
              criteria.category = category;
            }
            break;
          }
        }
      }
    }

    // If no specific criteria found, use entire query as search text
    if (!criteria.service && !criteria.location && !criteria.name && !criteria.username) {
      criteria.searchText = query;
      interpretation = `General search for "${query}"`;
    } else {
      const parts = [];
      if (criteria.service) parts.push(`service: ${criteria.service}`);
      if (criteria.location) parts.push(`location: ${criteria.location}`);
      if (criteria.rating) parts.push(`rating: ${criteria.rating}+`);
      interpretation = `Searching for ${parts.join(', ')}`;
      confidence = 0.7;
    }

    return { criteria, interpretation, confidence };
  }

  /**
   * Clean and normalize criteria
   */
  private cleanCriteria(criteria: any): SearchCriteria {
    const cleaned: SearchCriteria = {};
    
    if (criteria.service && criteria.service !== 'null') cleaned.service = criteria.service;
    if (criteria.location && criteria.location !== 'null') cleaned.location = criteria.location;
    if (criteria.username && criteria.username !== 'null') cleaned.username = criteria.username;
    if (criteria.name && criteria.name !== 'null') cleaned.name = criteria.name;
    if (criteria.category && criteria.category !== 'null') cleaned.category = criteria.category;
    if (criteria.rating && typeof criteria.rating === 'number') cleaned.rating = criteria.rating;
    if (criteria.searchText && criteria.searchText !== 'null') cleaned.searchText = criteria.searchText;
    
    return cleaned;
  }

  /**
   * Search providers based on parsed criteria
   */
  async searchProviders(criteria: SearchCriteria): Promise<any> {
    const params: any = { page: 1, limit: 100 };
    
    // Build search query
    const searchTerms: string[] = [];
    
    if (criteria.username) {
      searchTerms.push(`@${criteria.username}`);
    }
    if (criteria.name) {
      searchTerms.push(criteria.name);
    }
    if (criteria.service) {
      searchTerms.push(criteria.service);
    }
    if (criteria.location) {
      searchTerms.push(criteria.location);
    }
    if (criteria.searchText) {
      searchTerms.push(criteria.searchText);
    }
    
    if (searchTerms.length > 0) {
      params.search = searchTerms.join(' ');
    }
    
    if (criteria.category) {
      params.category = criteria.category;
    }
    
    if (criteria.rating) {
      params.minRating = criteria.rating;
    }

    console.log('🔎 Searching with params:', params);
    
    try {
      const response = await firstValueFrom(
        this.http.get<any>(this.API_URL, { params })
      );
      return response.data || response;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }
}