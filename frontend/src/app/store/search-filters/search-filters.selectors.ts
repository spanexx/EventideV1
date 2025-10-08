import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SearchFiltersState } from './search-filters.state';

export const selectSearchFiltersState = createFeatureSelector<SearchFiltersState>('searchFilters');

export const selectSearchQuery = createSelector(
  selectSearchFiltersState,
  (state) => state.searchQuery
);

export const selectSelectedCategory = createSelector(
  selectSearchFiltersState,
  (state) => state.selectedCategory
);

export const selectSelectedRating = createSelector(
  selectSearchFiltersState,
  (state) => state.selectedRating
);

export const selectSelectedCountry = createSelector(
  selectSearchFiltersState,
  (state) => state.selectedCountry
);

export const selectSelectedCity = createSelector(
  selectSearchFiltersState,
  (state) => state.selectedCity
);

export const selectAvailableCountries = createSelector(
  selectSearchFiltersState,
  (state) => state.availableCountries
);

export const selectAvailableCities = createSelector(
  selectSearchFiltersState,
  (state) => state.availableCities
);

export const selectAvailableCategories = createSelector(
  selectSearchFiltersState,
  (state) => state.availableCategories
);
