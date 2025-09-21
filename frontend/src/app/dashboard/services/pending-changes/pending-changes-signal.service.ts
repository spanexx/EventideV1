import { Injectable, computed, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Availability } from '../../models/availability.models';
import { Change, PendingChangesState } from './pending-changes.interface';

@Injectable({
  providedIn: 'root'
})
export class PendingChangesSignalService {
  // Core state signals
  private readonly originalState = signal<Availability[]>([]);
  private readonly changes = signal<Change[]>([]);
  
  // Computed signals (auto-update when dependencies change)
  readonly currentState = computed(() => 
    this.applyChangesToState(this.originalState(), this.changes())
  );
  
  readonly pendingChangesCount = computed(() => this.changes().length);
  
  readonly hasUnsavedChanges = computed(() => this.changes().length > 0);
  
  readonly pendingChanges = computed((): PendingChangesState => ({
    changes: this.changes(),
    originalState: this.originalState(),
    currentState: this.currentState(),
    hasUnsavedChanges: this.hasUnsavedChanges()
  }));

  // Compatibility layer - Observable versions for existing code (initialized in constructor)
  readonly pendingChanges$: Observable<PendingChangesState>;
  readonly getCurrentState$: Observable<Availability[]>;

  constructor() {
    // Initialize observables in constructor where injection context is available
    this.pendingChanges$ = toObservable(this.pendingChanges);
    this.getCurrentState$ = toObservable(this.currentState);
  }

  /**
   * Initialize the pending changes service with the original state
   * @param originalState The original availability state
   */
  initialize(originalState: Availability[]): void {
    this.originalState.set([...originalState]);
    this.changes.set([]);
  }

  /**
   * Add a change to the pending changes list
   * @param change The change to add
   */
  addChange(change: Change): void {
    this.changes.update(currentChanges => [...currentChanges, change]);
  }

  /**
   * Update an existing change or add a new one
   * @param change The change to update or add
   */
  updateChange(change: Change): void {
    this.changes.update(currentChanges => {
      const index = currentChanges.findIndex(c => c.id === change.id);
      if (index !== -1) {
        // Replace existing change
        const newChanges = [...currentChanges];
        newChanges[index] = change;
        return newChanges;
      } else {
        // Add new change
        return [...currentChanges, change];
      }
    });
  }

  /**
   * Remove a change from the pending changes list
   * @param changeId The ID of the change to remove
   */
  removeChange(changeId: string): void {
    this.changes.update(currentChanges => 
      currentChanges.filter(c => c.id !== changeId)
    );
  }

  /**
   * Get all pending changes
   * @returns Array of pending changes
   */
  getPendingChanges(): Change[] {
    return [...this.changes()];
  }

  /**
   * Check if there are pending changes
   * @returns True if there are pending changes, false otherwise
   */
  hasPendingChanges(): boolean {
    return this.hasUnsavedChanges();
  }

  /**
   * Get the current state
   * @returns The current availability state
   */
  getCurrentState(): Availability[] {
    return [...this.currentState()];
  }

  /**
   * Update the current state by replacing the original state
   * @param newState The new availability state
   */
  updateCurrentState(newState: Availability[]): void {
    // When updating current state, we assume this is a new original state
    // and clear any pending changes
    this.originalState.set([...newState]);
    this.changes.set([]);
  }

  /**
   * Save the pending changes (clears the pending changes list)
   */
  saveChanges(): void {
    // Move current state to original state and clear changes
    this.originalState.set([...this.currentState()]);
    this.changes.set([]);
  }

  /**
   * Discard the pending changes (reverts to original state)
   * @returns The original availability state
   */
  discardChanges(): Availability[] {
    this.changes.set([]);
    return [...this.originalState()];
  }

  /**
   * Get the original state
   * @returns The original availability state
   */
  getOriginalState(): Availability[] {
    return [...this.originalState()];
  }
  
  /**
   * Restore the pending changes state from a snapshot (for undo/redo)
   * @param changesSnapshot The changes to restore
   */
  restoreState(changesSnapshot: Change[]): void {
    this.changes.set([...changesSnapshot]);
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
    pendingChanges.forEach((change) => {
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
   * @deprecated Use undo/redo service directly
   */
  saveToUndoStack(): void {
    console.log('Saving current state to undo stack - use undo/redo service directly');
  }
}