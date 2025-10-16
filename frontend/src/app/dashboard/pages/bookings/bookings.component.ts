import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';
import * as DashboardActions from '../../store-dashboard/actions/dashboard.actions';
import * as DashboardSelectors from '../../store-dashboard/selectors/dashboard.selectors';
import { Booking, BookingStatus } from '../../models/booking.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingEditDialogComponent } from '../../components/booking-edit-dialog/booking-edit-dialog.component';
import { CompleteBookingDialogComponent } from '../../components/complete-booking-dialog/complete-booking-dialog.component';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatInputModule
  ],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss'
})
export class BookingsComponent implements OnInit {
  bookings$: Observable<Booking[]>;
  loading$: Observable<boolean>;
  selectedStatus: string = '';
  searchTerm: string = '';
  viewMode: 'table' | 'cards' = 'cards';
  
  // Search functionality
  private searchSubject = new Subject<string>();
  
  // Table configuration
  displayedColumns: string[] = ['guest', 'datetime', 'duration', 'status', 'notes', 'actions'];
  
  // Pagination
  pageSize = 10;
  currentPage = 0;
  totalBookings = 0;
  
  // Cached bookings for stats
  private allBookings: Booking[] = [];

  constructor(private store: Store, private dialog: MatDialog) {
    this.bookings$ = this.store.select(DashboardSelectors.selectBookings);
    this.loading$ = this.store.select(DashboardSelectors.selectDashboardLoading);
    
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.filterBookings();
    });
    
    // Subscribe to bookings for stats
    this.bookings$.subscribe(bookings => {
      this.allBookings = bookings || [];
    });
  }

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    const params: any = {
      page: this.currentPage + 1,
      limit: this.pageSize
    };
    if (this.selectedStatus) {
      params.status = this.selectedStatus;
    }
    if (this.searchTerm) {
      params.search = this.searchTerm;
    }
    console.log('[BookingsComponent] loadBookings with params:', params);
    this.store.dispatch(DashboardActions.loadBookings({ params }));
  }

  refreshBookings(): void {
    this.loadBookings();
  }

  filterBookings(): void {
    this.currentPage = 0; // Reset to first page when filtering
    this.loadBookings();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.loadBookings();
  }

  editBooking(booking: Booking): void {
    const dialogRef = this.dialog.open(BookingEditDialogComponent, {
      width: '600px',
      data: { booking }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('[BookingsComponent] editBooking result:', result);
        const bookingId = booking.id || booking._id || '';
        if (bookingId) {
          this.store.dispatch(DashboardActions.updateBooking({ 
            bookingId, 
            booking: result 
          }));
        }
      }
    });
  }

  cancelBooking(booking: Booking): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      const bookingId = booking.id || booking._id || '';
      if (bookingId) {
        console.log('[BookingsComponent] cancelBooking', { bookingId });
        this.store.dispatch(DashboardActions.cancelBooking({ bookingId }));
      }
    }
  }

  updateBookingStatus(booking: Booking, status: BookingStatus): void {
    const bookingId = booking.id || booking._id || '';
    if (bookingId) {
      this.store.dispatch(DashboardActions.updateBookingStatus({ 
        bookingId, 
        status 
      }));
    }
  }

  approve(booking: Booking): void {
    const bookingId = booking.id || booking._id || '';
    if (bookingId) {
      console.log('[BookingsComponent] approve', { bookingId });
      this.store.dispatch(DashboardActions.approveBooking({ bookingId }));
    }
  }

  decline(booking: Booking): void {
    const bookingId = booking.id || booking._id || '';
    if (bookingId) {
      console.log('[BookingsComponent] decline', { bookingId });
      this.store.dispatch(DashboardActions.declineBooking({ bookingId }));
    }
  }

  completeBooking(booking: Booking): void {
    const bookingId = booking.id || booking._id || '';
    if (bookingId) {
      const now = new Date();
      const appointmentEnd = new Date(booking.endTime);
      const isEarly = now < appointmentEnd;
      
      // Open dialog for completion
      const dialogRef = this.dialog.open(CompleteBookingDialogComponent, {
        width: '400px',
        data: { bookingId, isEarly }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          console.log('[BookingsComponent] completeBooking', { bookingId, reason: result.reason });
          this.store.dispatch(DashboardActions.completeBooking({ 
            bookingId, 
            reason: result.reason 
          }));
        }
      });
    }
  }

  // New methods for enhanced functionality
  onSearch(): void {
    this.searchSubject.next(this.searchTerm);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterBookings();
  }

  onViewModeChange(event: any): void {
    this.viewMode = event.value;
  }

  getBookingCount(status: string): number {
    return this.allBookings.filter(booking => booking.status === status).length;
  }

  getInitials(name: string): string {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '??';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'pending': '⏳',
      'confirmed': '✅',
      'cancelled': '❌',
      'completed': '✔️'
    };
    return icons[status] || '📅';
  }
}