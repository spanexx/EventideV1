import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, Observable } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import * as BookingActions from '../../store-bookings/actions/booking.actions';
import * as BookingSelectors from '../../store-bookings/selectors/booking.selectors';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Booking } from '../../../shared/models/booking.models';

interface BookingTiming {
  dateStr: string;
  startTimeStr: string;
  endTimeStr: string;
}

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
      
      <div class="action-buttons" *ngIf="!error && booking">
        <button 
          mat-icon-button 
          color="primary"
          matTooltip="Download as PDF"
          (click)="downloadPDF()"
        >
          <mat-icon>picture_as_pdf</mat-icon>
        </button>
        
        <button 
          mat-icon-button
          color="primary"
          matTooltip="Download as Word Document"
          (click)="downloadWord()"
        >
          <mat-icon>description</mat-icon>
        </button>
        
        <button 
          mat-icon-button
          color="primary"
          matTooltip="Save to Calendar"
          (click)="addToCalendar()"
        >
          <mat-icon>event</mat-icon>
        </button>
      </div>
      
      <button 
        mat-raised-button 
        color="primary" 
        (click)="finish()"
        class="finish-button"
      >
        {{ error ? 'Try Again' : 'Finish' }}
      </button>
    </div>
  `,
  styles: [`
    .booking-confirmation {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      text-align: center;
      padding: 20px;
    }
    
    .success-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #4caf50;
      margin-bottom: 10px;
    }
    
    .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #f44336;
      margin-bottom: 10px;
    }
    
    .booking-details, .error-details {
      background: #f5f5f5;
      padding: 24px;
      border-radius: 12px;
      width: 100%;
      max-width: 400px;
      text-align: left;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .qr-code-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #ddd;
      text-align: center;
    }
    
    .qr-code-section h4 {
      margin-bottom: 16px;
      color: #333;
    }
    
    .qr-code-image {
      max-width: 200px;
      height: auto;
      margin: 16px 0;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .qr-note {
      font-size: 14px;
      color: #666;
      margin-top: 8px;
    }
    
    .qr-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-top: 24px;
      color: #666;
    }
    
    .booking-details h3 {
      margin-top: 0;
      color: #333;
      font-size: 1.2em;
    }
    
    .booking-details p {
      margin: 12px 0;
      line-height: 1.4;
    }
    
    .error-details p {
      color: #f44336;
      margin: 0;
    }
    
    .action-buttons {
      display: flex;
      gap: 16px;
      margin: 24px 0;
    }
    
    .action-buttons button {
      background: #f5f5f5;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      transition: all 0.2s ease;
    }
    
    .action-buttons button:hover {
      background: #e0e0e0;
      transform: scale(1.05);
    }
    
    .action-buttons mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
    
    .finish-button {
      margin-top: 16px;
      padding: 8px 32px;
      font-size: 16px;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ]
})
export class BookingConfirmationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private providerId!: string;
  private logoBase64: string = '';
  
  booking$!: Observable<Booking | null>;
  qrCode$!: Observable<string | null>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  
  booking: Booking | null = null;
  qrCode: string | null = null;
  error: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private store: Store
  ) {
    this.booking$ = this.store.select(BookingSelectors.selectBooking);
    this.qrCode$ = this.store.select(BookingSelectors.selectQRCode);
    this.loading$ = this.store.select(BookingSelectors.selectBookingLoading);
    this.error$ = this.store.select(BookingSelectors.selectBookingError);
  }

  async ngOnInit() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔍 [Booking Confirmation] Component initialized');
    console.log('═══════════════════════════════════════════════════');
    
    this.providerId = this.route.parent?.snapshot.paramMap.get('providerId') || '';
    console.log('📋 [Booking Confirmation] Provider ID from route:', this.providerId);
    
    await this.loadLogo();
    
    this.booking$.pipe(takeUntil(this.destroy$)).subscribe(booking => {
      console.log('📦 [Booking Confirmation] Booking data received:', booking);
      this.booking = booking;
    });
    
    this.qrCode$.pipe(takeUntil(this.destroy$)).subscribe(qrCode => {
      console.log('📦 [Booking Confirmation] QR code received:', qrCode ? 'Present' : 'None');
      this.qrCode = qrCode;
    });
    
    this.error$.pipe(takeUntil(this.destroy$)).subscribe(error => {
      if (error) console.error('❌ [Booking Confirmation] Error:', error);
      this.error = error;
    });
    
    this.booking$.pipe(
      filter((booking): booking is Booking & { serialKey: string } => 
        !!booking && typeof booking.serialKey === 'string'),
      take(1)
    ).subscribe(booking => {
      console.log('📤 [Booking Confirmation] Requesting QR code for:', booking.serialKey);
      this.store.dispatch(BookingActions.getQRCode({ serialKey: booking.serialKey }));
    });
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadLogo(): Promise<void> {
    try {
      const response = await fetch('/assets/images/logo-porter.png');
      const blob = await response.blob();
      this.logoBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      console.log('📋 [Booking Confirmation] Logo loaded successfully');
    } catch (error) {
      console.error('❌ [Booking Confirmation] Logo load failed:', error);
    }
  }

  private getDocumentStyles(): string {
    return `
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
      img { max-width: 150px !important; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      td { padding: 12px; border: 1px solid #ddd; }
      h1 { color: #1976d2; text-align: center; margin-bottom: 30px; }
      h2 { color: #333; border-bottom: 2px solid #1976d2; padding-bottom: 10px; margin-top: 30px; }
      .qr-section { text-align: center; margin-top: 40px; }
      .qr-section img { max-width: 200px !important; }
      .notes { color: #666; font-style: italic; margin-top: 20px; }
    `;
  }

  private getBookingTiming(booking: Booking): BookingTiming {
    const startDate = new Date(booking.startTime);
    const endDate = new Date(booking.endTime);
    
    return {
      dateStr: startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      startTimeStr: startDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      endTimeStr: endDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }

  private generateBookingHtml(booking: Booking): string {
    const timing = this.getBookingTiming(booking);
    const parts: string[] = [];
    
    if (this.logoBase64) {
      parts.push('<div style="text-align: center; margin-bottom: 20px;">');
      parts.push('<img src="' + this.logoBase64 + '" alt="Logo" style="max-width: 150px;">');
      parts.push('</div>');
    }
    
    parts.push('<h1>Booking Confirmation</h1>');
    parts.push('<p style="text-align: center; color: #666;">Serial Key: ' + booking.serialKey + '</p>');
    
    parts.push('<div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">');
    
    // Guest Information
    parts.push('<h2>Guest Information</h2>');
    parts.push('<table>');
    parts.push('<tr><td style="width: 150px;"><strong>Name:</strong></td><td>' + booking.guestName + '</td></tr>');
    parts.push('<tr><td><strong>Email:</strong></td><td>' + booking.guestEmail + '</td></tr>');
    if (booking.guestPhone) {
      parts.push('<tr><td><strong>Phone:</strong></td><td>' + booking.guestPhone + '</td></tr>');
    }
    parts.push('</table>');
    
    // Appointment Details
    parts.push('<h2>Appointment Details</h2>');
    parts.push('<table>');
    parts.push('<tr><td style="width: 150px;"><strong>Date:</strong></td><td>' + timing.dateStr + '</td></tr>');
    parts.push('<tr><td><strong>Time:</strong></td><td>' + timing.startTimeStr + ' - ' + timing.endTimeStr + '</td></tr>');
    parts.push('<tr><td><strong>Duration:</strong></td><td>' + booking.duration + ' minutes</td></tr>');
    parts.push('<tr><td><strong>Status:</strong></td><td>' + booking.status.toUpperCase() + '</td></tr>');
    parts.push('</table>');
    
    if (booking.notes) {
      parts.push('<h2>Notes</h2>');
      parts.push('<p class="notes">' + booking.notes + '</p>');
    }
    
    if (this.qrCode) {
      parts.push('<div class="qr-section">');
      parts.push('<h2>QR Code</h2>');
      parts.push('<img src="' + this.qrCode + '" alt="QR Code">');
      parts.push('<p style="color: #666; font-size: 12px;">Present this QR code for easy check-in</p>');
      parts.push('</div>');
    }
    
    parts.push('</div>');
    return parts.join('\n');
  }

  private generateCompleteHtml(booking: Booking, type: 'pdf' | 'word'): string {
    const xmlns = type === 'word' 
      ? 'xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"'
      : '';
    
    return [
      '<!DOCTYPE html>',
      `<html ${xmlns}>`,
      '<head>',
      '<meta charset="utf-8">',
      `<title>Booking Details - ${booking.serialKey}</title>`,
      '<style>',
      this.getDocumentStyles(),
      '</style>',
      '</head>',
      '<body>',
      this.generateBookingHtml(booking),
      '</body>',
      '</html>'
    ].join('\n');
  }

  async downloadPDF() {
    if (!this.booking) return;
    
    console.log('📄 [Booking Confirmation] Generating PDF');
    const htmlContent = this.generateCompleteHtml(this.booking, 'pdf');
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      await new Promise(resolve => setTimeout(resolve, 500));
      printWindow.print();
      printWindow.close();
    }
    
    console.log('✅ [Booking Confirmation] PDF generated');
  }

  downloadWord() {
    if (!this.booking) return;
    
    console.log('📄 [Booking Confirmation] Generating Word document');
    const htmlContent = this.generateCompleteHtml(this.booking, 'word');
    
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `booking-${this.booking.serialKey}.doc`;
    link.click();
    URL.revokeObjectURL(url);
    
    console.log('✅ [Booking Confirmation] Word document downloaded');
  }

  addToCalendar() {
    // TODO: Implement calendar integration
    console.log('📅 [Booking Confirmation] Calendar integration not implemented');
  }

  finish() {
    console.log('🎯 [Booking Confirmation] Finishing booking process');
    
    if (this.error && this.providerId) {
      console.log('🚀 [Booking Confirmation] Retrying - returning to guest information');
      this.router.navigate(['/booking', this.providerId, 'information']);
    } else {
      console.log('🚀 [Booking Confirmation] Success - returning to home');
      this.router.navigate(['/']);
    }
  }
}
