import { ApplicationConfig, APP_INITIALIZER, inject, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';

import { responseInterceptor } from './core/interceptors/response.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { DashboardEffects } from './dashboard/store/effects/dashboard.effects';
import { dashboardReducer } from './dashboard/store/reducers/dashboard.reducer';
import { AuthService } from './services/auth.service';
import { Store } from '@ngrx/store';
import * as AuthActions from './auth/store/auth';
import { AuthEffects, authReducer } from './auth/store/auth';
import { AnalyticsEffects } from './analytics/store/effects/analytics.effects';
import { analyticsReducer } from './analytics/store/reducers/analytics.reducer';

// Function to initialize the app with existing auth state
function initializeAppFactory() {
  return () => {
    console.log('APP_INITIALIZER: Starting app initialization');
    const authService = inject(AuthService);
    const store = inject(Store);
    
    // Check if there's a valid token in localStorage
    console.log('APP_INITIALIZER: Checking if user is authenticated');
    if (authService.isAuthenticated()) {
      console.log('APP_INITIALIZER: User is authenticated, dispatching verifyToken');
      // Dispatch an action to verify the token and load user data
      store.dispatch(AuthActions.verifyToken());
    } else {
      console.log('APP_INITIALIZER: No valid token found');
    }
    
    console.log('APP_INITIALIZER: App initialization complete');
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([responseInterceptor, authInterceptor])),
    provideAnimations(),
    provideNativeDateAdapter(),
    provideStore({ 
      auth: authReducer,
      dashboard: dashboardReducer,
      analytics: analyticsReducer
    }),
    provideEffects([AuthEffects, DashboardEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: false }),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAppFactory,
      multi: true
    }
  ]
};
