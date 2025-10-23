import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserPreferences } from '../../settings.service';

@Component({
  selector: 'app-calendar-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './calendar-settings.component.html',
  styleUrl: './calendar-settings.component.scss',
})
export class CalendarSettingsComponent {
  @Input() preferences?: UserPreferences;
  @Input() loading!: boolean;
  @Output() preferenceChange = new EventEmitter<{key: string, value: any}>();
  @Output() workingHoursChange = new EventEmitter<{type: string, value: string}>();
  @Output() save = new EventEmitter<void>();
}