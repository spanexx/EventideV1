import { Injectable } from '@angular/core';
import { Availability } from '../../models/availability.models';
import { SnackbarService } from '../../../shared/services/snackbar.service';

@Injectable({
  providedIn: 'root'
})
export class AvailabilityClipboardService {
  private clipboard: Availability[] = [];

  constructor(private snackbarService: SnackbarService) {}

  /**
   * Copy availability slots to the clipboard
   * @param slots The slots to copy
   */
  copySlots(slots: Availability[]): void {
    this.clipboard = [...slots];
    console.log('Copied slots to clipboard:', slots);
  }

  /**
   * Get the slots currently in the clipboard
   * @returns Array of availability slots
   */
  getClipboardSlots(): Availability[] {
    return [...this.clipboard];
  }

  /**
   * Check if there are slots in the clipboard
   * @returns True if there are slots in the clipboard, false otherwise
   */
  hasSlots(): boolean {
    return this.clipboard.length > 0;
  }

  /**
   * Clear the clipboard
   */
  clear(): void {
    this.clipboard = [];
  }
}