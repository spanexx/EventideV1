import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GuestBookingListComponent } from './booking-list.component';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

describe('GuestBookingListComponent', () => {
  let component: GuestBookingListComponent;
  let fixture: ComponentFixture<GuestBookingListComponent>;
  let mockStore: any;

  beforeEach(async () => {
    mockStore = {
      pipe: jasmine.createSpy('pipe').and.returnValue(of([])),
      dispatch: jasmine.createSpy('dispatch')
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatTabsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        RouterModule.forRoot([]),
        GuestBookingListComponent
      ],
      providers: [
        { provide: Store, useValue: mockStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GuestBookingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch loadBookings action on init', () => {
    expect(mockStore.dispatch).toHaveBeenCalled();
  });

  it('should dispatch cancelBooking action when cancelBooking is called', () => {
    const bookingId = 'test-id';
    component.cancelBooking(bookingId);
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: '[Guest Dashboard] Cancel Booking',
        id: bookingId
      })
    );
  });
});