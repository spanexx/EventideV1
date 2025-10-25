import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, takeUntil, tap } from 'rxjs/operators';
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
import { MatInputModule } from '@angular/material/input';
import * as DashboardActions from '../../store-dashboard/actions/dashboard.actions';
import * as DashboardSelectors from '../../store-dashboard/selectors/dashboard.selectors';
import { selectProviderId } from '../../../auth/store/auth/selectors/auth.selectors';
import { Booking, BookingStatus } from '../../models/booking.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingEditDialogComponent } from '../../components/booking-edit-dialog/booking-edit-dialog.component';
import { CompleteBookingDialogComponent } from '../../components/complete-booking-dialog/complete-booking-dialog.component';

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
    MatInputModule
  ],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss'
})
export class BookingsComponent implements OnInit, OnDestroy {
  bookings$: Observable<Booking[]>;
  loading$: Observable<boolean>;
  selectedStatus: string = '';
  searchTerm: string = '';
  
  // Search functionality
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Pagination
  pageSize = 10;
  currentPage = 0;
  totalBookings = 0;
  
  // Cached bookings for stats and optimization
  private allBookings: Booking[] = [];
  private lastLoadParams: any = {};
  private lastLoadTime: number = 0;
  private readonly CACHE_DURATION = 60000; // 60 seconds
  private readonly MIN_SEARCH_LENGTH = 2; // Minimum search length

  constructor(private store: Store, private dialog: MatDialog) {
    this.bookings$ = this.store.select(DashboardSelectors.selectBookings);
    this.loading$ = this.store.select(DashboardSelectors.selectDashboardLoading);
    
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(800), // Increased from 300ms to 800ms
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log(`[BookingsComponent] 🎯 Search debounce fired - triggering filterBookings`);
      this.filterBookings();
    });
    
    // Subscribe to bookings for stats
    this.bookings$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(bookings => {
      const bookingCount = bookings?.length || 0;
      this.allBookings = bookings || [];
      console.log(`[BookingsComponent] 📊 Bookings updated: ${bookingCount} bookings received`);
      console.log(`[BookingsComponent] 📈 Stats - Total: ${this.getBookingCount('total')}, Pending: ${this.getBookingCount('pending')}, Confirmed: ${this.getBookingCount('confirmed')}, Completed: ${this.getBookingCount('completed')}`);
    });
  }

  ngOnInit(): void {
    console.log('[BookingsComponent] initializing: waiting for providerId before loading bookings');
    
    // Gate bookings load on providerId availability
    this.store.select(selectProviderId).pipe(
      filter(providerId => {
        console.log('[BookingsComponent] providerId check:', { providerId, hasValue: !!providerId });
        return !!providerId;
      }),
      tap(providerId => {
        console.log('[BookingsComponent] providerId available, loading bookings:', { providerId });
      }),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadBookings();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

    // Skip if same params and within cache duration
    const now = Date.now();
    const paramsChanged = JSON.stringify(params) !== JSON.stringify(this.lastLoadParams);
    const cacheExpired = (now - this.lastLoadTime) > this.CACHE_DURATION;

    console.log(`[BookingsComponent] loadBookings - params: ${JSON.stringify(params)}, changed: ${paramsChanged}, expired: ${cacheExpired}`);

    if (!paramsChanged && !cacheExpired) {
      console.log(`[BookingsComponent] 🚫 Skipping DB call - using cached data (${Math.round((this.CACHE_DURATION - (now - this.lastLoadTime)) / 1000)}s remaining)`);
      return;
    }

    console.log(`[BookingsComponent] 🔄 Making API call with params: ${JSON.stringify(params)}`);
    this.lastLoadParams = { ...params };
    this.lastLoadTime = now;
    this.store.dispatch(DashboardActions.loadBookings({ params }));
  }

  refreshBookings(): void {
    console.log(`[BookingsComponent] refreshBookings called - clearing cache and forcing refresh`);
    // Force refresh by clearing cache
    this.lastLoadTime = 0;
    this.loadBookings();
  }

  filterBookings(): void {
    console.log(`[BookingsComponent] filterBookings called - currentPage reset to 0, searchTerm: "${this.searchTerm}", status: "${this.selectedStatus}"`);
    this.currentPage = 0; // Reset to first page when filtering
    this.loadBookings();
  }

  onPageChange(event: PageEvent): void {
    console.log(`[BookingsComponent] onPageChange - pageSize: ${event.pageSize}, pageIndex: ${event.pageIndex}`);
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
    console.log(`[BookingsComponent] onSearch called with: "${this.searchTerm}" (length: ${this.searchTerm.length})`);

    // Only search if term is long enough or empty (to clear)
    if (this.searchTerm.length === 0 || this.searchTerm.length >= this.MIN_SEARCH_LENGTH) {
      console.log(`[BookingsComponent] 🔍 Triggering search for: "${this.searchTerm}"`);
      this.searchSubject.next(this.searchTerm);
    } else {
      console.log(`[BookingsComponent] ⏸️ Search ignored - too short (min: ${this.MIN_SEARCH_LENGTH} chars)`);
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterBookings();
  }

  getBookingCount(status: string): number {
    if (status === 'total') {
      return this.allBookings.length;
    }
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

  getSortedBookings(bookings: Booking[] | null): Booking[] {
    if (!bookings) return [];
    
    return [...bookings].sort((a, b) => {
      // Completed bookings go last
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (b.status === 'completed' && a.status !== 'completed') return -1;
      
      // Sort by date within same status
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }
}