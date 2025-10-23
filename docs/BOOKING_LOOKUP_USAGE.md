# Booking Lookup Component - Usage Guide

## ✅ **Component Created**

A standalone booking lookup component has been created at:
```
/frontend/src/app/booking-lookup/
├── booking-lookup.component.ts
├── booking-lookup.component.html
├── booking-lookup.component.scss
└── index.ts
```

---

## 🎯 **Features**

### 1. **Serial Key Lookup**
- Enter booking code (e.g., `EVT-20251015-489B72`)
- Instant booking retrieval
- No authentication required

### 2. **Booking Details Display**
- Guest information
- Booking date and time
- Status badge (confirmed, pending, cancelled, completed)
- Notes
- Timestamps

### 3. **Actions**
- ✅ View QR Code
- ✅ Cancel Booking (with email verification)
- ✅ Find Another Booking

### 4. **Responsive Design**
- Mobile-friendly
- Material Design UI
- Loading states
- Error handling

---

## 📋 **How to Use**

### **Option 1: Add to App Routes**

Update your `app.routes.ts`:

```typescript
import { Routes } from '@angular/router';
import { BookingLookupComponent } from './booking-lookup';

export const routes: Routes = [
  {
    path: 'booking-lookup',
    component: BookingLookupComponent
  },
  {
    path: 'booking-lookup/:serialKey',
    component: BookingLookupComponent
  },
  // ... other routes
];
```

### **Option 2: Use in Home Page**

Since it's a standalone component, you can use it directly in your home page:

```typescript
// home.component.ts
import { Component } from '@angular/core';
import { BookingLookupComponent } from '../booking-lookup';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [BookingLookupComponent],
  template: `
    <div class="home-container">
      <h1>Welcome to Eventide</h1>
      
      <!-- Booking Lookup Section -->
      <section class="lookup-section">
        <app-booking-lookup></app-booking-lookup>
      </section>
      
      <!-- Other home content -->
    </div>
  `
})
export class HomeComponent {}
```

### **Option 3: Use in Modal/Dialog**

```typescript
import { MatDialog } from '@angular/material/dialog';
import { BookingLookupComponent } from './booking-lookup';

// Open as dialog
this.dialog.open(BookingLookupComponent, {
  width: '800px',
  maxHeight: '90vh'
});
```

---

## 🔗 **URL Patterns**

### **Search Page**
```
/booking-lookup
```
Shows search form where users can enter their booking code.

### **Direct Booking View**
```
/booking-lookup/EVT-20251015-489B72
```
Automatically loads and displays the booking with that serial key.

---

## 🎨 **Customization**

### **Change API URL**

The component uses `environment.apiUrl`. Update your environment files:

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-api.com/api'
};
```

### **Customize Styles**

Edit `booking-lookup.component.scss` to match your brand:

```scss
.lookup-header h1 {
  color: #your-brand-color;
}

.status-badge.status-confirmed {
  background-color: #your-success-color;
}
```

---

## 🔌 **Backend API Requirements**

The component requires these backend endpoints:

### 1. **Get Booking by Serial Key**
```
GET /api/bookings/verify/:serialKey
```
Returns booking details.

### 2. **Get QR Code**
```
GET /api/bookings/qr/:serialKey
```
Returns QR code image.

### 3. **Cancel Booking**
```
PATCH /api/bookings/:id
Body: { status: 'cancelled', guestEmail: 'email@example.com' }
```
Cancels the booking with email verification.

---

## 📱 **User Flow**

### **Flow 1: Search by Code**
1. User visits `/booking-lookup`
2. Enters booking code
3. Clicks "Find Booking"
4. Views booking details
5. Can view QR code or cancel

### **Flow 2: Direct Link**
1. User receives email with link: `/booking-lookup/EVT-20251015-489B72`
2. Clicks link
3. Booking details load automatically
4. Can view QR code or cancel

---

## 🎯 **Integration Examples**

### **1. Add to Navigation**

```typescript
// navigation.component.ts
<nav>
  <a routerLink="/home">Home</a>
  <a routerLink="/booking-lookup">Find My Booking</a>
  <a routerLink="/book">Book Now</a>
</nav>
```

### **2. Add to Home Page Hero**

```html
<div class="hero-section">
  <h1>Welcome to Eventide</h1>
  <p>Book appointments or find your existing booking</p>
  
  <div class="action-buttons">
    <button routerLink="/book">Book Now</button>
    <button routerLink="/booking-lookup">Find My Booking</button>
  </div>
</div>
```

### **3. Add to Confirmation Email**

```html
<p>Your booking code: <strong>EVT-20251015-489B72</strong></p>
<a href="https://your-app.com/booking-lookup/EVT-20251015-489B72">
  View or manage your booking
</a>
```

---

## ✅ **Benefits**

1. **No Authentication** - Guests don't need accounts
2. **Standalone** - Can be used anywhere in your app
3. **Responsive** - Works on all devices
4. **Material Design** - Consistent UI
5. **Error Handling** - User-friendly error messages
6. **Loading States** - Clear feedback during API calls
7. **Secure** - Serial key acts as verification

---

## 🚀 **Next Steps**

1. **Add to App Routes** (see Option 1 above)
2. **Test the Component**:
   ```bash
   ng serve
   # Visit http://localhost:4200/booking-lookup
   ```
3. **Integrate into Home Page** (see Option 2 above)
4. **Update Confirmation Emails** with booking lookup links
5. **Add to Navigation Menu**

---

## 📝 **Example: Complete Integration**

```typescript
// app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { 
    path: 'home', 
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  { 
    path: 'booking-lookup', 
    loadComponent: () => import('./booking-lookup').then(m => m.BookingLookupComponent)
  },
  { 
    path: 'booking-lookup/:serialKey', 
    loadComponent: () => import('./booking-lookup').then(m => m.BookingLookupComponent)
  },
  {
    path: 'book/:providerId',
    loadChildren: () => import('./booking-wizard/booking.module').then(m => m.BookingModule)
  }
];
```

---

## 🎉 **Summary**

✅ **Deleted**: `/dashboard-guest/` (20+ files removed)  
✅ **Created**: Simple standalone booking lookup component  
✅ **Features**: Search, view, cancel bookings  
✅ **Usage**: Can be used in routes, home page, or modals  
✅ **No Auth**: Serial key is the verification  

The component is ready to use! Just add it to your routes and you're done! 🚀
