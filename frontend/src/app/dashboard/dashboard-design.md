# Eventide Dashboard Module Architecture

## Overview
The dashboard module is the central hub for service providers to manage their business operations. It provides real-time visibility into bookings, availability management, analytics, and other key business metrics.

## Key Features
Based on the Eventide project plan, the dashboard module should include:

1. **Provider Hub** - Main dashboard for business management
2. **Smart Calendar Management** - Availability scheduling interface
3. **Real-time Booking Updates** - Live booking notifications
4. **Analytics & Reporting** - Business performance metrics
5. **Subscription Management** - Premium feature access
6. **AI Assistant Integration** - Chatbot interface for premium users

## Architecture Components

### 1. Module Structure
```
src/app/dashboard/
├── dashboard-routing.module.ts
├── dashboard.component.ts|.html|.scss
├── dashboard.module.ts
├── components/
│   ├── header/
│   ├── sidebar/
│   ├── stats-overview/
│   ├── calendar/
│   ├── booking-list/
│   ├── analytics/
│   └── ai-assistant/
├── pages/
│   ├── overview/
│   ├── availability/
│   ├── bookings/
│   ├── analytics/
│   └── settings/
├── services/
│   ├── dashboard.service.ts
│   ├── booking.service.ts
│   ├── availability.service.ts
│   └── analytics.service.ts
├── store/
│   ├── actions/
│   ├── reducers/
│   ├── effects/
│   └── selectors/
└── models/
    ├── dashboard.models.ts
    ├── booking.models.ts
    └── availability.models.ts
```

### 2. State Management (NgRx)
The dashboard will use NgRx for state management with the following feature states:

```typescript
// Root dashboard state
interface DashboardState {
  bookings: BookingState;
  availability: AvailabilityState;
  analytics: AnalyticsState;
  ui: UIState;
}

// Booking state
interface BookingState {
  upcoming: Booking[];
  past: Booking[];
  loading: boolean;
  error: string | null;
}

// Availability state
interface AvailabilityState {
  slots: TimeSlot[];
  loading: boolean;
  error: string | null;
}

// Analytics state
interface AnalyticsState {
  metrics: Metrics;
  loading: boolean;
  error: string | null;
}
```

### 3. Services
The dashboard module will include several services for data management:

```typescript
// Dashboard service for general dashboard data
@Injectable()
export class DashboardService {
  getStats(): Observable<DashboardStats> { ... }
  getRecentActivity(): Observable<Activity[]> { ... }
}

// Booking service for booking management
@Injectable()
export class BookingService {
  getBookings(params: BookingQuery): Observable<Booking[]> { ... }
  updateBookingStatus(id: string, status: BookingStatus): Observable<Booking> { ... }
  cancelBooking(id: string): Observable<boolean> { ... }
}

// Availability service for calendar management
@Injectable()
export class AvailabilityService {
  getAvailability(providerId: string, date: Date): Observable<TimeSlot[]> { ... }
  setAvailability(slots: TimeSlot[]): Observable<boolean> { ... }
  updateSlot(slot: TimeSlot): Observable<TimeSlot> { ... }
}

// Analytics service for business metrics
@Injectable()
export class AnalyticsService {
  getMetrics(period: DateRange): Observable<Metrics> { ... }
  getRevenueReport(period: DateRange): Observable<RevenueData> { ... }
}
```

### 4. Components

#### Main Dashboard Component
```typescript
@Component({
  selector: 'app-dashboard',
  template: `
    <app-dashboard-header></app-dashboard-header>
    <div class="dashboard-container">
      <app-dashboard-sidebar></app-dashboard-sidebar>
      <main class="dashboard-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class DashboardComponent {}
```

#### Stats Overview Component
```typescript
@Component({
  selector: 'app-stats-overview',
  template: `
    <div class="stats-grid">
      <app-stat-card 
        [title]="'Total Bookings'" 
        [value]="stats.totalBookings"
        [change]="stats.bookingChange">
      </app-stat-card>
      <app-stat-card 
        [title]="'Revenue'" 
        [value]="stats.revenue | currency"
        [change]="stats.revenueChange">
      </app-stat-card>
      <app-stat-card 
        [title]="'Upcoming'" 
        [value]="stats.upcomingBookings"
        [change]="stats.upcomingChange">
      </app-stat-card>
      <app-stat-card 
        [title]="'Occupancy'" 
        [value]="stats.occupancy + '%'"
        [change]="stats.occupancyChange">
      </app-stat-card>
    </div>
  `
})
export class StatsOverviewComponent {
  stats$ = this.store.select(selectDashboardStats);
}
```

#### Calendar Component
```typescript
@Component({
  selector: 'app-availability-calendar',
  template: `
    <full-calendar 
      [options]="calendarOptions"
      (dateClick)="handleDateClick($event)"
      (eventClick)="handleEventClick($event)">
    </full-calendar>
  `
})
export class AvailabilityCalendarComponent implements OnInit {
  calendarOptions: CalendarOptions = {
    initialView: 'timeGridWeek',
    editable: true,
    selectable: true,
    events: []
  };
}
```

#### Booking List Component
```typescript
@Component({
  selector: 'app-booking-list',
  template: `
    <div class="booking-list">
      <mat-table [dataSource]="bookings$ | async">
        <ng-container matColumnDef="time">
          <mat-header-cell *matHeaderCellDef>Time</mat-header-cell>
          <mat-cell *matCellDef="let booking">{{ booking.time | date }}</mat-cell>
        </ng-container>
        
        <ng-container matColumnDef="customer">
          <mat-header-cell *matHeaderCellDef>Customer</mat-header-cell>
          <mat-cell *matCellDef="let booking">{{ booking.customerName }}</mat-cell>
        </ng-container>
        
        <ng-container matColumnDef="service">
          <mat-header-cell *matHeaderCellDef>Service</mat-header-cell>
          <mat-cell *matCellDef="let booking">{{ booking.service }}</mat-cell>
        </ng-container>
        
        <ng-container matColumnDef="status">
          <mat-header-cell *matHeaderCellDef>Status</mat-header-cell>
          <mat-cell *matCellDef="let booking">
            <app-booking-status [status]="booking.status"></app-booking-status>
          </mat-cell>
        </ng-container>
        
        <ng-container matColumnDef="actions">
          <mat-header-cell *matHeaderCellDef>Actions</mat-header-cell>
          <mat-cell *matCellDef="let booking">
            <button mat-icon-button (click)="editBooking(booking)">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button (click)="cancelBooking(booking)">
              <mat-icon>cancel</mat-icon>
            </button>
          </mat-cell>
        </ng-container>
        
        <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
      </mat-table>
    </div>
  `
})
export class BookingListComponent {
  displayedColumns: string[] = ['time', 'customer', 'service', 'status', 'actions'];
  bookings$ = this.store.select(selectBookings);
}
```

### 5. Routing
The dashboard will have its own routing module with lazy loading:

```typescript
// dashboard-routing.module.ts
const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { 
        path: 'overview', 
        loadComponent: () => import('./pages/overview/overview.component').then(m => m.OverviewComponent) 
      },
      { 
        path: 'availability', 
        loadComponent: () => import('./pages/availability/availability.component').then(m => m.AvailabilityComponent) 
      },
      { 
        path: 'bookings', 
        loadComponent: () => import('./pages/bookings/bookings.component').then(m => m.BookingsComponent) 
      },
      { 
        path: 'analytics', 
        loadComponent: () => import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent) 
      },
      { 
        path: 'settings', 
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) 
      }
    ]
  }
];
```

### 6. Real-time Updates
The dashboard will integrate with WebSocket for real-time updates:

```typescript
@Injectable()
export class DashboardSocketService {
  private socket: Socket;
  
  constructor(private store: Store) {
    this.socket = io(environment.wsUrl, {
      auth: {
        token: this.store.select(selectAuthToken)
      }
    });
    
    this.socket.on('booking_confirmed', (booking: Booking) => {
      this.store.dispatch(DashboardActions.bookingConfirmed({ booking }));
    });
    
    this.socket.on('booking_cancelled', (bookingId: string) => {
      this.store.dispatch(DashboardActions.bookingCancelled({ bookingId }));
    });
  }
  
  joinProviderRoom(providerId: string) {
    this.socket.emit('join_provider_room', { providerId });
  }
}
```

### 7. Authentication Integration
The dashboard will use route guards to ensure only authenticated users can access it:

```typescript
@Injectable()
export class DashboardGuard implements CanActivate {
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

## Technical Implementation Plan

### Phase 1: Core Structure
1. Create dashboard module with routing
2. Implement main dashboard layout (header, sidebar, content area)
3. Set up NgRx store for dashboard state
4. Create authentication guard for dashboard routes

### Phase 2: Dashboard Components
1. Implement stats overview component
2. Create booking list component
3. Build calendar component for availability management
4. Add analytics dashboard components

### Phase 3: Services & Integration
1. Implement dashboard services for API integration
2. Connect to real-time WebSocket updates
3. Integrate with existing auth system
4. Add error handling and loading states

### Phase 4: Advanced Features
1. Implement responsive design
2. Add unit tests for all components and services
3. Implement accessibility features
4. Add performance optimizations

## Dependencies
The dashboard module will depend on:
- @angular/material for UI components
- angular-calendar for calendar functionality
- @ngrx/store for state management
- socket.io-client for real-time updates
- Existing auth module and services

## Testing Strategy
- Unit tests for all components and services
- Integration tests for NgRx store
- E2E tests for critical user flows
- Accessibility testing
- Performance testing