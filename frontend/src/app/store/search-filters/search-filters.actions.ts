import { createAction, props } from '@ngrx/store';

export const setSearchQuery = createAction(
  '[Search Filters] Set Search Query',
  props<{ query: string }>()
);

export const setSelectedCategory = createAction(
  '[Search Filters] Set Selected Category',
  props<{ category: string }>()
);

export const setSelectedRating = createAction(
  '[Search Filters] Set Selected Rating',
  props<{ rating: number }>()
);

export const setSelectedCountry = createAction(
  '[Search Filters] Set Selected Country',
  props<{ country: string }>()
);

export const setSelectedCity = createAction(
  '[Search Filters] Set Selected City',
  props<{ city: string }>()
);

export const setAvailableCountries = createAction(
  '[Search Filters] Set Available Countries',
  props<{ countries: string[] }>()
);

export const setAvailableCities = createAction(
  '[Search Filters] Set Available Cities',
  props<{ cities: string[] }>()
);

export const setAvailableCategories = createAction(
  '[Search Filters] Set Available Categories',
  props<{ categories: string[] }>()
);

export const clearFilters = createAction('[Search Filters] Clear All Filters');
