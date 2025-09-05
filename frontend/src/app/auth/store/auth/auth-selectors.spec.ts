import { createSelector } from '@ngrx/store';
import * as fromAuth from './selectors/auth.selectors';
import { AuthState } from './reducers/auth.reducer';

describe('Auth Selectors', () => {
  const initialState: AuthState = {
    user: {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    },
    token: 'token123',
    refreshToken: 'refresh123',
    isAuthenticated: true,
    loading: false,
    error: null
  };

  const emptyState: AuthState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    loading: false,
    error: null
  };

  it('should select the auth state', () => {
    const result = fromAuth.selectAuthState.projector({
      auth: initialState
    });
    
    expect(result).toEqual(initialState);
  });

  it('should select the user', () => {
    const result = fromAuth.selectUser.projector(initialState);
    
    expect(result).toEqual(initialState.user);
  });

  it('should select the token', () => {
    const result = fromAuth.selectToken.projector(initialState);
    
    expect(result).toBe('token123');
  });

  it('should select the refresh token', () => {
    const result = fromAuth.selectRefreshToken.projector(initialState);
    
    expect(result).toBe('refresh123');
  });

  it('should select isAuthenticated', () => {
    const result = fromAuth.selectIsAuthenticated.projector(initialState);
    
    expect(result).toBe(true);
  });

  it('should select loading state', () => {
    const result = fromAuth.selectAuthLoading.projector(initialState);
    
    expect(result).toBe(false);
  });

  it('should select error state', () => {
    const stateWithError: AuthState = {
      ...initialState,
      error: 'Something went wrong'
    };
    
    const result = fromAuth.selectAuthError.projector(stateWithError);
    
    expect(result).toBe('Something went wrong');
  });

  it('should select user full name', () => {
    const result = fromAuth.selectUserFullName.projector(initialState.user);
    
    expect(result).toBe('Test User');
  });

  it('should select user initials', () => {
    const result = fromAuth.selectUserInitials.projector(initialState.user);
    
    expect(result).toBe('TU');
  });

  it('should select user email', () => {
    const result = fromAuth.selectUserEmail.projector(initialState.user);
    
    expect(result).toBe('test@example.com');
  });

  it('should select user id', () => {
    const result = fromAuth.selectUserId.projector(initialState.user);
    
    expect(result).toBe('1');
  });

  it('should handle empty user state', () => {
    const fullNameResult = fromAuth.selectUserFullName.projector(emptyState.user);
    const initialsResult = fromAuth.selectUserInitials.projector(emptyState.user);
    const emailResult = fromAuth.selectUserEmail.projector(emptyState.user);
    const idResult = fromAuth.selectUserId.projector(emptyState.user);
    
    expect(fullNameResult).toBe('');
    expect(initialsResult).toBe('');
    expect(emailResult).toBe('');
    expect(idResult).toBe('');
  });
});