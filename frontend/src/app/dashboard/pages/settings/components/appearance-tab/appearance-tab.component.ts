import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { SettingsPreferencesHandlerService } from '../../services/settings-preferences-handler.service';

@Component({
  selector: 'app-appearance-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './appearance-tab.component.html',
  styleUrl: './appearance-tab.component.scss',
})
export class AppearanceTabComponent {
  constructor(public prefsHandler: SettingsPreferencesHandlerService) {}
}
