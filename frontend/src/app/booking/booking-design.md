# Eventide Booking Module Architecture

## Overview
The booking module provides guests with a seamless booking experience through a multi-step flow. It allows guests to select appointment durations, choose available time slots, provide their information, and receive real-time updates on their booking status.

## Key Features
Based on the Eventide project plan, the booking module should include:

1. **Multi-step Booking Flow** - Guided process for guests to book appointments
2. **Availability Selection** - Interface to view and select available time slots
3. **Guest Information Collection** - Form to collect guest details
4. **Real-time Updates** - Live availability and booking confirmations
5. **Form Validation** - Input validation for all booking fields
6. **Error Handling** - Comprehensive error handling and user feedback

## Architecture Components

### 1. Module Structure
```
src/app/booking/
├── booking-routing.module.ts
├── booking.component.ts|.html|.scss
├── booking.module.ts
├── components/
│   ├── duration-selection/
│   ├── availability-slots/
│   ├── guest-information/
│   ├── booking-confirmation/
│   └── booking-progress/
├── pages/
│   ├── booking-flow/
│   └── booking-success/
├── services/
│   ├── booking.service.ts
│   └── availability.service.ts
├── store/
│   ├── actions/
│   ├── reducers/
│   ├── effects/
│   └── selectors/
└── models/
    ├── booking.models.ts
    └── availability.models.ts
```

### 2. State Management (NgRx)
The booking module will use NgRx for state management with the following feature states:

```typescript
// Root booking state
interface BookingState {
  duration: number | null;
  selectedSlot: TimeSlot | null;
  guestInfo: GuestInfo | null;
  booking: Booking | null;
  availability: TimeSlot[];
  loading: boolean;
  error: string | null;
}

// Guest information
interface GuestInfo {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

// Time slot
interface TimeSlot {
  id: string;
  providerId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  duration: number;
  isBooked: boolean;
}
```

### 3. Services
The booking module will include several services for data management:

```typescript
// Booking service for booking functionality
@Injectable()
export class BookingService {
  createBooking(booking: CreateBookingRequest): Observable<BookingResponse> { ... }
  getBookingById(id: string): Observable<Booking> { ... }
}

// Availability service for checking available slots
@Injectable()
export class AvailabilityService {
  getAvailableSlots(providerId: string, date: Date, duration: number): Observable<TimeSlot[]> { ... }
  checkSlotAvailability(slotId: string): Observable<boolean> { ... }
}
```

### 4. Components

#### Main Booking Component
```typescript
@Component({
  selector: 'app-booking',
  template: `
    <div class="booking-container">
      <app-booking-progress></app-booking-progress>
      <router-outlet></router-outlet>
    </div>
  `
})
export class BookingComponent {}
```

#### Duration Selection Component
```typescript
@Component({
  selector: 'app-duration-selection',
  template: `
    <div class="duration-selection">
      <h2>Select Appointment Duration</h2>
      <mat-form-field>
        <mat-select placeholder="Duration" [(ngModel)]="selectedDuration">
          <mat-option *ngFor="let option of durationOptions" [value]="option.value">
            {{option.label}}
          </mat-option>
        </mat-select>
      </mat-form-field>
      <button mat-raised-button color="primary" (click)="selectDuration()">Continue</button>
    </div>
  `
})
export class DurationSelectionComponent {
  durationOptions = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '60 minutes' },
    { value: 90, label: '90 minutes' }
  ];
  
  selectedDuration: number = 30;
  
  selectDuration() {
    // Dispatch action to set selected duration
  }
}
```

#### Availability Slots Component
```typescript
@Component({
  selector: 'app-availability-slots',
  template: `
    <div class="availability-slots">
      <h2>Select a Time Slot</h2>
      <div class="date-navigation">
        <button mat-icon-button (click)="previousDay()"><mat-icon>chevron_left</mat-icon></button>
        <span class="current-date">{{ currentDate | date:'fullDate' }}</span>
        <button mat-icon-button (click)="nextDay()"><mat-icon>chevron_right</mat-icon></button>
      </div>
      <div class="slots-grid">
        <button 
          *ngFor="let slot of availableSlots" 
          mat-raised-button
          [color]="selectedSlot?.id === slot.id ? 'primary' : 'basic'"
          (click)="selectSlot(slot)">
          {{ slot.startTime | date:'shortTime' }}
        </button>
      </div>
      <div class="actions">
        <button mat-button (click)="goBack()">Back</button>
        <button mat-raised-button color="primary" [disabled]="!selectedSlot" (click)="confirmSlot()">Continue</button>
      </div>
    </div>
  `
})
export class AvailabilitySlotsComponent {
  currentDate = new Date();
  availableSlots: TimeSlot[] = [];
  selectedSlot: TimeSlot | null = null;
  
  selectSlot(slot: TimeSlot) {
    this.selectedSlot = slot;
  }
  
  confirmSlot() {
    // Dispatch action to set selected slot
  }
  
  previousDay() {
    // Navigate to previous day
  }
  
  nextDay() {
    // Navigate to next day
  }
}
```

#### Guest Information Component
```typescript
@Component({
  selector: 'app-guest-information',
  template: `
    <div class="guest-information">
      <h2>Your Information</h2>
      <form [formGroup]="guestForm" (ngSubmit)="submitForm()">
        <mat-form-field>
          <input matInput placeholder="Full Name" formControlName="name" required>
          <mat-error *ngIf="guestForm.get('name')?.invalid">Name is required</mat-error>
        </mat-form-field>
        
        <mat-form-field>
          <input matInput placeholder="Email" formControlName="email" required email>
          <mat-error *ngIf="guestForm.get('email')?.invalid">Valid email is required</mat-error>
        </mat-form-field>
        
        <mat-form-field>
          <input matInput placeholder="Phone" formControlName="phone">
        </mat-form-field>
        
        <mat-form-field>
          <textarea matInput placeholder="Notes (optional)" formControlName="notes"></textarea>
        </mat-form-field>
        
        <div class="actions">
          <button mat-button (click)="goBack()">Back</button>
          <button mat-raised-button color="primary" type="submit" [disabled]="guestForm.invalid">Confirm Booking</button>
        </div>
      </form>
    </div>
  `
})
export class GuestInformationComponent {
  guestForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    notes: ['']
  });
  
  constructor(private fb: FormBuilder) {}
  
  submitForm() {
    if (this.guestForm.valid) {
      // Dispatch action to create booking
    }
  }
}
```

#### Booking Confirmation Component
```typescript
@Component({
  selector: 'app-booking-confirmation',
  template: `
    <div class="booking-confirmation">
      <mat-icon class="success-icon">check_circle</mat-icon>
      <h2>Booking Confirmed!</h2>
      <p>Your appointment has been successfully scheduled.</p>
      
      <div class="booking-details">
        <h3>Appointment Details</h3>
        <p><strong>Date:</strong> {{ booking?.startTime | date:'fullDate' }}</p>
        <p><strong>Time:</strong> {{ booking?.startTime | date:'shortTime' }} - {{ booking?.endTime | date:'shortTime' }}</p>
        <p><strong>Duration:</strong> {{ booking?.duration }} minutes</p>
        <p><strong>Name:</strong> {{ guestInfo?.name }}</p>
        <p><strong>Email:</strong> {{ guestInfo?.email }}</p>
        <p><strong>Phone:</strong> {{ guestInfo?.phone }}</p>
      </div>
      
      <button mat-raised-button color="primary" (click)="finish()">Finish</button>
    </div>
  `
})
export class BookingConfirmationComponent {
  booking: Booking | null = null;
  guestInfo: GuestInfo | null = null;
  
  finish() {
    // Navigate to success page or back to home
  }
}
```

### 5. Routing
The booking module will have its own routing module with lazy loading:

```typescript
// booking-routing.module.ts
const routes: Routes = [
  {
    path: '',
    component: BookingComponent,
    children: [
      { path: '', redirectTo: 'duration', pathMatch: 'full' },
      { 
        path: 'duration', 
        loadComponent: () => import('./components/duration-selection/duration-selection.component').then(m => m.DurationSelectionComponent) 
      },
      { 
        path: 'availability', 
        loadComponent: () => import('./components/availability-slots/availability-slots.component').then(m => m.AvailabilitySlotsComponent) 
      },
      { 
        path: 'information', 
        loadComponent: () => import('./components/guest-information/guest-information.component').then(m => m.GuestInformationComponent) 
      },
      { 
        path: 'confirmation', 
        loadComponent: () => import('./components/booking-confirmation/booking-confirmation.component').then(m => m.BookingConfirmationComponent) 
      }
    ]
  }
];
```

### 6. Real-time Updates
The booking module will integrate with WebSocket for real-time updates:

```typescript
@Injectable()
export class BookingSocketService {
  private socket: Socket;
  
  constructor(private store: Store) {
    this.socket = io(environment.wsUrl);
    
    this.socket.on('slot_booked', (slotId: string) => {
      this.store.dispatch(BookingActions.slotBooked({ slotId }));
    });
    
    this.socket.on('booking_confirmed', (booking: Booking) => {
      this.store.dispatch(BookingActions.bookingConfirmed({ booking }));
    });
  }
  
  joinProviderRoom(providerId: string) {
    this.socket.emit('join_provider_room', { providerId });
  }
}
```

## Technical Implementation Plan

### Phase 1: Core Structure
1. Create booking module with routing
2. Implement main booking layout and progress indicator
3. Set up NgRx store for booking state
4. Create models for booking and availability data

### Phase 2: Booking Components
1. Implement duration selection component
2. Create availability slots component
3. Build guest information form with validation
4. Add booking confirmation component

### Phase 3: Services & Integration
1. Implement booking services for API integration
2. Connect to real-time WebSocket updates
3. Add error handling and loading states
4. Implement form validation for all input fields

### Phase 4: Advanced Features
1. Implement responsive design
2. Add unit tests for all components and services
3. Implement accessibility features
4. Add performance optimizations

## Dependencies
The booking module will depend on:
- @angular/material for UI components
- @angular/forms for form handling and validation
- @ngrx/store for state management
- socket.io-client for real-time updates
- Existing auth module and services

## Testing Strategy
- Unit tests for all components and services
- Integration tests for NgRx store
- E2E tests for critical user flows
- Form validation tests
- Accessibility testing
- Performance testing