import { Injectable, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LocalStorageService } from './local-storage.service';

@Injectable({
  providedIn: 'root',
})
export class RoutePersistenceService {
  private readonly LAST_ROUTE_KEY = 'last_visited_route';
  private readonly EXCLUDED_ROUTES = ['/auth', '/home', ''];
  
  private router = inject(Router);
  private storage = inject(LocalStorageService);

  /**
   * Start tracking navigation to persist last visited route
   */
  startTracking(): void {
    console.debug('[RoutePersistence] startTracking');
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects || event.url;
        
        // Skip auth routes, home, and root
        if (this.shouldPersist(url)) {
          console.debug('[RoutePersistence] saving route', url);
          this.storage.setItem(this.LAST_ROUTE_KEY, url);
        }
      });
  }

  /**
   * Persist the current URL immediately (useful on app startup when initial navigation already happened)
   */
  captureCurrentUrl(): void {
    const url = this.router.url;
    console.debug('[RoutePersistence] captureCurrentUrl', url);
    if (url && this.shouldPersist(url)) {
      this.storage.setItem(this.LAST_ROUTE_KEY, url);
    }
  }

  /**
   * Get the last visited route if available
   */
  getLastRoute(): string | null {
    const route = this.storage.getItem<string>(this.LAST_ROUTE_KEY);
    console.debug('[RoutePersistence] getLastRoute', route);
    return route;
  }

  /**
   * Navigate to the last visited route or fallback
   */
  restoreLastRoute(fallback: string = '/dashboard/overview'): void {
    const lastRoute = this.getLastRoute();
    const current = this.router.url;
    
    if (lastRoute && this.shouldPersist(lastRoute) && lastRoute !== current) {
      console.info('[RoutePersistence] restoring route', lastRoute);
      this.router.navigateByUrl(lastRoute);
    } else {
      console.info('[RoutePersistence] no valid route, using fallback', fallback);
      if (current !== fallback) {
        this.router.navigateByUrl(fallback);
      }
    }
  }

  /**
   * Clear persisted route (e.g., on logout)
   */
  clearLastRoute(): void {
    console.debug('[RoutePersistence] clearLastRoute');
    this.storage.removeItem(this.LAST_ROUTE_KEY);
  }

  /**
   * Check if route should be persisted
   */
  private shouldPersist(url: string): boolean {
    return !this.EXCLUDED_ROUTES.some((excluded) => 
      url === excluded || url.startsWith(excluded + '/')
    );
  }
}
