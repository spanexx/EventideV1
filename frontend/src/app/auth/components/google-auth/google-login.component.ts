import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import * as AuthActions from '../../store/auth/actions/auth.actions';
import * as AuthSelectors from '../../store/auth/selectors/auth.selectors';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-google-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './google-login.component.html',
  styleUrls: ['./google-login.component.scss']
})
export class GoogleLoginComponent implements OnInit {
  private store = inject(Store);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor() {
    this.loading$ = this.store.select(AuthSelectors.selectAuthLoading);
    this.error$ = this.store.select(AuthSelectors.selectAuthError);
  }

  ngOnInit(): void {
    // Check for token and user data in query params
    const token = this.route.snapshot.queryParams['access_token'];
    const userData = this.route.snapshot.queryParams['user'];

    if (token && userData) {
      try {
        // Handle successful Google login
        this.authService.handleGoogleCallback(token, userData);
        
        // Get the current user from the auth service
        const user = this.authService.getCurrentUser();
        
        if (user) {
          // Dispatch Google login success action to update the store
          this.store.dispatch(AuthActions.googleLoginSuccess({
            user,
            token
          }));
        } else {
          // If we couldn't get the user, dispatch a failure
          this.store.dispatch(AuthActions.googleLoginFailure({ 
            error: 'Failed to retrieve user information' 
          }));
          this.router.navigate(['/auth/login']);
          return;
        }
        
        // Navigate to dashboard
        this.router.navigate(['/dashboard']);
      } catch (error) {
        // Handle any errors during the callback process
        const errorMessage = error instanceof Error ? error.message : 'Google login failed';
        this.store.dispatch(AuthActions.googleLoginFailure({ error: errorMessage }));
        this.router.navigate(['/auth/login']);
      }
    } else if (this.route.snapshot.queryParams['error']) {
      // Handle Google login error
      const error = this.route.snapshot.queryParams['error'];
      this.store.dispatch(AuthActions.googleLoginFailure({ error }));
      // Navigate back to login page with error
      this.router.navigate(['/auth/login']);
    } else {
      // If no token and no error, redirect to login
      this.router.navigate(['/auth/login']);
    }
  }
}