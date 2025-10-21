import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { SettingsPreferencesHandlerService } from '../../services/settings-preferences-handler.service';

@Component({
  selector: 'app-calendar-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './calendar-tab.component.html',
  styleUrl: './calendar-tab.component.scss',
})
export class CalendarTabComponent {
  constructor(public prefsHandler: SettingsPreferencesHandlerService) {}
}
