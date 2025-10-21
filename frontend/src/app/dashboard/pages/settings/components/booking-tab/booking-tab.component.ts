import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { SettingsPreferencesHandlerService } from '../../services/settings-preferences-handler.service';

@Component({
  selector: 'app-booking-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSlideToggleModule,
    MatButtonModule,
  ],
  templateUrl: './booking-tab.component.html',
  styleUrl: './booking-tab.component.scss',
})
export class BookingTabComponent {
  constructor(public prefsHandler: SettingsPreferencesHandlerService) {}
}
