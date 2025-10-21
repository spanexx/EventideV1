import { Component, computed } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipInputEvent } from '@angular/material/chips';
import { SettingsBusinessService } from '../../services/settings-business.service';
import { SettingsChipsService } from '../../services/settings-chips.service';

@Component({
  selector: 'app-business-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AsyncPipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatAutocompleteModule,
    MatButtonModule,
  ],
  templateUrl: './business-tab.component.html',
  styleUrls: ['./business-tab.component.scss', '../../shared-tab-styles.scss']
})
export class BusinessTabComponent {
  commonCategories = [
    'Technology',
    'Marketing',
    'Design',
    'Consulting',
    'Education',
    'Health & Wellness',
    'Finance',
    'Legal',
    'Real Estate',
    'Entertainment'
  ];

  // Alias to match template usage
  get industryCategories() { return this.commonCategories; }

  commonServices = [
    'Project Consultation',
    'Strategic Planning',
    'Software Development',
    'Web Design',
    'Content Creation',
    'SEO Optimization',
    'Legal Consultation',
    'Coaching Session'
  ];

  commonDurations = [15, 30, 45, 60, 90, 120];

  servicesArray = computed(() => this.businessService.services());
  categoriesArray = computed(() => this.businessService.categories());
  durationsArray = computed(() => this.businessService.availableDurations().map((d: number) => d.toString()));

  constructor(
    public businessService: SettingsBusinessService,
    public chipsService: SettingsChipsService,
  ) {}

  addService(event: MatChipInputEvent): void {
    this.businessService.services.set(
      this.chipsService.addService(this.businessService.services(), event)
    );
  }

  removeService(service: string): void {
    this.businessService.services.set(
      this.chipsService.removeService(this.businessService.services(), service)
    );
  }

  addCategory(event: MatChipInputEvent): void {
    this.businessService.categories.set(
      this.chipsService.addCategory(this.businessService.categories(), event)
    );
  }

  removeCategory(category: string): void {
    this.businessService.categories.set(
      this.chipsService.removeCategory(this.businessService.categories(), category)
    );
  }

  addDuration(event: MatChipInputEvent): void {
    this.businessService.availableDurations.set(
      this.chipsService.addDuration(this.businessService.availableDurations(), event)
    );
  }

  removeDuration(duration: string): void {
    this.businessService.availableDurations.set(
      this.chipsService.removeDuration(this.businessService.availableDurations(), duration)
    );
  }

  onCategorySelected(event: any): void {
    const value = event.option.value.trim();
    this.businessService.categories.set(
      this.chipsService.onCategorySelected(this.businessService.categories(), value)
    );
  }

  onServiceSelected(event: any): void {
    const value = event.option.value.trim();
    this.businessService.services.set(
      this.chipsService.onServiceSelected(this.businessService.services(), value)
    );
  }

  onDurationSelected(event: any): void {
    const duration = parseInt(event.option.value);
    this.businessService.availableDurations.set(
      this.chipsService.onDurationSelected(this.businessService.availableDurations(), duration)
    );
  }
}
