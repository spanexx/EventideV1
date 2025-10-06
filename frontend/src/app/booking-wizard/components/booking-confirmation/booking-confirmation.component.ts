import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import * as BookingActions from '../../store-bookings/actions/booking.actions';
import * as BookingSelectors from '../../store-bookings/selectors/booking.selectors';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-booking-confirmation',
  template: `
    <div class="booking-confirmation">
      <mat-icon class="success-icon" *ngIf="!error">check_circle</mat-icon>
      <mat-icon class="error-icon" *ngIf="error">error</mat-icon>
      
      <h2 *ngIf="!error">Booking Confirmed!</h2>
      <h2 *ngIf="error">Booking Failed</h2>
      
      <p *ngIf="!error">Your appointment has been successfully scheduled.</p>
      <p *ngIf="error">There was an error processing your booking. Please try again.</p>
      
      <div class="booking-details" *ngIf="!error && booking">
        <h3>Appointment Details</h3>
        <p><strong>Booking ID:</strong> {{ booking.serialKey }}</p>
        <p><strong>Date:</strong> {{ booking.startTime | date:'fullDate' }}</p>
        <p><strong>Time:</strong> {{ booking.startTime | date:'shortTime' }} - {{ booking.endTime | date:'shortTime' }}</p>
        <p><strong>Duration:</strong> {{ booking.duration }} minutes</p>
        <p><strong>Name:</strong> {{ booking.guestName }}</p>
        <p><strong>Email:</strong> {{ booking.guestEmail }}</p>
        <p *ngIf="booking.guestPhone"><strong>Phone:</strong> {{ booking.guestPhone }}</p>
        
        <div class="qr-code-section" *ngIf="qrCode">
          <h4>Your QR Code</h4>
          <img [src]="qrCode" alt="Booking QR Code" class="qr-code-image">
          <p class="qr-note">Save this QR code for easy check-in</p>
        </div>
        
        <div *ngIf="!qrCode && (loading$ | async)" class="qr-loading">
          <mat-spinner diameter="30"></mat-spinner>
          <span>Generating QR code...</span>
        </div>
      </div>
      
      <div *ngIf="error" class="error-details">
        <p>{{ error }}</p>
      </div>
      
      <div class="actions" *ngIf="!error && booking">
        <button mat-raised-button color="accent" (click)="downloadPDF()">
          <mat-icon>picture_as_pdf</mat-icon>
          Download PDF
        </button>
        <button mat-raised-button color="accent" (click)="downloadWord()">
          <mat-icon>description</mat-icon>
          Download Word
        </button>
      </div>
      
      <button mat-raised-button color="primary" (click)="finish()">{{ error ? 'Try Again' : 'Finish' }}</button>
    </div>
  `,
  styles: [`
    .booking-confirmation {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      text-align: center;
    }
    
    .success-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #4caf50;
    }
    
    .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #f44336;
    }
    
    .booking-details, .error-details {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      width: 100%;
      max-width: 400px;
      text-align: left;
    }
    
    .qr-code-section {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
    }
    
    .qr-code-section h4 {
      margin-bottom: 10px;
    }
    
    .qr-code-image {
      max-width: 200px;
      height: auto;
      margin: 10px 0;
    }
    
    .qr-note {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    
    .qr-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 20px;
      color: #666;
    }
    
    .booking-details h3 {
      margin-top: 0;
    }
    
    .booking-details p {
      margin: 8px 0;
    }
    
    .error-details p {
      color: #f44336;
      margin: 0;
    }
    
    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .actions button {
      display: flex;
      align-items: center;
      gap: 5px;
    }
  `],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ]
})
export class BookingConfirmationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private providerId!: string;
  
  booking$!: any;
  qrCode$!: any;
  loading$!: any;
  error$!: any;
  
  booking: any | null = null;
  qrCode: string | null = null;
  error: string | null = null;
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store
  ) {
    // Initialize observables
    this.booking$ = this.store.select(BookingSelectors.selectBooking);
    this.qrCode$ = this.store.select(BookingSelectors.selectQRCode);
    this.loading$ = this.store.select(BookingSelectors.selectBookingLoading);
    this.error$ = this.store.select(BookingSelectors.selectBookingError);
  }
  
  ngOnInit() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔍 [Booking Confirmation] Component initialized');
    console.log('═══════════════════════════════════════════════════');
    
    // Get providerId from parent route
    this.providerId = this.route.parent?.snapshot.paramMap.get('providerId') || '';
    console.log('📋 [Booking Confirmation] Provider ID from route:', this.providerId);
    
    // Subscribe to booking
    this.booking$.pipe(takeUntil(this.destroy$)).subscribe((booking: any) => {
      console.log('📦 [Booking Confirmation] Booking data received:', booking);
      this.booking = booking;
    });
    
    // Subscribe to QR code
    this.qrCode$.pipe(takeUntil(this.destroy$)).subscribe((qrCode: string | null) => {
      console.log('📦 [Booking Confirmation] QR code received:', qrCode ? 'QR code data present' : 'No QR code');
      this.qrCode = qrCode;
    });
    
    // Subscribe to error
    this.error$.pipe(takeUntil(this.destroy$)).subscribe((error: string | null) => {
      if (error) {
        console.error('❌ [Booking Confirmation] Error received:', error);
      }
      this.error = error;
    });
    
    // Load QR code if booking exists
    this.booking$
      .pipe(
        filter((booking: any) => !!booking?.serialKey),
        take(1)
      )
      .subscribe((booking: any) => {
        console.log('📤 [Booking Confirmation] Dispatching getQRCode action for serial key:', booking.serialKey);
        this.store.dispatch(BookingActions.getQRCode({ 
          serialKey: booking.serialKey 
        }));
      });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  downloadPDF() {
    if (!this.booking) return;
    
    console.log('📄 [Booking Confirmation] Generating PDF');
    
    // Create a simple HTML content for PDF
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #4caf50;">Booking Confirmation</h1>
        <p style="font-size: 16px; margin-bottom: 30px;">Your appointment has been successfully scheduled.</p>
        
        <h2>Appointment Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Booking ID:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${this.booking.serialKey}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(this.booking.startTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${new Date(this.booking.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date(this.booking.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Duration:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${this.booking.duration} minutes</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${this.booking.guestName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${this.booking.guestEmail}</td></tr>
          ${this.booking.guestPhone ? `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${this.booking.guestPhone}</td></tr>` : ''}
        </table>
        
        ${this.qrCode ? `
          <div style="margin-top: 30px; text-align: center;">
            <h3>QR Code</h3>
            <img src="${this.qrCode}" alt="Booking QR Code" style="max-width: 200px;" />
            <p style="font-size: 12px; color: #666;">Save this QR code for easy check-in</p>
          </div>
        ` : ''}
      </div>
    `;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
    
    console.log('✅ [Booking Confirmation] PDF generation initiated');
  }
  
  downloadWord() {
    if (!this.booking) return;
    
    console.log('📄 [Booking Confirmation] Generating Word document');
    
    // Create HTML content for Word
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Booking Confirmation</title></head>
      <body>
        <h1 style="color: #4caf50;">Booking Confirmation</h1>
        <p style="font-size: 16px;">Your appointment has been successfully scheduled.</p>
        
        <h2>Appointment Details</h2>
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
          <tr><td><strong>Booking ID:</strong></td><td>${this.booking.serialKey}</td></tr>
          <tr><td><strong>Date:</strong></td><td>${new Date(this.booking.startTime).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
          <tr><td><strong>Time:</strong></td><td>${new Date(this.booking.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${new Date(this.booking.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td></tr>
          <tr><td><strong>Duration:</strong></td><td>${this.booking.duration} minutes</td></tr>
          <tr><td><strong>Name:</strong></td><td>${this.booking.guestName}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${this.booking.guestEmail}</td></tr>
          ${this.booking.guestPhone ? `<tr><td><strong>Phone:</strong></td><td>${this.booking.guestPhone}</td></tr>` : ''}
        </table>
        
        ${this.qrCode ? `
          <div style="margin-top: 30px;">
            <h3>QR Code</h3>
            <img src="${this.qrCode}" alt="Booking QR Code" style="max-width: 200px;" />
            <p style="font-size: 12px;">Save this QR code for easy check-in</p>
          </div>
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
    link.download = `booking-confirmation-${this.booking.serialKey}.doc`;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ [Booking Confirmation] Word document downloaded');
  }
  
  finish() {
    console.log('🎯 [Booking Confirmation] finish() called');
    console.log('📋 [Booking Confirmation] Has error:', !!this.error);
    console.log('📋 [Booking Confirmation] Provider ID:', this.providerId);
    
    if (this.error && this.providerId) {
      // If there was an error, go back to the guest information form
      console.log('🚀 [Booking Confirmation] Navigating back to information (error retry)');
      this.router.navigate(['/booking', this.providerId, 'information']);
    } else {
      // If successful, navigate back to the home page
      console.log('🚀 [Booking Confirmation] Navigating to home page (success)');
      this.router.navigate(['/']);
    }
  }
}