import { createAction, props } from '@ngrx/store';
import { User } from '../../../../services/auth.service';

// Login Actions
export const login = createAction(
  '[Auth] Login',
  props<{ email: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth] Login Success',
  props<{ user: User; token: string; refreshToken?: string }>()
);

export const loginFailure = createAction(
  '[Auth] Login Failure',
  props<{ error: string }>()
);

// Signup Actions
export const signup = createAction(
  '[Auth] Signup',
  props<{ email: string; password: string; firstName?: string; lastName?: string }>()
);

export const signupSuccess = createAction(
  '[Auth] Signup Success',
  props<{ user: User; email: string }>()
);

export const signupFailure = createAction(
  '[Auth] Signup Failure',
  props<{ error: string }>()
);

// Logout Actions
export const logout = createAction('[Auth] Logout');

export const logoutSuccess = createAction('[Auth] Logout Success');

// Token Verification Actions
export const verifyToken = createAction('[Auth] Verify Token');

export const verifyTokenSuccess = createAction(
  '[Auth] Verify Token Success',
  props<{ user: User }>()
);

export const verifyTokenFailure = createAction(
  '[Auth] Verify Token Failure',
  props<{ error: string }>()
);

// Token Refresh Actions
export const refreshToken = createAction('[Auth] Refresh Token');

export const refreshTokenSuccess = createAction(
  '[Auth] Refresh Token Success',
  props<{ token: string; refreshToken?: string }>()
);

export const refreshTokenFailure = createAction(
  '[Auth] Refresh Token Failure',
  props<{ error: string }>()
);

// Google OAuth Actions
export const googleLogin = createAction('[Auth] Google Login');

export const googleLoginSuccess = createAction(
  '[Auth] Google Login Success',
  props<{ user: User; token: string }>()
);

export const googleLoginFailure = createAction(
  '[Auth] Google Login Failure',
  props<{ error: string }>()
);

// Load User Actions
export const loadUser = createAction('[Auth] Load User');

export const loadUserSuccess = createAction(
  '[Auth] Load User Success',
  props<{ user: User }>()
);

export const loadUserFailure = createAction(
  '[Auth] Load User Failure',
  props<{ error: string }>()
);

// Refresh User from API Actions
export const refreshUser = createAction('[Auth] Refresh User');

export const refreshUserSuccess = createAction(
  '[Auth] Refresh User Success',
  props<{ user: User }>()
);

export const refreshUserFailure = createAction(
  '[Auth] Refresh User Failure',
  props<{ error: string }>()
);

// Update User Actions
export const updateUser = createAction(
  '[Auth] Update User',
  props<{ updates: Partial<User> }>()
);

export const updateUserSuccess = createAction(
  '[Auth] Update User Success',
  props<{ user: User }>()
);

export const updateUserFailure = createAction(
  '[Auth] Update User Failure',
  props<{ error: string }>()
);

// Password Reset Actions
export const forgotPassword = createAction(
  '[Auth] Forgot Password',
  props<{ email: string }>()
);

export const forgotPasswordSuccess = createAction(
  '[Auth] Forgot Password Success',
  props<{ message: string }>()
);

export const forgotPasswordFailure = createAction(
  '[Auth] Forgot Password Failure',
  props<{ error: string }>()
);

export const resetPassword = createAction(
  '[Auth] Reset Password',
  props<{ token: string; newPassword: string }>()
);

export const resetPasswordSuccess = createAction(
  '[Auth] Reset Password Success',
  props<{ message: string }>()
);

export const resetPasswordFailure = createAction(
  '[Auth] Reset Password Failure',
  props<{ error: string }>()
);

// Email Verification Actions
export const verifyEmail = createAction(
  '[Auth] Verify Email',
  props<{ token: string }>()
);

export const verifyEmailSuccess = createAction(
  '[Auth] Verify Email Success',
  props<{ message: string }>()
);

export const verifyEmailFailure = createAction(
  '[Auth] Verify Email Failure',
  props<{ error: string }>()
);