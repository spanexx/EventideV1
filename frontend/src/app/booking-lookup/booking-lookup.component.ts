import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Booking } from '../shared/models/booking.models';
import * as BookingActions from '../booking-wizard/store-bookings/actions/booking.actions';
import * as BookingSelectors from '../booking-wizard/store-bookings/selectors/booking.selectors';

@Component({
  selector: 'app-booking-lookup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './booking-lookup.component.html',
  styleUrls: ['./booking-lookup.component.scss']
})
export class BookingLookupComponent implements OnInit, OnDestroy {
  serialKey = '';
  booking$: Observable<Booking | null>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;
  qrCode$: Observable<string | null>;
  
  private destroy$ = new Subject<void>();
  private logoBase64: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store
  ) {
    this.booking$ = this.store.select(BookingSelectors.selectBooking);
    this.loading$ = this.store.select(BookingSelectors.selectBookingLoading);
    this.error$ = this.store.select(BookingSelectors.selectBookingError);
    this.qrCode$ = this.store.select(BookingSelectors.selectQRCode);
  }

  private async loadLogoAsBase64(): Promise<string> {
    try {
      const response = await fetch('/logo-porter.png');
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to load logo:', error);
      return '';
    }
  }

  async ngOnInit(): Promise<void> {
    // Load logo as base64
    this.logoBase64 = await this.loadLogoAsBase64();
    
    // Check if serial key is in route params
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['serialKey']) {
          this.serialKey = params['serialKey'];
          this.findBooking();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  findBooking(): void {
    if (!this.serialKey || this.serialKey.trim() === '') {
      return;
    }

    // Dispatch action to verify booking
    this.store.dispatch(BookingActions.verifyBooking({ 
      serialKey: this.serialKey.trim() 
    }));

    // Update URL without reloading
    this.router.navigate(['/booking-lookup', this.serialKey], { replaceUrl: true });
  }

  getQRCode(): void {
    if (!this.serialKey) return;

    // Dispatch action to get QR code
    this.store.dispatch(BookingActions.getQRCode({ 
      serialKey: this.serialKey 
    }));

    // Subscribe to QR code and open in new window
    this.qrCode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(qrCode => {
        if (qrCode) {
          const qrWindow = window.open('', '_blank');
          if (qrWindow) {
            qrWindow.document.write(`
              <html>
                <head><title>Booking QR Code</title></head>
                <body style="text-align: center; padding: 20px;">
                  <h2>Booking: ${this.serialKey}</h2>
                  <img src="${qrCode}" alt="QR Code" style="max-width: 400px;">
                  <p>Serial Key: ${this.serialKey}</p>
                </body>
              </html>
            `);
          }
        }
      });
  }

  cancelBooking(booking: Booking): void {
    if (!booking || (!booking._id && !booking.id)) return;

    const bookingId = booking._id || booking.id || '';
    
    // Navigate to secure cancellation page with booking details
    this.router.navigate(['/booking-cancel', bookingId], {
      state: { 
        serialKey: booking.serialKey,
        guestName: booking.guestName 
      }
    });
  }

  canCancel(booking: Booking | null): boolean {
    if (!booking) return false;
    const status = booking.status.toLowerCase();
    return status === 'confirmed' || status === 'pending';
  }

  reset(): void {
    console.log('🔄 [Booking Lookup] Resetting to search interface');
    this.serialKey = '';
    // Navigate back to search (this will reload the component and clear the booking display)
    this.router.navigate(['/booking-lookup'], { replaceUrl: true }).then(() => {
      // Force reload by navigating to same route
      window.location.reload();
    });
  }

  navigateToHome(): void {
    console.log('🏠 [Booking Lookup] Navigating to home page');
    this.router.navigate(['/home']);
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'confirmed': 'status-confirmed',
      'pending': 'status-pending',
      'cancelled': 'status-cancelled',
      'completed': 'status-completed'
    };
    return statusMap[status.toLowerCase()] || '';
  }

  downloadPDF(booking: Booking): void {
    console.log('📄 [Booking Lookup] Generating PDF');
    
    // Create HTML content for PDF with base64 logo
    const logoHtml = this.logoBase64 
      ? `<div style="text-align: center; margin-bottom: 30px;">
           <img src="${this.logoBase64}" alt="Eventide Logo" style="width: 150px; height: auto; margin-bottom: 20px;">
         </div>`
      : '';
    
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Details - ${booking.serialKey}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
            img { max-width: 150px !important; }
          }
        </style>
      </head>
      <body>
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
          ${logoHtml}
          <p style="text-align: center; color: #666; margin-bottom: 30px;">Serial Key: ${booking.serialKey}</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Guest Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.guestName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.guestEmail}</td></tr>
              ${booking.guestPhone ? `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.guestPhone}</td></tr>` : ''}
            </table>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Booking Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(booking.startTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(booking.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date(booking.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td></tr>
              ${booking.duration ? `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Duration:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${booking.duration} minutes</td></tr>` : ''}
              <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Status:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;"><span style="background: #4caf50; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px;">${booking.status.toUpperCase()}</span></td></tr>
            </table>
          </div>
          
          
          ${booking.notes ? `
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
              <h2 style="color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Notes</h2>
              <p style="color: #666;">${booking.notes}</p>
            </div>
          ` : ''}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 100);
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
    }
    
    console.log('✅ [Booking Lookup] PDF generation initiated');
  }

  downloadWord(booking: Booking): void {
    console.log('📄 [Booking Lookup] Generating Word document');
    
    // Create logo HTML with base64 and fixed size
    const logoHtml = this.logoBase64
      ? `<div style="text-align: center; margin-bottom: 30px;">
           <img src="${this.logoBase64}" alt="Eventide Logo" width="150" height="auto">
         </div>`
      : '';
    
    // Create HTML content for Word
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Booking Details</title>
        <style>
          img { width: 150px !important; height: auto !important; }
        </style>
      </head>
      <body>
        ${logoHtml}
        <h1 style="color: #1976d2; text-align: center;">Booking Details</h1>
        <p style="text-align: center; color: #666;">Serial Key: ${booking.serialKey}</p>
        
        <h2 style="color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Guest Information</h2>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
          <tr><td><strong>Name:</strong></td><td>${booking.guestName}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${booking.guestEmail}</td></tr>
          ${booking.guestPhone ? `<tr><td><strong>Phone:</strong></td><td>${booking.guestPhone}</td></tr>` : ''}
        </table>
        
        <h2 style="color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Booking Information</h2>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
          <tr><td><strong>Date:</strong></td><td>${new Date(booking.startTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
          <tr><td><strong>Time:</strong></td><td>${new Date(booking.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date(booking.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td></tr>
          ${booking.duration ? `<tr><td><strong>Duration:</strong></td><td>${booking.duration} minutes</td></tr>` : ''}
          <tr><td><strong>Status:</strong></td><td>${booking.status.toUpperCase()}</td></tr>
        </table>
        
        ${booking.notes ? `
          <h2 style="color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px;">Notes</h2>
          <p>${booking.notes}</p>
        ` : ''}
      </body>
      </html>
    `;
    
    // Create blob and download
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `booking-${booking.serialKey}.doc`;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ [Booking Lookup] Word document downloaded');
  }
}
