import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserPreferences } from '../../settings.service';

@Component({
  selector: 'app-localization-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './localization-settings.component.html',
  styleUrl: './localization-settings.component.scss',
})
export class LocalizationSettingsComponent {
  @Input() preferences?: UserPreferences;
  @Input() loading!: boolean;
  @Output() preferenceChange = new EventEmitter<{key: string, value: any}>();
  @Output() save = new EventEmitter<void>();
}