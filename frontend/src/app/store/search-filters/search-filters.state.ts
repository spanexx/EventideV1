/**
 * Search Filters State
 * Manages all filter states for provider search
 */

export interface SearchFiltersState {
  searchQuery: string;
  selectedCategory: string;
  selectedRating: number;
  selectedCountry: string;
  selectedCity: string;
  availableCountries: string[];
  availableCities: string[];
  availableCategories: string[];
}

export const initialSearchFiltersState: SearchFiltersState = {
  searchQuery: '',
  selectedCategory: '',
  selectedRating: 0,
  selectedCountry: '',
  selectedCity: '',
  availableCountries: [],
  availableCities: [],
  availableCategories: []
};
