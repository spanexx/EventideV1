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

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  picture?: string;
  businessName?: string;
  bio?: string;
  contactPhone?: string;
  services?: string[];
  categories?: string[];
  customCategories?: string[];
  availableDurations?: number[];
  locationDetails?: {
    country?: string;
    city?: string;
    address?: string;
  };
}
