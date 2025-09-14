import { Injectable } from '@angular/core';
import { Availability } from '../../models/availability.models';

export interface CopiedSlot {
  startTime: Date;
  endTime: Date;
  duration: number;
  isBooked: boolean;
  type: 'recurring' | 'one_off';
}

@Injectable({
  providedIn: 'root'
})
export class AvailabilityClipboardService {
  private readonly STORAGE_KEY = 'eventide_availability_clipboard';
  
  /**
   * Copy a single availability slot to clipboard
   * @param slot The availability slot to copy
   */
  copySlots(slots: Availability[]): void {
    const copiedSlots: CopiedSlot[] = slots.map(slot => ({
      startTime: new Date(slot.startTime),
      endTime: new Date(slot.endTime),
      duration: slot.duration,
      isBooked: slot.isBooked,
      type: slot.type
    }));
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(copiedSlots));
      console.log('Slots copied to clipboard:', copiedSlots);
    } catch (error) {
      console.error('Failed to copy slots to clipboard:', error);
    }
  }
}
