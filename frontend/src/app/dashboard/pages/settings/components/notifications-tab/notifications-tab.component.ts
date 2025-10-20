import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { SettingsPreferencesHandler } from '../../services/settings-preferences-handler.service';

@Component({
  selector: 'app-notifications-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSlideToggleModule,
    MatButtonModule,
  ],
  templateUrl: './notifications-tab.component.html',
  styleUrl: './notifications-tab.component.scss',
})
export class NotificationsTabComponent {
  @Input() onSave!: () => void;

  constructor(public prefsHandler: SettingsPreferencesHandler) {}
}
