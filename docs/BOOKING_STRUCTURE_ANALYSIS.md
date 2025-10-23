# Booking Structure Analysis & Recommendations

## Current Structure Overview

### 1. `/frontend/src/app/booking` - **Public Booking Flow**
**Purpose**: Guest-facing booking creation wizard (multi-step form)

**Contents**:
- `booking.component.ts` - Container with progress indicator
- `booking-routing.module.ts` - Multi-step routing (duration → availability → information → confirmation)
- **Components** (4 steps):
  - `duration-selection` - Step 1: Select booking duration
  - `availability-slots` - Step 2: Choose available time slot
  - `guest-information` - Step 3: Enter guest details
  - `booking-confirmation` - Step 4: Confirmation & QR code
- **Models**: `booking.models.ts`, `availability.models.ts`
- **Store** (`store-bookings/`):
  - Actions, Effects, Reducers, Selectors
  - Manages booking creation flow state

**Use Case**: Public-facing booking creation (e.g., `/book/:providerId`)

---

### 2. `/frontend/src/app/dashboard-guest` - **Guest Dashboard**
**Purpose**: Authenticated guest viewing/managing their bookings

**Contents**:
- `dashboard-guest.component.ts` - Main dashboard layout
- `pages/bookings/` - Bookings page (currently minimal)
- **Components**:
  - `booking-list` - Display upcoming/past bookings with tabs
  - `booking-details` - View single booking details
  - `header`, `sidebar` - Dashboard navigation
- **Store** (`store/`):
  - Guest dashboard state management
  - Loads and manages guest's bookings
- **Guards**: `guest-dashboard.guard.ts` - Auth protection

**Use Case**: Authenticated guest dashboard (e.g., `/guest-dashboard/bookings`)

---

## Problem Identified

**Duplication & Confusion**:
1. Two separate booking stores with different purposes
2. Shared models but different contexts
3. `dashboard-guest/pages/bookings` is underdeveloped
4. Unclear separation of concerns

---

## Recommended Structure

### **Option 1: Keep Separate (Recommended)**

**Rationale**: These serve different purposes and user flows

```
frontend/src/app/
├── booking/                          # PUBLIC booking creation
│   ├── components/                   # Multi-step wizard components
│   │   ├── duration-selection/
│   │   ├── availability-slots/
│   │   ├── guest-information/
│   │   └── booking-confirmation/
│   ├── models/                       # SHARED models
│   │   ├── booking.models.ts
│   │   └── availability.models.ts
│   ├── store/                        # Booking CREATION state
│   │   ├── actions/
│   │   ├── effects/
│   │   ├── reducers/
│   │   └── selectors/
│   ├── booking.component.ts
│   ├── booking-routing.module.ts
│   └── booking.module.ts
│
└── dashboard-guest/                  # AUTHENTICATED guest dashboard
    ├── pages/
    │   ├── bookings/                 # Guest bookings management
    │   │   └── bookings.component.ts
    │   └── overview/
    ├── components/
    │   ├── booking-list/             # List view component
    │   ├── booking-details/          # Detail view component
    │   ├── header/
    │   └── sidebar/
    ├── store/                        # Guest dashboard state
    │   ├── actions/
    │   ├── effects/
    │   ├── reducers/
    │   └── selectors/
    ├── guards/
    └── dashboard-guest.component.ts
```

**Actions Required**:
1. ✅ Keep `/booking` as-is (public booking flow)
2. ✅ Keep `/dashboard-guest` as-is (guest dashboard)
3. 🔄 Move shared models to `/shared/models/booking/`
4. 🔄 Enhance `dashboard-guest/pages/bookings` to use existing components
5. ❌ Remove duplicate/unused code

---

### **Option 2: Consolidate (Not Recommended)**

Merge everything into one module - **NOT recommended** because:
- Different user contexts (public vs authenticated)
- Different routing needs
- Different state management requirements
- Harder to lazy-load and optimize

---

## Detailed Recommendations

### **1. Move Shared Models to Shared Location**

**Current**:
```
/booking/models/booking.models.ts
/booking/models/availability.models.ts
```

**Recommended**:
```
/shared/models/
├── booking.models.ts
└── availability.models.ts
```

**Why**: Both modules use these models, so they should be in a shared location.

---

### **2. Clarify Store Responsibilities**

**`/booking/store/`** - Booking Creation Flow
- State: `{ duration, selectedSlot, guestInfo, booking, availability, qrCode, loading, error }`
- Purpose: Manage multi-step booking creation wizard
- Actions: `setDuration`, `selectSlot`, `setGuestInfo`, `createBooking`, `loadAvailableSlots`

**`/dashboard-guest/store/`** - Guest Dashboard
- State: `{ bookings, selectedBooking, loading, error }`
- Purpose: Manage guest's existing bookings
- Actions: `loadBookings`, `selectBooking`, `cancelBooking`, `updateBooking`

**Action**: Rename for clarity
- `/booking/store-bookings/` → `/booking/store/` (already correct)
- `/dashboard-guest/store/` → Keep as-is

---

### **3. Enhance Dashboard Guest Bookings Page**

**Current State**: Minimal implementation

**Recommended Enhancement**:

```typescript
// dashboard-guest/pages/bookings/bookings.component.ts
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { GuestBookingListComponent } from '../../components/booking-list/booking-list.component';
import { BookingDetailsComponent } from '../../components/booking-details/booking-details.component';
import * as GuestDashboardActions from '../../store/actions/guest-dashboard.actions';
import * as GuestDashboardSelectors from '../../store/selectors/guest-dashboard.selectors';
import { Booking } from '../../../shared/models/booking.models';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    GuestBookingListComponent,
    BookingDetailsComponent
  ],
  template: `
    <div class="bookings-page">
      <h1>My Bookings</h1>
      
      <app-guest-booking-list
        [upcomingBookings]="upcomingBookings$ | async"
        [pastBookings]="pastBookings$ | async"
        [loading]="loading$ | async"
        [error]="error$ | async"
        (cancelBooking)="onCancelBooking($event)"
        (viewDetails)="onViewDetails($event)">
      </app-guest-booking-list>
      
      <app-booking-details
        *ngIf="selectedBooking$ | async as booking"
        [booking]="booking"
        (close)="onCloseDetails()">
      </app-booking-details>
    </div>
  `
})
export class BookingsComponent implements OnInit {
  upcomingBookings$: Observable<Booking[]>;
  pastBookings$: Observable<Booking[]>;
  selectedBooking$: Observable<Booking | null>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  constructor(private store: Store) {
    this.upcomingBookings$ = this.store.select(GuestDashboardSelectors.selectUpcomingBookings);
    this.pastBookings$ = this.store.select(GuestDashboardSelectors.selectPastBookings);
    this.selectedBooking$ = this.store.select(GuestDashboardSelectors.selectSelectedBooking);
    this.loading$ = this.store.select(GuestDashboardSelectors.selectBookingsLoading);
    this.error$ = this.store.select(GuestDashboardSelectors.selectBookingsError);
  }

  ngOnInit(): void {
    this.store.dispatch(GuestDashboardActions.loadBookings());
  }

  onCancelBooking(bookingId: string): void {
    this.store.dispatch(GuestDashboardActions.cancelBooking({ id: bookingId }));
  }

  onViewDetails(bookingId: string): void {
    this.store.dispatch(GuestDashboardActions.selectBooking({ id: bookingId }));
  }

  onCloseDetails(): void {
    this.store.dispatch(GuestDashboardActions.clearSelectedBooking());
  }
}
```

---

### **4. Remove Unused/Duplicate Code**

**To Remove**:
- ❌ Any duplicate service files (already cleaned up)
- ❌ Unused components
- ❌ Old store implementations

**To Keep**:
- ✅ `/booking/*` - Complete public booking flow
- ✅ `/dashboard-guest/*` - Complete guest dashboard
- ✅ Shared models (move to `/shared/models/`)

---

## Migration Plan

### **Phase 1: Move Shared Models** ✅
1. Create `/shared/models/` directory
2. Move `booking.models.ts` and `availability.models.ts`
3. Update all imports across both modules

### **Phase 2: Enhance Guest Dashboard** 🔄
1. Complete `dashboard-guest/pages/bookings` implementation
2. Connect to existing store
3. Add routing for booking details view
4. Implement cancel/reschedule functionality

### **Phase 3: Clean Up** ❌
1. Remove any duplicate code
2. Update documentation
3. Verify all imports are correct
4. Test both flows end-to-end

---

## Summary

### **Keep Both Modules**:
- **`/booking`** = Public booking creation wizard (multi-step form)
- **`/dashboard-guest`** = Authenticated guest dashboard (view/manage bookings)

### **Share Resources**:
- Models → Move to `/shared/models/`
- Services → Use dashboard services (already done)
- Components → Keep separate (different contexts)

### **Enhance**:
- Complete `dashboard-guest/pages/bookings` implementation
- Add proper state management integration
- Implement cancel/reschedule features

### **Remove**:
- Duplicate services (already done ✅)
- Unused components
- Old/deprecated code

---

## File Structure After Migration

```
frontend/src/app/
├── shared/
│   └── models/
│       ├── booking.models.ts          # MOVED from /booking/models/
│       └── availability.models.ts     # MOVED from /booking/models/
│
├── booking/                           # PUBLIC BOOKING FLOW
│   ├── components/                    # 4-step wizard
│   ├── store/                         # Booking creation state
│   ├── booking.component.ts
│   └── booking-routing.module.ts
│
├── dashboard-guest/                   # GUEST DASHBOARD
│   ├── pages/
│   │   └── bookings/                  # ENHANCED
│   ├── components/
│   │   ├── booking-list/              # List view
│   │   └── booking-details/           # Detail view
│   ├── store/                         # Guest bookings state
│   └── dashboard-guest.component.ts
│
└── dashboard/                         # PROVIDER DASHBOARD
    └── services/
        └── booking/                   # SHARED SERVICES
            ├── booking-facade.service.ts
            ├── booking-api.service.ts
            ├── booking-state.service.ts
            └── booking-socket.service.ts
```

This structure provides:
- ✅ Clear separation of concerns
- ✅ No duplication
- ✅ Shared resources in appropriate locations
- ✅ Easy to maintain and extend
- ✅ Optimized for lazy loading
