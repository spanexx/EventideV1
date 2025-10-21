import { Injectable, signal, computed } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

/**
 * Handles chip input operations for services, categories, and durations
 */
@Injectable({
  providedIn: 'root',
})
export class SettingsChipsService {
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  constructor(private snackBar: MatSnackBar) {}

  // Service chip operations
  addService(services: string[], event: MatChipInputEvent): string[] {
    const value = (event.value || '').trim();
    if (value && !services.includes(value)) {
      services = [...services, value];
    }
    event.chipInput!.clear();
    return services;
  }

  removeService(services: string[], service: string): string[] {
    return services.filter((s) => s !== service);
  }

  // Category chip operations
  addCategory(categories: string[], event: MatChipInputEvent): string[] {
    const value = (event.value || '').trim();
    if (value && !categories.includes(value)) {
      categories = [...categories, value];
    }
    event.chipInput!.clear();
    return categories;
  }

  removeCategory(categories: string[], category: string): string[] {
    return categories.filter((c) => c !== category);
  }

  // Duration chip operations
  addDuration(durations: number[], event: MatChipInputEvent): number[] {
    const value = (event.value || '').trim();
    if (value) {
      const duration = parseInt(value);
      if (!isNaN(duration) && duration > 0 && !durations.includes(duration)) {
        durations = [...durations, duration];
      } else if (isNaN(duration) || duration <= 0) {
        this.snackBar.open('Duration must be a valid positive number', 'Close', { duration: 3000 });
      }
    }
    event.chipInput!.clear();
    return durations;
  }

  removeDuration(durations: number[], duration: string): number[] {
    const durationNum = parseInt(duration);
    return durations.filter((d) => d !== durationNum);
  }

  // Autocomplete selection handlers
  onCategorySelected(categories: string[], value: string): string[] {
    const trimmedValue = value.trim();
    if (trimmedValue && !categories.includes(trimmedValue)) {
      return [...categories, trimmedValue];
    }
    return categories;
  }

  onServiceSelected(services: string[], value: string): string[] {
    const trimmedValue = value.trim();
    if (trimmedValue && !services.includes(trimmedValue)) {
      return [...services, trimmedValue];
    }
    return services;
  }

  onDurationSelected(durations: number[], value: number): number[] {
    if (!isNaN(value) && value > 0 && !durations.includes(value)) {
      return [...durations, value];
    }
    return durations;
  }
}
