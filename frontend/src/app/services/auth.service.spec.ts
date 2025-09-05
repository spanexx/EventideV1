import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, LoginResponse, SignupResponse, RefreshTokenResponse, User } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Ensure that there are no outstanding HTTP requests
    httpMock.verify();
    
    // Clean up localStorage
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store token', () => {
      const mockResponse: LoginResponse = {
        access_token: 'mock-token',
        refreshToken: 'mock-refresh-token',
        userId: '123',
        expiresIn: '1h'
      };

      const email = 'test@example.com';
      const password = 'password123';

      service.login(email, password).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(localStorage.getItem('auth_token')).toBe('mock-token');
        expect(localStorage.getItem('refresh_token')).toBe('mock-refresh-token');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle login error', () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      service.login(email, password).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('signup', () => {
    it('should signup successfully', () => {
      const mockResponse: SignupResponse = {
        userId: '123',
        email: 'test@example.com'
      };

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      service.signup(userData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/signup`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle signup error', () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      };

      service.signup(userData).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/signup`);
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Email already exists' }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('logout', () => {
    it('should clear tokens and user data', () => {
      // Set some data in localStorage
      localStorage.setItem('auth_token', 'mock-token');
      localStorage.setItem('auth_user', JSON.stringify({ id: '123', email: 'test@example.com' }));
      
      service.logout();
      
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('auth_user')).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', () => {
      // Set refresh token in localStorage
      localStorage.setItem('refresh_token', 'mock-refresh-token');
      
      const mockResponse: RefreshTokenResponse = {
        access_token: 'new-mock-token',
        refreshToken: 'new-mock-refresh-token',
        userId: '123',
        expiresIn: '1h'
      };

      service.refreshToken().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(localStorage.getItem('auth_token')).toBe('new-mock-token');
        expect(localStorage.getItem('refresh_token')).toBe('new-mock-refresh-token');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should handle refresh token error', () => {
      // No refresh token in localStorage
      localStorage.removeItem('refresh_token');

      service.refreshToken().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('No refresh token available');
        }
      });
    });
  });

  describe('verifyToken', () => {
    it('should verify token successfully', () => {
      // Set token in localStorage
      localStorage.setItem('auth_token', 'mock-token');
      
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      service.verifyToken().subscribe(result => {
        expect(result).toBe(true);
        expect(service.getCurrentUser()).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/verify`);
      expect(req.request.method).toBe('GET');
      req.flush({ user: mockUser });
    });

    it('should handle verify token error', () => {
      // Set expired token in localStorage
      localStorage.setItem('auth_token', 'expired-token');

      service.verifyToken().subscribe(result => {
        expect(result).toBe(false);
        expect(service.isAuthenticated()).toBe(false);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/verify`);
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'Invalid token' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('getToken', () => {
    it('should return the stored token', () => {
      localStorage.setItem('auth_token', 'mock-token');
      expect(service.getToken()).toBe('mock-token');
    });

    it('should return null if no token is stored', () => {
      localStorage.removeItem('auth_token');
      expect(service.getToken()).toBeNull();
    });
  });

  describe('getRefreshToken', () => {
    it('should return the stored refresh token', () => {
      localStorage.setItem('refresh_token', 'mock-refresh-token');
      expect(service.getRefreshToken()).toBe('mock-refresh-token');
    });

    it('should return null if no refresh token is stored', () => {
      localStorage.removeItem('refresh_token');
      expect(service.getRefreshToken()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if user has valid token', () => {
      // Create a valid JWT token (not expired)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const payload = { exp: Math.floor(futureDate.getTime() / 1000) };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      localStorage.setItem('auth_token', token);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should return false if user has no token', () => {
      localStorage.removeItem('auth_token');
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should return false if user has expired token', () => {
      // Create an expired JWT token
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const payload = { exp: Math.floor(pastDate.getTime() / 1000) };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      localStorage.setItem('auth_token', token);
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user from storage', () => {
      const mockUser: User = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      };

      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should return null if no user is stored', () => {
      localStorage.removeItem('auth_user');
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('handleGoogleCallback', () => {
    it('should handle Google callback successfully', () => {
      const token = 'google-token';
      const userData = btoa(JSON.stringify({
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      }));

      service.handleGoogleCallback(token, userData);

      expect(localStorage.getItem('auth_token')).toBe('google-token');
      expect(service.getCurrentUser()).toEqual({
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      });
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should handle invalid Google callback data', () => {
      const token = 'google-token';
      const userData = 'invalid-data';

      service.handleGoogleCallback(token, userData);

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('initiateGoogleLogin', () => {
    it('should redirect to Google OAuth endpoint', () => {
      const openSpy = spyOn(window.location, 'href', 'set');
      
      service.initiateGoogleLogin();
      
      expect(openSpy).toHaveBeenCalledWith(
        `${environment.apiUrl}/auth/google?redirect=${encodeURIComponent(environment.frontendUrl + '/auth/google/callback')}`
      );
    });
  });
});