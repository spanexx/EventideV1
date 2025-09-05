import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BookingDetailsComponent } from './booking-details.component';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

describe('BookingDetailsComponent', () => {
  let component: BookingDetailsComponent;
  let fixture: ComponentFixture<BookingDetailsComponent>;
  let mockStore: any;
  let mockActivatedRoute: any;

  beforeEach(async () => {
    mockStore = {
      pipe: jasmine.createSpy('pipe').and.returnValue(of(null)),
      dispatch: jasmine.createSpy('dispatch')
    };

    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('test-id')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        RouterModule.forRoot([]),
        BookingDetailsComponent
      ],
      providers: [
        { provide: Store, useValue: mockStore },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BookingDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch loadBookingById action on init with booking ID from route', () => {
    expect(mockActivatedRoute.snapshot.paramMap.get).toHaveBeenCalledWith('id');
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: '[Guest Dashboard] Load Booking By ID',
        id: 'test-id'
      })
    );
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

  it('should allow cancel when booking status is confirmed', () => {
    const booking: any = { status: 'confirmed' };
    expect(component.canCancel(booking)).toBe(true);
  });

  it('should allow cancel when booking status is pending', () => {
    const booking: any = { status: 'pending' };
    expect(component.canCancel(booking)).toBe(true);
  });

  it('should not allow cancel when booking status is cancelled', () => {
    const booking: any = { status: 'cancelled' };
    expect(component.canCancel(booking)).toBe(false);
  });
});