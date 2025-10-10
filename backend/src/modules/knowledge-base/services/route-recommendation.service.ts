import { Injectable } from '@nestjs/common';

export interface RouteRecommendation {
  text: string;
  route: string;
}

@Injectable()
export class RouteRecommendationService {
  // Define valid application route prefixes to validate internal routes
  private readonly validRoutePrefixes = [
    '/auth/',
    '/dashboard/',
    '/booking',
    '/providers',
    '/provider/',
    '/home',
    '/notifications',
    '/booking-lookup',
    '/booking-cancel/',
    '/availability'
  ];
  
  // Common route mappings to help standardize AI suggestions
  private readonly routeMappings: Record<string, string> = {
    'login': '/auth/login',
    'signup': '/auth/signup', 
    'register': '/auth/signup',
    'forgot-password': '/auth/forgot-password',
    'password-reset': '/auth/reset-password',
    'reset-password': '/auth/reset-password',
    'verify-email': '/auth/verify-email',
    'home': '/home',
    'dashboard': '/dashboard/overview',
    'bookings': '/dashboard/bookings',
    'availability': '/dashboard/availability',
    'providers': '/providers',
    'notifications': '/notifications',
    'booking': '/booking'
  };
  
  /**
   * Extracts route recommendations from AI response text
   * Looks for patterns like [Link Text](route) and converts them to clickable links
   */
  extractRouteRecommendations(response: string): { processedText: string; recommendations: RouteRecommendation[] } {
    console.log('[RouteRecommendationService] Processing response:', response.substring(0, 200) + '...');
    
    // Pattern to match [Link Text](route) format
    const routePattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    // Alternative pattern to match [ route ] format (spaces around route)
    const altRoutePattern = /\[\s*([^\]]*\/[^\]]*)\s*\]/g;
    const recommendations: RouteRecommendation[] = [];
    
    // We'll collect matches to process them properly
    let match;
    const matches: Array<{full: string, text: string, route: string, index: number, type: 'standard' | 'alternative' | 'route-link'}> = [];
    
    // Find all standard matches first ([Link Text](route))
    while ((match = routePattern.exec(response)) !== null) {
      matches.push({
        full: match[0],
        text: match[1],
        route: match[2],
        index: match.index,
        type: 'standard'
      });
    }
    
    // Find all alternative matches ([ route ])
    while ((match = altRoutePattern.exec(response)) !== null) {
      // For alternative format, we'll use the route as both text and route
      const route = match[1].trim();
      matches.push({
        full: match[0],
        text: route,
        route: route,
        index: match.index,
        type: 'alternative'
      });
    }
    
    // Also look for pre-existing route-link elements
    const routeLinkPattern = /<route-link\s+text="([^"]+)"\s+route="([^"]+)">([^<]+)<\/route-link>/g;
    let routeLinkMatch;
    while ((routeLinkMatch = routeLinkPattern.exec(response)) !== null) {
      const fullMatch = routeLinkMatch[0];
      const text = routeLinkMatch[1];
      const route = routeLinkMatch[2];
      
      // Add to matches for validation and processing
      matches.push({
        full: fullMatch,
        text: text,
        route: route,
        index: routeLinkMatch.index,
        type: 'route-link'
      });
    }
    
    console.log('[RouteRecommendationService] Found matches:', matches);
    
    let processedText = response;
    
    // Process each match in reverse order to avoid index shifting issues
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      let route = match.route;
      
      console.log(`[RouteRecommendationService] Processing match (${match.type}): ${match.full} -> route: ${route}`);
      
      // First, check if this looks like an external URL - if so, skip it
      if (this.isExternalUrl(route)) {
        console.log('[RouteRecommendationService] Skipping external URL:', route);
        continue; // Skip external URLs
      }
      
      // If the route doesn't start with /, it might be a relative reference that needs mapping
      if (!route.startsWith('/')) {
        console.log('[RouteRecommendationService] Route needs mapping:', route);
        // Try to map common route names to their proper paths
        const mappedRoute = this.routeMappings[route.toLowerCase()];
        if (mappedRoute) {
          route = mappedRoute;
          console.log(`[RouteRecommendationService] Mapped route: ${match.route} -> ${route}`);
        } else {
          console.log('[RouteRecommendationService] No mapping found for route:', route);
        }
      }

      // Enforce leading slash
      if (route && !route.startsWith('/')) {
        route = `/${route}`;
      }

      // Normalize known mis-prefixed dashboard routes like /auth/dashboard -> /dashboard
      if (route.startsWith('/auth/dashboard')) {
        route = route.replace(/^\/auth\/dashboard/, '/dashboard');
      }

      // Normalize top-level bookings to dashboard path
      if (route === '/bookings') {
        route = '/dashboard/bookings';
      }
      
      // Verify it's a valid internal route (starts with / and matches known application routes)
      if (route.startsWith('/') && this.isValidInternalRoute(route)) {
        console.log('[RouteRecommendationService] Valid internal route:', route);
        // Add the properly mapped route to recommendations
        recommendations.push({ text: match.text, route: route });
        
        // Replace the original match in the text with the corrected format
        if (match.type === 'standard') {
          const newPattern = `[${match.text}](${route})`;
          processedText = processedText.substring(0, match.index) + 
                         newPattern + 
                         processedText.substring(match.index + match.full.length);
        } else if (match.type === 'alternative') {
          // For alternative format, convert to standard format
          const newPattern = `[${match.text}](${route})`;
          processedText = processedText.substring(0, match.index) + 
                         newPattern + 
                         processedText.substring(match.index + match.full.length);
        } else if (match.type === 'route-link') {
          // For pre-existing route-link, we just need to validate and ensure it's in recommendations
          // We'll replace it later with the properly formatted version
          const newPattern = `[${match.text}](${route})`;
          processedText = processedText.substring(0, match.index) + 
                         newPattern + 
                         processedText.substring(match.index + match.full.length);
        }
      } else {
        console.log('[RouteRecommendationService] Invalid internal route:', route);
      }
    }
    
    console.log('[RouteRecommendationService] Final recommendations:', recommendations);
    
    // Apply the final formatting for frontend
    for (const recommendation of recommendations) {
      const pattern = new RegExp(`\\[${recommendation.text}\\]\\(${recommendation.route}\\)`, 'g');
      processedText = processedText.replace(
        pattern, 
        `<route-link text="${recommendation.text}" route="${recommendation.route}">${recommendation.text}</route-link>`
      );
    }
    
    console.log('[RouteRecommendationService] Final processed text:', processedText.substring(0, 200) + '...');
    
    return {
      processedText,
      recommendations
    };
  }
  
  private isExternalUrl(route: string): boolean {
    // Check if the route looks like an external URL
    return /^https?:\/\//.test(route) || 
           route.includes('://') || 
           route.includes('www.') || 
           route.includes('.com') || 
           route.includes('.org') || 
           route.includes('.net') || 
           route.includes('.edu') || 
           route.includes('.gov');
  }
  
  private isValidInternalRoute(route: string): boolean {
    // Check if the route starts with any of our valid prefixes
    return this.validRoutePrefixes.some(prefix => route.startsWith(prefix)) || 
           route === '/auth' || 
           route === '/dashboard' || 
           route === '/home' || 
           route === '/notifications' || 
           route === '/booking-lookup' ||
           route.startsWith('/provider/') ||
           // Specific auth routes
           route.startsWith('/auth/login') ||
           route.startsWith('/auth/signup') ||
           route.startsWith('/auth/forgot-password') ||
           route.startsWith('/auth/reset-password') ||
           route.startsWith('/auth/verify-email') ||
           route.startsWith('/auth/google');
  }
}