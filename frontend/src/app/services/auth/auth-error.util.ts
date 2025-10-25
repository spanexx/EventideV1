import { Observable, throwError } from 'rxjs';

export function handleAuthError(error: any): Observable<never> {
  console.error('AuthService: An error occurred:', error);

  // Handle specific error cases
  if (error.status === 401) {
    return throwError(
      () => new Error('Invalid credentials. Please check your email and password.'),
    );
  }

  if (error.status === 409) {
    return throwError(() => new Error('An account with this email already exists.'));
  }

  if (error.status === 429) {
    return throwError(() => new Error('Too many requests. Please try again later.'));
  }

  // Generic error message
  return throwError(() => new Error('Something went wrong. Please try again later.'));
}
