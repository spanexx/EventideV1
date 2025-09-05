import { createReducer, on } from '@ngrx/store';
import * as AuthActions from '../actions/auth.actions';
import { User } from '../../../../services/auth.service';

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  resetPasswordMessage: string | null;
  forgotPasswordMessage: string | null;
}

export const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  resetPasswordMessage: null,
  forgotPasswordMessage: null
};

export const authReducer = createReducer(
  initialState,
  
  // Login
  on(AuthActions.login, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.loginSuccess, (state, { user, token, refreshToken }) => ({
    ...state,
    user,
    token,
    refreshToken: refreshToken || null,
    isAuthenticated: true,
    loading: false,
    error: null
  })),
  
  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Signup
  on(AuthActions.signup, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.signupSuccess, (state, { user, email }) => ({
    ...state,
    user: { ...user, email },
    loading: false,
    error: null
  })),
  
  on(AuthActions.signupFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Logout
  on(AuthActions.logout, () => ({
    ...initialState
  })),
  
  on(AuthActions.logoutSuccess, () => ({
    ...initialState
  })),
  
  // Token Verification
  on(AuthActions.verifyToken, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.verifyTokenSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    loading: false
  })),
  
  on(AuthActions.verifyTokenFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null
  })),
  
  // Token Refresh
  on(AuthActions.refreshToken, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.refreshTokenSuccess, (state, { token, refreshToken }) => ({
    ...state,
    token,
    refreshToken: refreshToken || null,
    loading: false,
    isAuthenticated: true
  })),
  
  on(AuthActions.refreshTokenFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null
  })),
  
  // Google Login
  on(AuthActions.googleLogin, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.googleLoginSuccess, (state, { user, token }) => ({
    ...state,
    user,
    token,
    isAuthenticated: true,
    loading: false,
    error: null
  })),
  
  on(AuthActions.googleLoginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Load User
  on(AuthActions.loadUser, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(AuthActions.loadUserSuccess, (state, { user }) => ({
    ...state,
    user,
    isAuthenticated: true,
    loading: false
  })),
  
  on(AuthActions.loadUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Forgot Password
  on(AuthActions.forgotPassword, (state) => ({
    ...state,
    loading: true,
    error: null,
    forgotPasswordMessage: null
  })),
  
  on(AuthActions.forgotPasswordSuccess, (state, { message }) => ({
    ...state,
    loading: false,
    forgotPasswordMessage: message,
    error: null
  })),
  
  on(AuthActions.forgotPasswordFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // Reset Password
  on(AuthActions.resetPassword, (state) => ({
    ...state,
    loading: true,
    error: null,
    resetPasswordMessage: null
  })),
  
  on(AuthActions.resetPasswordSuccess, (state, { message }) => ({
    ...state,
    loading: false,
    resetPasswordMessage: message,
    error: null
  })),
  
  on(AuthActions.resetPasswordFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);

export default authReducer;