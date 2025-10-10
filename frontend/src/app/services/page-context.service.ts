import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PageContextService {
  private currentPageSubject = new BehaviorSubject<string>('');
  public currentPage$ = this.currentPageSubject.asObservable();

  constructor(private router: Router) {
    // Listen to route changes to determine current page
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const currentPage = this.extractPageFromUrl(event.urlAfterRedirects);
        this.currentPageSubject.next(currentPage);
      });

    // Set initial page context
    const initialPage = this.extractPageFromUrl(this.router.url);
    this.currentPageSubject.next(initialPage);
  }

  private extractPageFromUrl(url: string): string {
    // Normalize URL by removing leading slashes
    let normalizedUrl = url.replace(/^\/+/, '');
    
    // Extract the first path segment to identify the main page
    const segments = normalizedUrl.split('/');
    if (segments.length > 0) {
      let primaryPage = segments[0].toLowerCase();
      
      // Handle special cases
      if (primaryPage === 'auth') {
        // Extract the specific auth page from the second segment
        if (segments.length > 1) {
          const authPage = segments[1].toLowerCase();
          const validAuthPages = ['login', 'signup', 'forgot-password', 'reset-password', 'verify-email', 'google'];
          if (validAuthPages.includes(authPage)) {
            return `auth-${authPage}`;
          }
        }
        return 'auth';
      } 
      else if (primaryPage === 'dashboard') {
        // Extract the specific dashboard page from the second segment
        if (segments.length > 1) {
          const dashboardPage = segments[1].toLowerCase();
          const validDashboardPages = ['overview', 'availability', 'bookings', 'analytics', 'reports', 'settings'];
          if (validDashboardPages.includes(dashboardPage)) {
            return `dashboard-${dashboardPage}`;
          }
        }
        return 'dashboard-overview'; // Default to overview
      }
      else if (primaryPage === 'booking') {
        // Handle different booking pages (wizard steps)
        if (segments.length > 2) {
          const bookingStep = segments[2].toLowerCase();
          const validBookingSteps = ['duration', 'availability', 'information', 'confirmation'];
          if (validBookingSteps.includes(bookingStep)) {
            return `booking-${bookingStep}`;
          }
        } else if (segments.length > 1) {
          // When booking/:providerId is accessed, default to duration
          return 'booking-duration';
        }
        return 'booking';
      }
      else if (primaryPage === 'booking-lookup' || primaryPage === 'booking-cancel') {
        return primaryPage;
      }
      else if (primaryPage === 'providers' || primaryPage === 'provider') {
        return primaryPage;
      }
      else if (primaryPage === 'home' || primaryPage === 'notifications') {
        return primaryPage;
      }
      else if (primaryPage === '') {
        return 'home';
      }
      else {
        return primaryPage;
      }
    }
    
    return 'unknown';
  }

  getCurrentPage(): string {
    return this.currentPageSubject.value;
  }

  isOnPage(pageName: string): boolean {
    return this.currentPageSubject.value === pageName;
  }
}