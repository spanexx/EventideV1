import { createSelector, createFeatureSelector } from '@ngrx/store';
import { AuthState } from '../reducers/auth.reducer';

// Feature selector
export const selectAuthState = createFeatureSelector<AuthState>('auth');

// Auth state selectors
export const selectUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.user
);

export const selectToken = createSelector(
  selectAuthState,
  (state: AuthState) => state.token
);

export const selectRefreshToken = createSelector(
  selectAuthState,
  (state: AuthState) => state.refreshToken
);

export const selectIsAuthenticated = createSelector(
  selectAuthState,
  (state: AuthState) => state.isAuthenticated
);

export const selectAuthLoading = createSelector(
  selectAuthState,
  (state: AuthState) => state.loading
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state: AuthState) => state.error
);

export const selectForgotPasswordMessage = createSelector(
  selectAuthState,
  (state: AuthState) => state.forgotPasswordMessage
);

export const selectResetPasswordMessage = createSelector(
  selectAuthState,
  (state: AuthState) => state.resetPasswordMessage
);

// Derived selectors
export const selectUserFullName = createSelector(
  selectUser,
  (user) => {
    if (!user) return '';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim();
  }
);

export const selectUserInitials = createSelector(
  selectUser,
  (user) => {
    if (!user) return '';
    const firstNameInitial = user.firstName ? user.firstName.charAt(0).toUpperCase() : '';
    const lastNameInitial = user.lastName ? user.lastName.charAt(0).toUpperCase() : '';
    return `${firstNameInitial}${lastNameInitial}`;
  }
);

export const selectUserEmail = createSelector(
  selectUser,
  (user) => user?.email || ''
);

export const selectUserId = createSelector(
  selectUser,
  (user) => user?.id || ''
);

export const selectProviderId = createSelector(
  selectUser,
  (user) => user?.id || '' // User ID serves as provider ID
);