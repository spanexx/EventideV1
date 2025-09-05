export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface LoginResponse {
  access_token: string;
  refreshToken?: string;
  userId: string;
  expiresIn: string;
}

export interface SignupResponse {
  userId: string;
  email: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refreshToken?: string;
  userId: string;
  expiresIn: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerifyTokenResponse {
  message: string;
  user: {
    id: string;
    email: string;
  };
}