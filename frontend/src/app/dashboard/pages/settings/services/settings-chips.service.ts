import { Injectable, computed } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipInputEvent } from '@angular/material/chips';
import { SettingsBusinessService } from './settings-business.service';

/**
 * Handles chip input operations for services, categories, and durations
 */
@Injectable()
export class SettingsChipsService {
  // Computed arrays for chip display
  servicesArray = computed(() => this.businessService.services());
  categoriesArray = computed(() => this.businessService.categories());
  durationsArray = computed(() => this.businessService.availableDurations().map((d) => d.toString()));

  constructor(
    private businessService: SettingsBusinessService,
    private snackBar: MatSnackBar,
  ) {}

  // Service chip methods
  addService(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.businessService.services().includes(value)) {
      this.businessService.services.update((services) => [...services, value]);
    }
    event.chipInput!.clear();
  }

  removeService(service: string): void {
    this.businessService.services.update((services) => services.filter((s) => s !== service));
  }

  onServiceSelected(event: any): void {
    const value = event.option.value.trim();
    if (value && !this.businessService.services().includes(value)) {
      this.businessService.services.update((services) => [...services, value]);
    }
  }

  // Category chip methods
  addCategory(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.businessService.categories().includes(value)) {
      this.businessService.categories.update((categories) => [...categories, value]);
    }
    event.chipInput!.clear();
  }

  removeCategory(category: string): void {
    this.businessService.categories.update((categories) => categories.filter((c) => c !== category));
  }

  onCategorySelected(event: any): void {
    const value = event.option.value.trim();
    if (value && !this.businessService.categories().includes(value)) {
      this.businessService.categories.update((categories) => [...categories, value]);
    }
  }

  // Duration chip methods
  addDuration(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      const duration = parseInt(value);
      if (!isNaN(duration) && duration > 0 && !this.businessService.availableDurations().includes(duration)) {
        this.businessService.availableDurations.update((durations) => [...durations, duration]);
      } else if (isNaN(duration) || duration <= 0) {
        this.snackBar.open('Duration must be a valid positive number', 'Close', { duration: 3000 });
      }
    }
    event.chipInput!.clear();
  }

  removeDuration(duration: string): void {
    const durationNum = parseInt(duration);
    this.businessService.availableDurations.update((durations) => durations.filter((d) => d !== durationNum));
  }

  onDurationSelected(event: any): void {
    const duration = parseInt(event.option.value);
    if (!isNaN(duration) && duration > 0 && !this.businessService.availableDurations().includes(duration)) {
      this.businessService.availableDurations.update((durations) => [...durations, duration]);
    }
  }
}
