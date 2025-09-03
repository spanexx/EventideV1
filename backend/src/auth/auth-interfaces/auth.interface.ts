// Define GoogleProfile locally to match UsersService's expected shape
export  interface GoogleProfile {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}

export interface LoginResponse {
  access_token: string;
  userId: string;
  expiresIn: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  userId: string;
  expiresIn: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
}

export interface SignupResponse {
  userId: string;
  email: string;
}
