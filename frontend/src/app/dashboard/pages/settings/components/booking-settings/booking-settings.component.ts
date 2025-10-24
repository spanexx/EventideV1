import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserPreferences } from '../../settings.service';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-booking-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
  ],
  templateUrl: './booking-settings.component.html',
  styleUrl: './booking-settings.component.scss',
})
export class BookingSettingsComponent implements OnChanges {
  @Input() preferences?: UserPreferences;
  @Input() loading!: boolean;
  @Output() preferenceChange = new EventEmitter<{key: string, value: any}>();
  @Output() hourlyRateChange = new EventEmitter<number>();
  @Output() paymentMethodAdded = new EventEmitter<string>();
  @Output() paymentMethodRemoved = new EventEmitter<string>();
  @Output() save = new EventEmitter<void>();

  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  paymentMethodSuggestions = ['card', 'bank_transfer', 'cash', 'paypal'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['preferences']) {
      const val = this.preferences?.payment?.requirePaymentForBookings;
      console.log('🧩 [BookingSettingsComponent] Input preferences changed. requirePaymentForBookings =', val);
    }
  }

  onHourlyRateChange(value: number | string): void {
    const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
    const hourlyRate = isNaN(parsed as number) || (parsed as number) < 0 ? 0 : (parsed as number);
    this.hourlyRateChange.emit(hourlyRate);
  }

  addPaymentMethod(event: MatChipInputEvent): void {
    const input = (event.value || '').trim().toLowerCase();
    if (!input) return;
    const existing = this.preferences?.payment?.acceptedPaymentMethods || [];
    if (existing.includes(input)) return;
    this.paymentMethodAdded.emit(input);
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removePaymentMethod(method: string): void {
    this.paymentMethodRemoved.emit(method);
  }
}