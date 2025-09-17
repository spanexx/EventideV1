import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Availability } from '../../models/availability.models';
import { Change, PendingChangesState } from './pending-changes.interface';

@Injectable({
  providedIn: 'root'
})
export class PendingChangesService {
  private pendingChangesState: PendingChangesState = {
    changes: [],
    originalState: [],
    currentState: [],
    hasUnsavedChanges: false
  };

  private pendingChangesSubject = new BehaviorSubject<PendingChangesState>(this.pendingChangesState);
  public pendingChanges$ = this.pendingChangesSubject.asObservable();

  /**
   * Initialize the pending changes service with the original state
   * @param originalState The original availability state
   */
  initialize(originalState: Availability[]): void {
    this.pendingChangesState = {
      changes: [],
      originalState: [...originalState],
      currentState: [...originalState],
      hasUnsavedChanges: false
    };
    this.pendingChangesSubject.next(this.pendingChangesState);
  }

  /**
   * Add a change to the pending changes list
   * @param change The change to add
   */
  addChange(change: Change): void {
    this.pendingChangesState.changes.push(change);
    this.pendingChangesState.hasUnsavedChanges = true;
    this.pendingChangesSubject.next(this.pendingChangesState);
  }

  /**
   * Update an existing change or add a new one
   * @param change The change to update or add
   */
  updateChange(change: Change): void {
    const index = this.pendingChangesState.changes.findIndex(c => c.id === change.id);
    if (index !== -1) {
      this.pendingChangesState.changes[index] = change;
    } else {
      this.pendingChangesState.changes.push(change);
    }
    this.pendingChangesState.hasUnsavedChanges = true;
    this.pendingChangesSubject.next(this.pendingChangesState);
  }

  /**
   * Remove a change from the pending changes list
   * @param changeId The ID of the change to remove
   */
  removeChange(changeId: string): void {
    this.pendingChangesState.changes = this.pendingChangesState.changes.filter(c => c.id !== changeId);
    this.pendingChangesState.hasUnsavedChanges = this.pendingChangesState.changes.length > 0;
    this.pendingChangesSubject.next(this.pendingChangesState);
  }

  /**
   * Get all pending changes
   * @returns Array of pending changes
   */
  getPendingChanges(): Change[] {
    return [...this.pendingChangesState.changes];
  }

  /**
   * Check if there are pending changes
   * @returns True if there are pending changes, false otherwise
   */
  hasPendingChanges(): boolean {
    return this.pendingChangesState.hasUnsavedChanges;
  }

  /**
   * Get the current state
   * @returns The current availability state
   */
  getCurrentState(): Availability[] {
    return [...this.pendingChangesState.currentState];
  }

  /**
   * Update the current state
   * @param newState The new availability state
   */
  updateCurrentState(newState: Availability[]): void {
    this.pendingChangesState.currentState = [...newState];
    this.pendingChangesSubject.next(this.pendingChangesState);
  }

  /**
   * Save the pending changes (clears the pending changes list)
   */
  saveChanges(): void {
    this.pendingChangesState.changes = [];
    this.pendingChangesState.originalState = [...this.pendingChangesState.currentState];
    this.pendingChangesState.hasUnsavedChanges = false;
    this.pendingChangesSubject.next(this.pendingChangesState);
  }

  /**
   * Discard the pending changes (reverts to original state)
   * @returns The original availability state
   */
  discardChanges(): Availability[] {
    this.pendingChangesState.changes = [];
    this.pendingChangesState.currentState = [...this.pendingChangesState.originalState];
    this.pendingChangesState.hasUnsavedChanges = false;
    this.pendingChangesSubject.next(this.pendingChangesState);
    return [...this.pendingChangesState.originalState];
  }

  /**
   * Get the original state
   * @returns The original availability state
   */
  getOriginalState(): Availability[] {
    return [...this.pendingChangesState.originalState];
  }
  
  /**
   * Restore the pending changes state from a snapshot
   * @param changes The changes to restore
   */
  restoreState(changes: Change[]): void {
    // For undo/redo, we want to restore the exact state that was saved
    // Set the current state to be the result of applying these changes to the original state
    const restoredState = this.applyChangesToState(
      this.pendingChangesState.originalState, 
      changes
    );
    
    // Update the state with the restored changes and state
    this.pendingChangesState.changes = [...changes];
    this.pendingChangesState.currentState = restoredState;
    this.pendingChangesState.hasUnsavedChanges = changes.length > 0;
    
    // Notify subscribers of the state change
    this.pendingChangesSubject.next(this.pendingChangesState);
  }
  
  /** 
   * Apply pending changes to the original state to get the current state
   * @param originalState The original availability state
   * @param pendingChanges The pending changes to apply
   * @returns The current state with pending changes applied
   */
  private applyChangesToState(originalState: Availability[], pendingChanges: Change[]): Availability[] {
    // Start with a copy of the original state
    let currentState = [...originalState];
    
    // Apply each pending change
    pendingChanges.forEach(change => {
      switch (change.type) {
        case 'create':
          // For create operations, add the new slot if entity exists
          if (change.entity) {
            currentState.push({ ...change.entity });
          }
          break;
          
        case 'update':
        case 'move':
        case 'resize':
          // For update/move/resize operations, update the existing slot
          if (change.entityId && change.entity) {
            const index = currentState.findIndex(slot => slot.id === change.entityId);
            if (index !== -1) {
              currentState[index] = { ...change.entity };
            }
          }
          break;
          
        case 'delete':
          // For delete operations, remove the slot
          if (change.entityId) {
            currentState = currentState.filter(slot => slot.id !== change.entityId);
          }
          break;
      }
    });
    
    return currentState;
  }
  
  /** 
   * Save the current state to the undo stack
   */
  saveToUndoStack(): void {
    // In a real implementation, this would notify the undo/redo service
    // to save the current state to the undo stack
    console.log('Saving current state to undo stack');
  }
}