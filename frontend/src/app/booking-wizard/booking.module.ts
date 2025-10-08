import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { BookingRoutingModule } from './booking-routing.module';
import { BookingComponent } from './booking.component';
import { BookingProgressComponent } from './components/booking-progress/booking-progress.component';
import { bookingReducer } from './store-bookings/reducers/booking.reducer';
import { BookingEffects } from './store-bookings/effects/booking.effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BookingRoutingModule,
    BookingComponent,
    BookingProgressComponent,
    StoreModule.forFeature('booking', bookingReducer),
    EffectsModule.forFeature([BookingEffects])
  ]
})
export class BookingModule { }