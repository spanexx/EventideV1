import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Availability } from '../../models/availability.models';
import { PendingChangesService } from './pending-changes.service';
import { Change } from './pending-changes.interface';

@Injectable({
  providedIn: 'root'
})
export class DragResizeService {
  constructor(
    private pendingChangesService: PendingChangesService,
    private store: Store
  ) {}

  /** 
   * Handle event resize operations with pending changes
   * @param resizeInfo The resize information
   * @param availability Current availability data
   */
  handleEventResize(resizeInfo: any, availability: Availability[]): void {
    const slot = availability.find(a => a.id === resizeInfo.event.id);
    if (slot) {
      // Create updated slot with new times
      const updatedSlot = {
        ...slot,
        startTime: resizeInfo.event.start,
        endTime: resizeInfo.event.end,
        duration: this.calculateDuration(resizeInfo.event.start, resizeInfo.event.end)
      };

      // Create a change record
      const change: Change = {
        id: `resize-${slot.id}-${Date.now()}`,
        type: 'resize',
        entityId: slot.id,
        entity: updatedSlot,
        previousEntity: { ...slot },
        timestamp: new Date()
      };

      // Add the change to pending changes
      this.pendingChangesService.addChange(change);
      
      // Update the current state
      const currentState = this.pendingChangesService.getCurrentState();
      const updatedState = currentState.map(s => s.id === slot.id ? updatedSlot : s);
      this.pendingChangesService.updateCurrentState(updatedState);
    }
  }

  /** 
   * Handle event drop operations with pending changes
   * @param dropInfo The drop information
   * @param availability Current availability data
   */
  handleEventDrop(dropInfo: any, availability: Availability[]): void {
    const slot = availability.find(a => a.id === dropInfo.event.id);
    if (slot) {
      // Create updated slot with new times
      const updatedSlot = {
        ...slot,
        startTime: dropInfo.event.start,
        endTime: dropInfo.event.end,
        date: dropInfo.event.start
      };

      // Create a change record
      const change: Change = {
        id: `move-${slot.id}-${Date.now()}`,
        type: 'move',
        entityId: slot.id,
        entity: updatedSlot,
        previousEntity: { ...slot },
        timestamp: new Date()
      };

      // Add the change to pending changes
      this.pendingChangesService.addChange(change);
      
      // Update the current state
      const currentState = this.pendingChangesService.getCurrentState();
      const updatedState = currentState.map(s => s.id === slot.id ? updatedSlot : s);
      this.pendingChangesService.updateCurrentState(updatedState);
    }
  }

  /** 
   * Calculate duration in minutes between two dates
   * @param start Start time
   * @param end End time
   * @returns Duration in minutes
   */
  private calculateDuration(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }
}