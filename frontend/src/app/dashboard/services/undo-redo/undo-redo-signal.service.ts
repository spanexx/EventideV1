import { Injectable, computed, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PendingChangesSignalService } from '../pending-changes/pending-changes-signal.service';
import { Change } from '../pending-changes/pending-changes.interface';

interface UndoRedoSnapshot {
  changes: Change[];
  timestamp: Date;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UndoRedoSignalService {
  // Core undo/redo state signals
  private readonly undoStack = signal<UndoRedoSnapshot[]>([]);
  private readonly redoStack = signal<UndoRedoSnapshot[]>([]);
  
  // Computed signals for UI state
  readonly canUndo = computed(() => this.undoStack().length > 0);
  readonly canRedo = computed(() => this.redoStack().length > 0);
  
  readonly undoDescription = computed(() => {
    const stack = this.undoStack();
    return stack.length > 0 ? stack[stack.length - 1].description : null;
  });
  
  readonly redoDescription = computed(() => {
    const stack = this.redoStack();
    return stack.length > 0 ? stack[stack.length - 1].description : null;
  });

  // Compatibility layer - Observable versions (initialized in constructor)
  readonly canUndo$: Observable<boolean>;
  readonly canRedo$: Observable<boolean>;
  readonly undoDescription$: Observable<string | null>;
  readonly redoDescription$: Observable<string | null>;

  constructor(private pendingChangesService: PendingChangesSignalService) {
    // Initialize observables in constructor where injection context is available
    this.canUndo$ = toObservable(this.canUndo);
    this.canRedo$ = toObservable(this.canRedo);
    this.undoDescription$ = toObservable(this.undoDescription).pipe(
      map(desc => desc ?? null)
    );
    this.redoDescription$ = toObservable(this.redoDescription).pipe(
      map(desc => desc ?? null)
    );
  }

  /**
   * Save current state to undo stack before making changes
   * @param description Optional description for the undo action
   */
  saveStateForUndo(description?: string): void {
    const currentChanges = this.pendingChangesService.getPendingChanges();
    
    const snapshot: UndoRedoSnapshot = {
      changes: [...currentChanges],
      timestamp: new Date(),
      description
    };
    
    this.undoStack.update(stack => [...stack, snapshot]);
    
    // Clear redo stack when new action is performed
    this.redoStack.set([]);
    
    // Limit undo stack size to prevent memory issues
    const maxUndoSteps = 50;
    if (this.undoStack().length > maxUndoSteps) {
      this.undoStack.update(stack => stack.slice(-maxUndoSteps));
    }
  }

  /**
   * Perform undo operation
   * @returns True if undo was performed, false if no undo available
   */
  undo(): boolean {
    if (!this.canUndo()) {
      return false;
    }

    // Get current state for redo stack
    const currentChanges = this.pendingChangesService.getPendingChanges();
    const currentSnapshot: UndoRedoSnapshot = {
      changes: [...currentChanges],
      timestamp: new Date()
    };

    // Move current state to redo stack
    this.redoStack.update(stack => [...stack, currentSnapshot]);

    // Get previous state from undo stack
    const undoSnapshot = this.undoStack()[this.undoStack().length - 1];
    this.undoStack.update(stack => stack.slice(0, -1));

    // Restore previous state
    this.pendingChangesService.restoreState(undoSnapshot.changes);

    return true;
  }

  /**
   * Perform redo operation
   * @returns True if redo was performed, false if no redo available
   */
  redo(): boolean {
    if (!this.canRedo()) {
      return false;
    }

    // Get current state for undo stack
    const currentChanges = this.pendingChangesService.getPendingChanges();
    const currentSnapshot: UndoRedoSnapshot = {
      changes: [...currentChanges],
      timestamp: new Date()
    };

    // Move current state to undo stack
    this.undoStack.update(stack => [...stack, currentSnapshot]);

    // Get next state from redo stack
    const redoSnapshot = this.redoStack()[this.redoStack().length - 1];
    this.redoStack.update(stack => stack.slice(0, -1));

    // Restore next state
    this.pendingChangesService.restoreState(redoSnapshot.changes);

    return true;
  }

  /**
   * Clear both undo and redo stacks
   */
  clearHistory(): void {
    this.undoStack.set([]);
    this.redoStack.set([]);
  }

  /**
   * Get undo stack size for debugging
   */
  getUndoStackSize(): number {
    return this.undoStack().length;
  }

  /**
   * Get redo stack size for debugging
   */
  getRedoStackSize(): number {
    return this.redoStack().length;
  }
}