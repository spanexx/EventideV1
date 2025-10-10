import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PageContextService {
  private currentPage = new BehaviorSubject<string>('');
  public currentPage$ = this.currentPage.asObservable();

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.determineCurrentPage(event.url);
      }
    });
  }

  private determineCurrentPage(url: string): void {
    // Map URL patterns to page names
    const pageMap: { [key: string]: string } = {
      '/auth/login': 'Login',
      '/auth/signup': 'Signup',
      '/auth/forgot-password': 'Forgot Password',
      '/auth/reset-password': 'Reset Password',
      '/auth/verify-email': 'Verify Email',
      '/auth/google/callback': 'Google Callback',
      '/dashboard/overview': 'Dashboard Overview',
      '/dashboard/availability': 'Availability Management',
      '/dashboard/bookings': 'Bookings',
      '/dashboard/analytics/dashboard': 'Analytics Dashboard',
      '/dashboard/analytics/reports': 'Analytics Reports',
      '/dashboard/settings': 'Settings',
      '/booking': 'Booking Wizard',
      '/booking/:providerId/duration': 'Duration Selection',
      '/booking/:providerId/availability': 'Availability Slots',
      '/booking/:providerId/information': 'Guest Information',
      '/booking/:providerId/confirmation': 'Booking Confirmation',
      '/providers': 'Provider Search',
      '/provider/:id': 'Provider Profile',
      '/home': 'Home',
      '/notifications': 'Notifications',
      '/booking-lookup': 'Booking Lookup',
      '/booking-lookup/:serialKey': 'Booking Lookup',
      '/booking-cancel/:id': 'Booking Cancellation'
    };

    // Find matching route
    let pageName = '';
    for (const [pattern, name] of Object.entries(pageMap)) {
      if (this.matchesRoute(url, pattern)) {
        pageName = name;
        break;
      }
    }

    this.currentPage.next(pageName);
  }

  private matchesRoute(url: string, pattern: string): boolean {
    // Simple route matching (you may want to enhance this)
    if (pattern.includes(':')) {
      // Handle dynamic routes like /provider/:id
      const patternParts = pattern.split('/');
      const urlParts = url.split('/');
      if (patternParts.length !== urlParts.length) return false;
      
      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) continue; // Skip dynamic segments
        if (patternParts[i] !== urlParts[i]) return false;
      }
      return true;
    }
    return url === pattern;
  }

  getCurrentPage(): string {
    return this.currentPage.value;
  }
}