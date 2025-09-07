# Guest Dashboard - Component Breakdown

## Overview
This document outlines the components needed for the Guest dashboard in the Eventide application. Unlike the Provider dashboard which is for business management, the Guest dashboard focuses on viewing and managing their own bookings.

## Core Features
Based on the Eventide project plan, the Guest dashboard should include:
1. **Booking History** - View past and upcoming appointments
2. **Booking Details** - See detailed information about appointments
3. **Rescheduling** - Option to reschedule existing bookings (if allowed by provider)
4. **Cancellation** - Ability to cancel bookings (subject to provider policies)
5. **Provider Information** - View details about service providers they've booked with

## Component Structure
```
src/app/dashboard-guest/
├── dashboard-guest-routing.module.ts
├── dashboard-guest.component.ts|.html|.scss
├── dashboard-guest.module.ts
├── components/
│   ├── header/
│   ├── sidebar/
│   ├── booking-list/
│   ├── booking-details/
│   └── provider-info/
├── pages/
│   ├── overview/
│   ├── bookings/
│   └── profile/
├── services/
│   ├── guest-dashboard.service.ts
│   └── guest-booking.service.ts
├── store/
│   ├── actions/
│   ├── reducers/
│   ├── effects/
│   └── selectors/
└── models/
    ├── guest.models.ts
    └── booking.models.ts
```

## Required Components

### 1. Main Dashboard Component
```typescript
@Component({
  selector: 'app-dashboard-guest',
  template: `
    <app-guest-header></app-guest-header>
    <div class="dashboard-container">
      <app-guest-sidebar></app-guest-sidebar>
      <main class="dashboard-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class DashboardGuestComponent {}
```

### 2. Booking Overview Page
- Display summary of upcoming and past bookings
- Show key metrics (total bookings, upcoming appointments)
- Quick actions for common tasks

### 3. Booking List Component
```typescript
@Component({
  selector: 'app-guest-booking-list',
  template: `
    <div class="booking-list">
      <mat-tab-group>
        <mat-tab label="Upcoming">
          <app-booking-card 
            *ngFor="let booking of upcomingBookings" 
            [booking]="booking">
          </app-booking-card>
        </mat-tab>
        <mat-tab label="Past">
          <app-booking-card 
            *ngFor="let booking of pastBookings" 
            [booking]="booking">
          </app-booking-card>
        </mat-tab>
      </mat-tab-group>
    </div>
  `
})
export class GuestBookingListComponent {
  upcomingBookings$ = this.store.select(selectUpcomingBookings);
  pastBookings$ = this.store.select(selectPastBookings);
}
```

### 4. Booking Details Component
```typescript
@Component({
  selector: 'app-booking-details',
  template: `
    <div class="booking-details">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Appointment Details</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Date:</strong> {{ booking?.date | date }}</p>
          <p><strong>Time:</strong> {{ booking?.startTime | date:'shortTime' }} - {{ booking?.endTime | date:'shortTime' }}</p>
          <p><strong>Provider:</strong> {{ booking?.providerName }}</p>
          <p><strong>Service:</strong> {{ booking?.service }}</p>
          <p><strong>Status:</strong> <app-booking-status [status]="booking?.status"></app-booking-status></p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-button *ngIf="canCancel(booking)" (click)="cancelBooking(booking)">Cancel</button>
          <button mat-button *ngIf="canReschedule(booking)" (click)="rescheduleBooking(booking)">Reschedule</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `
})
export class BookingDetailsComponent {
  booking$ = this.store.select(selectCurrentBooking);
  
  canCancel(booking: Booking): boolean {
    // Check if booking can be cancelled based on provider policies
    return true;
  }
  
  canReschedule(booking: Booking): boolean {
    // Check if booking can be rescheduled
    return true;
  }
}
```

### 5. Profile Management Component
- Allow guests to update their personal information
- Manage notification preferences
- View account settings

## State Management (NgRx)
The guest dashboard will use NgRx for state management with the following feature states:

```typescript
// Root guest dashboard state
interface GuestDashboardState {
  bookings: GuestBookingState;
  profile: GuestProfileState;
  ui: UIState;
}

// Booking state for guests
interface GuestBookingState {
  all: Booking[];
  current: Booking | null;
  loading: boolean;
  error: string | null;
}

// Profile state for guests
interface GuestProfileState {
  info: GuestInfo | null;
  preferences: GuestPreferences | null;
  loading: boolean;
  error: string | null;
}
```

## Services
The guest dashboard will include services for data management:

```typescript
// Guest dashboard service for general dashboard data
@Injectable()
export class GuestDashboardService {
  getBookingHistory(guestId: string): Observable<Booking[]> { ... }
  getBookingById(bookingId: string): Observable<Booking> { ... }
}

// Guest profile service for managing guest information
@Injectable()
export class GuestProfileService {
  getProfile(guestId: string): Observable<GuestInfo> { ... }
  updateProfile(guestId: string, profile: GuestInfo): Observable<GuestInfo> { ... }
}
```

## Routing
The guest dashboard will have its own routing module with lazy loading:

```typescript
// dashboard-guest-routing.module.ts
const routes: Routes = [
  {
    path: '',
    component: DashboardGuestComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { 
        path: 'overview', 
        loadComponent: () => import('./pages/overview/overview.component').then(m => m.OverviewComponent) 
      },
      { 
        path: 'bookings', 
        loadComponent: () => import('./pages/bookings/bookings.component').then(m => m.BookingsComponent) 
      },
      { 
        path: 'bookings/:id', 
        loadComponent: () => import('./components/booking-details/booking-details.component').then(m => m.BookingDetailsComponent) 
      },
      { 
        path: 'profile', 
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) 
      }
    ]
  }
];
```

## Authentication Integration
The guest dashboard will use route guards to ensure only authenticated guests can access it:

```typescript
@Injectable()
export class GuestDashboardGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  canActivate(): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      tap(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate(['/auth/login']);
        }
      })
    );
  }
}
```

## Implementation Plan

### Phase 1: Core Structure
1. Create dashboard-guest module with routing
2. Implement main dashboard layout (header, sidebar, content area)
3. Set up NgRx store for guest dashboard state
4. Create authentication guard for guest dashboard routes

### Phase 2: Dashboard Components
1. Implement booking overview component
2. Create booking list component
3. Build booking details component
4. Add profile management component

### Phase 3: Services & Integration
1. Implement guest dashboard services for API integration
2. Connect to existing auth system
3. Add error handling and loading states

### Phase 4: Advanced Features
1. Implement responsive design
2. Add unit tests for all components and services
3. Implement accessibility features
4. Add performance optimizations

## Dependencies
The guest dashboard module will depend on:
- @angular/material for UI components
- @ngrx/store for state management
- Existing auth module and services
- Booking module components for shared functionality

## Testing Strategy
- Unit tests for all components and services
- Integration tests for NgRx store
- E2E tests for critical user flows
- Accessibility testing
- Performance testing