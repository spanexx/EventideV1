import {
  ApplicationConfig,
  provideAppInitializer,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { Router, NavigationEnd, provideRouter } from '@angular/router';
import { LogService } from './services/log.service';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';


import { routes } from './app.routes';
import { RoutePersistenceService } from './core/services/route-persistence.service';

import { responseInterceptor } from './core/interceptors/response.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { DashboardEffects } from './dashboard/store-dashboard/effects/dashboard.effects';
import { dashboardReducer } from './dashboard/store-dashboard/reducers/dashboard.reducer';
import { AuthService } from './services/auth.service';
import { Store } from '@ngrx/store';
import * as AuthActions from './auth/store/auth';
import { AUTH_EFFECTS, authReducer } from './auth/store/auth';
import { availabilityReducer } from './dashboard/store-availability';
import { AvailabilityEffects } from './dashboard/store-availability';
import { calendarReducer } from './dashboard/store-calendar';
import { CalendarEffects } from './dashboard/store-calendar';
import { bookingReducer } from './booking-wizard/store-bookings/reducers/booking.reducer';
import { BookingEffects } from './booking-wizard/store-bookings/effects/booking.effects';
import { searchFiltersReducer } from './store/search-filters/search-filters.reducer';
import { providersReducer } from './store/providers/providers.reducer';
import { ProvidersEffects } from './store/providers/providers.effects';
import { appearanceReducer } from './store/appearance/appearance.reducer';
import { AppearanceEffects } from './store/appearance/appearance.effects';
import { analyticsReducer } from './dashboard/pages/analytics/store/reducers/analytics.reducer';

// App initializer using DI (Angular 19+)
function appInit() {
  return () => {
    const logService = inject(LogService);
    const authService = inject(AuthService);
    const store = inject(Store);
    const routePersistence = inject(RoutePersistenceService);
    const router = inject(Router);

    return logService.init().then(() => {
      console.log('APP INIT: LogService initialized');
      console.log('APP INIT: Checking if user is authenticated');
      if (authService.isAuthenticated()) {
        console.log('APP INIT: User is authenticated, dispatching verifyToken');
        store.dispatch(AuthActions.verifyToken());
        routePersistence.startTracking();

        return new Promise<void>((resolve) => {
          const subscription = router.events.subscribe((event: any) => {
            if (event instanceof NavigationEnd) {
              console.log('APP INIT: Router ready, capturing current URL');
              routePersistence.captureCurrentUrl();
              subscription.unsubscribe();
              resolve();
            }
          });
          setTimeout(() => {
            console.log('APP INIT: Router timeout, capturing current URL anyway');
            routePersistence.captureCurrentUrl();
            subscription.unsubscribe();
            resolve();
          }, 1000);
        });
      } else {
        console.log('APP INIT: No valid token found');
        return Promise.resolve();
      }
    });
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
      analytics: analyticsReducer,
      availability: availabilityReducer,
      calendar: calendarReducer,
      booking: bookingReducer,
      searchFilters: searchFiltersReducer,
      providers: providersReducer,
      appearance: appearanceReducer,
    }),
    provideEffects([
      ...AUTH_EFFECTS,
      DashboardEffects,
      AvailabilityEffects,
      CalendarEffects,
      BookingEffects,
      ProvidersEffects,
      AppearanceEffects,
    ]),
    provideStoreDevtools({ maxAge: 25, logOnly: false }),
    LogService,
    provideAppInitializer(appInit()),
  ],
};
