import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { SettingsPreferencesHandler } from '../../services/settings-preferences-handler.service';

@Component({
  selector: 'app-booking-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './booking-tab.component.html',
  styleUrl: './booking-tab.component.scss',
})
export class BookingTabComponent {
  @Input() onSave!: () => void;

  constructor(public prefsHandler: SettingsPreferencesHandler) {}
}
