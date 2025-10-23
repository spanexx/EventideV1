import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserPreferences } from '../../settings.service';

interface PreferenceChangeEvent {
  key: string;
  value: any;
}

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.scss',
})
export class NotificationSettingsComponent {
  @Input() preferences?: UserPreferences;
  @Input() loading!: boolean;
  @Output() preferenceChange = new EventEmitter<PreferenceChangeEvent>();
  @Output() save = new EventEmitter<void>();

  updateNestedPreference(key: string, nestedKey: string, value: any): void {
    this.preferenceChange.emit({key, value: {[nestedKey]: value}});
  }
}