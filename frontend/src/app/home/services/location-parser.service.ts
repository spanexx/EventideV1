import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocationParserService {
  parseLocationInfo(location: string): { city: string | null; country: string | null } {
    if (!location) {
      return { city: null, country: null };
    }
    
    const parts = location.split(',').map(part => part.trim());
    
    if (parts.length === 0) {
      return { city: null, country: null };
    }
    
    let city: string | null = null;
    let country: string | null = null;
    
    if (parts.length >= 1) {
      city = parts[0];
    }
    
    if (parts.length >= 3) {
      country = parts[2];
    } else if (parts.length >= 2) {
      const potentialCountry = parts[parts.length - 1].toLowerCase();
      const commonCountries = ['usa', 'us', 'united states', 'uk', 'united kingdom', 'canada', 'australia'];
      if (commonCountries.includes(potentialCountry)) {
        country = parts[parts.length - 1];
      } else {
        city = parts[0] + ' ' + parts[1];
      }
    }
    
    return { city, country };
  }
}