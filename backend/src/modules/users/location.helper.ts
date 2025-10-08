/**
 * Location Helper Service
 * Parses location strings and extracts structured location data
 */

interface LocationDetails {
  country?: string;
  countryCode?: string;
  city?: string;
  cityCode?: string;
  address?: string;
}

// US State codes mapping
const US_STATE_CODES: { [key: string]: string } = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY'
};

// Country codes mapping (common countries)
const COUNTRY_CODES: { [key: string]: string } = {
  'united states': 'USA', 'usa': 'USA', 'us': 'USA', 'america': 'USA',
  'united kingdom': 'GBR', 'uk': 'GBR', 'britain': 'GBR', 'england': 'GBR',
  'canada': 'CAN', 'germany': 'DEU', 'france': 'FRA', 'italy': 'ITA',
  'spain': 'ESP', 'poland': 'POL', 'netherlands': 'NLD', 'belgium': 'BEL',
  'switzerland': 'CHE', 'austria': 'AUT', 'sweden': 'SWE', 'norway': 'NOR',
  'denmark': 'DNK', 'finland': 'FIN', 'ireland': 'IRL', 'portugal': 'PRT',
  'greece': 'GRC', 'czech republic': 'CZE', 'hungary': 'HUN', 'romania': 'ROU',
  'australia': 'AUS', 'new zealand': 'NZL', 'japan': 'JPN', 'china': 'CHN',
  'india': 'IND', 'brazil': 'BRA', 'mexico': 'MEX', 'argentina': 'ARG',
  'south africa': 'ZAF', 'egypt': 'EGY', 'nigeria': 'NGA', 'kenya': 'KEN'
};

/**
 * Parse a location string and extract structured data
 * Supports formats like:
 * - "Austin, TX, USA"
 * - "New York, NY"
 * - "San Francisco, California, USA"
 * - "London, UK"
 * - "Warsaw, Poland"
 */
export function parseLocation(locationString: string): LocationDetails {
  if (!locationString) return {};

  const parts = locationString.split(',').map(p => p.trim());
  const result: LocationDetails = {};

  if (parts.length === 0) return result;

  // Last part is usually country
  if (parts.length >= 2) {
    const lastPart = parts[parts.length - 1].toLowerCase();
    const countryCode = COUNTRY_CODES[lastPart];
    
    if (countryCode) {
      result.country = parts[parts.length - 1];
      result.countryCode = countryCode;
      parts.pop(); // Remove country from parts
    }
  }

  // Check for US state code (2 letters)
  if (parts.length >= 2) {
    const statePart = parts[parts.length - 1].trim();
    
    // Check if it's a 2-letter state code
    if (statePart.length === 2) {
      result.cityCode = statePart.toUpperCase();
      if (!result.country) {
        result.country = 'USA';
        result.countryCode = 'USA';
      }
      parts.pop();
    } else {
      // Check if it's a full state name
      const stateCode = US_STATE_CODES[statePart.toLowerCase()];
      if (stateCode) {
        result.cityCode = stateCode;
        if (!result.country) {
          result.country = 'USA';
          result.countryCode = 'USA';
        }
        parts.pop();
      }
    }
  }

  // First remaining part is usually city
  if (parts.length >= 1) {
    result.city = parts[0];
  }

  // Any remaining parts can be address
  if (parts.length > 1) {
    result.address = parts.slice(1).join(', ');
  }

  return result;
}

/**
 * Format location details back to a string
 */
export function formatLocation(details: LocationDetails): string {
  const parts: string[] = [];
  
  if (details.city) parts.push(details.city);
  if (details.cityCode) parts.push(details.cityCode);
  if (details.country) parts.push(details.country);
  
  return parts.join(', ');
}

/**
 * Check if a location matches a search query
 */
export function matchesLocation(
  locationDetails: LocationDetails | undefined,
  legacyLocation: string | undefined,
  searchQuery: string
): boolean {
  const query = searchQuery.toLowerCase();
  
  // Check legacy location field
  if (legacyLocation && legacyLocation.toLowerCase().includes(query)) {
    return true;
  }
  
  // Check structured location
  if (locationDetails) {
    return (
      locationDetails.city?.toLowerCase().includes(query) ||
      locationDetails.cityCode?.toLowerCase().includes(query) ||
      locationDetails.country?.toLowerCase().includes(query) ||
      locationDetails.countryCode?.toLowerCase().includes(query) ||
      locationDetails.address?.toLowerCase().includes(query) ||
      false
    );
  }
  
  return false;
}
