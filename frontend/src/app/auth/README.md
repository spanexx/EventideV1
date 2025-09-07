# Auth Module

This module handles all authentication functionality for the Eventide application.

## Component Structure

```
auth/
├── components/
│   ├── login/
│   │   ├── login.component.ts
│   │   ├── login.component.html
│   │   ├── login.component.scss
│   │   └── login.component.spec.ts
│   ├── signup/
│   │   ├── signup.component.ts
│   │   ├── signup.component.html
│   │   ├── signup.component.scss
│   │   └── signup.component.spec.ts
│   ├── password-reset/
│   │   ├── forgot-password.component.ts
│   │   ├── forgot-password.component.html
│   │   ├── forgot-password.component.scss
│   │   ├── reset-password.component.ts
│   │   ├── reset-password.component.html
│   │   ├── reset-password.component.scss
│   │   └── password-reset.component.spec.ts
│   ├── google-auth/
│   │   ├── google-login.component.ts
│   │   ├── google-login.component.html
│   │   └── google-login.component.scss
│   └── auth-layout/
│       ├── auth-layout.component.ts
│       ├── auth-layout.component.html
│       └── auth-layout.component.scss
├── services/
│   └── auth.service.ts
├── guards/
│   ├── auth.guard.ts
│   └── guest.guard.ts
├── interfaces/
│   ├── auth.interface.ts
│   └── user.interface.ts
├── store/
│   ├── actions/
│   │   └── auth.actions.ts
│   ├── reducers/
│   │   └── auth.reducer.ts
│   ├── effects/
│   │   └── auth.effects.ts
│   ├── selectors/
│   │   └── auth.selectors.ts
│   └── index.ts
├── auth-routing.module.ts
└── auth.module.ts
```

## Authentication Flow

1. **Login**
   - User enters email and password
   - Form validation
   - API call to `/auth/login`
   - On success: Store JWT token and user data, redirect to dashboard
   - On error: Display error message

2. **Signup**
   - User enters email and password
   - Form validation
   - API call to `/auth/signup`
   - On success: Redirect to login page with success message
   - On error: Display error message

3. **Password Reset**
   - User enters email on forgot password page
   - API call to `/auth/forgot-password`
   - User receives email with reset link
   - User clicks link and is redirected to reset password page
   - User enters new password
   - API call to `/auth/reset-password`
   - On success: Redirect to login page with success message
   - On error: Display error message

4. **Google OAuth**
   - User clicks Google login button
   - Redirect to `/auth/google`
   - Google OAuth flow
   - Redirect back to frontend with token
   - Store JWT token and user data
   - Redirect to dashboard

5. **Token Management**
   - Store JWT token in localStorage
   - Automatically refresh token when expired
   - Clear token on logout

## State Management

The Auth module uses NgRx for state management with the following structure:

### State
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}
```

### Actions
- Login
- Login Success
- Login Failure
- Signup
- Signup Success
- Signup Failure
- Logout
- Logout Success
- Verify Token
- Verify Token Success
- Verify Token Failure
- Refresh Token
- Refresh Token Success
- Refresh Token Failure
- Google Login
- Google Login Success
- Google Login Failure
- Load User
- Load User Success
- Load User Failure

## Services

### AuthService
Handles all API calls and token management:
- `login(email: string, password: string): Observable<LoginResponse>`
- `signup(userData: CreateUserDto): Observable<SignupResponse>`
- `logout(): void`
- `refreshToken(): Observable<RefreshTokenResponse>`
- `verifyToken(): Observable<boolean>`
- `initiateGoogleLogin(): void`
- `handleGoogleCallback(token: string, userData: string): void`
- `getToken(): string | null`
- `getRefreshToken(): string | null`
- `isAuthenticated(): boolean`
- `getCurrentUser(): User | null`

## Guards

### AuthGuard
Protects routes that require authentication

### GuestGuard
Protects routes that should only be accessible to guests (not logged in users)

## Routing

```typescript
const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
      { path: 'google/callback', component: GoogleLoginComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  }
];
```