import { createReducer, on } from '@ngrx/store';
import { initialSearchFiltersState } from './search-filters.state';
import * as SearchFiltersActions from './search-filters.actions';

export const searchFiltersReducer = createReducer(
  initialSearchFiltersState,
  on(SearchFiltersActions.setSearchQuery, (state, { query }) => ({
    ...state,
    searchQuery: query
  })),
  on(SearchFiltersActions.setSelectedCategory, (state, { category }) => ({
    ...state,
    selectedCategory: category
  })),
  on(SearchFiltersActions.setSelectedRating, (state, { rating }) => ({
    ...state,
    selectedRating: rating
  })),
  on(SearchFiltersActions.setSelectedCountry, (state, { country }) => ({
    ...state,
    selectedCountry: country,
    selectedCity: '' // Reset city when country changes
  })),
  on(SearchFiltersActions.setSelectedCity, (state, { city }) => ({
    ...state,
    selectedCity: city
  })),
  on(SearchFiltersActions.setAvailableCountries, (state, { countries }) => ({
    ...state,
    availableCountries: countries
  })),
  on(SearchFiltersActions.setAvailableCities, (state, { cities }) => ({
    ...state,
    availableCities: cities
  })),
  on(SearchFiltersActions.setAvailableCategories, (state, { categories }) => ({
    ...state,
    availableCategories: categories
  })),
  on(SearchFiltersActions.clearFilters, (state) => ({
    ...initialSearchFiltersState,
    availableCountries: state.availableCountries,
    availableCities: state.availableCities,
    availableCategories: state.availableCategories
  }))
);
