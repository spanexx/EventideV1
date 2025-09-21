import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Availability } from '../../models/availability.models';
import { PendingChangesService } from './pending-changes.service';
import { PendingChangesSignalService } from './pending-changes-signal.service';
import { UndoRedoSignalService } from '../undo-redo/undo-redo-signal.service';
import { Change } from './pending-changes.interface';

@Injectable({
  providedIn: 'root'
})
export class DragResizeService {
  constructor(
    private pendingChangesService: PendingChangesService, // Keep old for compatibility
    private pendingChangesSignalService: PendingChangesSignalService, // New signal service
    private undoRedoService: UndoRedoSignalService,
    private store: Store
  ) {}

  /** 
   * Handle event resize operations with pending changes
   * @param resizeInfo The resize information
   * @param availability Current availability data
   */
  handleEventResize(resizeInfo: any, availability: Availability[]): void {
    // First try to find the slot in the current state (which includes pending changes)
    const currentState = this.pendingChangesSignalService.currentState();
    let slot = currentState.find(a => a.id === resizeInfo.event.id);
    
    // If not found in current state, try the original availability array (fallback)
    if (!slot) {
      slot = availability.find(a => a.id === resizeInfo.event.id);
    }
    
    if (slot) {
      // Save current state for undo before making changes
      this.undoRedoService.saveStateForUndo('Resize availability slot');
      
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

      // Add the change to signal-based pending changes
      this.pendingChangesSignalService.addChange(change);
    } else {
      console.warn('[DragResizeService] Could not find slot with ID:', resizeInfo.event.id);
    }
  }

  /** 
   * Handle event drop operations with pending changes
   * @param dropInfo The drop information
   * @param availability Current availability data
   */
  handleEventDrop(dropInfo: any, availability: Availability[]): void {
    // First try to find the slot in the current state (which includes pending changes)
    const currentState = this.pendingChangesSignalService.currentState();
    let slot = currentState.find(a => a.id === dropInfo.event.id);
    
    // If not found in current state, try the original availability array (fallback)
    if (!slot) {
      slot = availability.find(a => a.id === dropInfo.event.id);
    }
    
    if (slot) {
      // Save current state for undo before making changes
      this.undoRedoService.saveStateForUndo('Move availability slot');
      
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

      // Add the change to signal-based pending changes
      this.pendingChangesSignalService.addChange(change);
    } else {
      console.warn('[DragResizeService] Could not find slot with ID:', dropInfo.event.id);
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