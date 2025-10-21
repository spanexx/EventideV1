import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { SettingsPreferencesHandlerService } from '../../services/settings-preferences-handler.service';

@Component({
  selector: 'app-notifications-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatButtonModule,
  ],
  templateUrl: './notifications-tab.component.html',
  styleUrl: './notifications-tab.component.scss',
})
export class NotificationsTabComponent {
  constructor(public prefsHandler: SettingsPreferencesHandlerService) {}
}
