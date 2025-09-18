import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { PendingChangesService } from '../../pending-changes/pending-changes.service';
import { CommandFactoryService } from '../factories/command-factory.service';
import { LocalUndoRedoService } from '../core/local-undo-redo.service';
import { Change } from '../../pending-changes/pending-changes.interface';
import { UndoableCommand } from '../interfaces/undoable-command.interface';

/**
 * Service that integrates the undo/redo system with the existing pending changes system
 * Acts as a bridge between the two systems to maintain state consistency
 */
@Injectable({
  providedIn: 'root'
})
export class PendingChangesIntegrationService implements OnDestroy {
  private subscriptions = new Subscription();
  private isProcessingUndo = false;
  private lastProcessedChangeCount = 0;

  constructor(
    private pendingChangesService: PendingChangesService,
    private commandFactoryService: CommandFactoryService,
    private localUndoRedoService: LocalUndoRedoService
  ) {
    this.initialize();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Initialize the integration by subscribing to pending changes
   */
  private initialize(): void {
    // Subscribe to pending changes and create commands
    const pendingChangesSubscription = this.pendingChangesService.pendingChanges$.subscribe(state => {
      if (!this.isProcessingUndo) {
        this.handlePendingChangesUpdate(state.changes);
      }
    });

    this.subscriptions.add(pendingChangesSubscription);
  }

  /**
   * Handle updates to pending changes by creating corresponding commands
   * @param changes Current pending changes
   */
  private handlePendingChangesUpdate(changes: Change[]): void {
    // Only process new changes to avoid duplicate commands
    const newChanges = changes.slice(this.lastProcessedChangeCount);
    
    if (newChanges.length === 0) {
      return;
    }

    // Create commands for new changes
    for (const change of newChanges) {
      try {
        if (this.commandFactoryService.canCreateCommand(change)) {
          const command = this.commandFactoryService.createFromChange(change);
          
          // Add command to undo/redo stack without executing it
          // (the change has already been applied to pending changes)
          this.addCommandToStack(command);
        }
      } catch (error) {
        console.error('Failed to create command from change:', error, change);
      }
    }

    this.lastProcessedChangeCount = changes.length;
  }

  /**
   * Add a command to the undo/redo stack
   * @param command Command to add
   */
  private addCommandToStack(command: UndoableCommand): void {
    // We don't execute the command here because the change has already been applied
    // We just add it to the stack for potential undo operations
    this.localUndoRedoService.addCommand(command);
  }

  /**
   * Execute undo operation with proper integration
   * @returns Promise resolving to success status
   */
  async executeUndo(): Promise<boolean> {
    if (!this.localUndoRedoService.canUndo()) {
      return false;
    }

    this.isProcessingUndo = true;

    try {
      const result = await this.localUndoRedoService.undo();
      
      if (result && result.success) {
        // The undo operation should have modified the pending changes
        // Update our tracking to stay in sync
        this.updateChangeTrackingAfterUndo();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error during undo operation:', error);
      return false;
    } finally {
      this.isProcessingUndo = false;
    }
  }

  /**
   * Execute redo operation with proper integration
   * @returns Promise resolving to success status
   */
  async executeRedo(): Promise<boolean> {
    if (!this.localUndoRedoService.canRedo()) {
      return false;
    }

    this.isProcessingUndo = true;

    try {
      const result = await this.localUndoRedoService.redo();
      
      if (result && result.success) {
        // The redo operation should have modified the pending changes
        // Update our tracking to stay in sync
        this.updateChangeTrackingAfterRedo();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error during redo operation:', error);
      return false;
    } finally {
      this.isProcessingUndo = false;
    }
  }

  /**
   * Update change tracking after an undo operation
   */
  private updateChangeTrackingAfterUndo(): void {
    const currentChanges = this.pendingChangesService.getPendingChanges();
    this.lastProcessedChangeCount = currentChanges.length;
  }

  /**
   * Update change tracking after a redo operation
   */
  private updateChangeTrackingAfterRedo(): void {
    const currentChanges = this.pendingChangesService.getPendingChanges();
    this.lastProcessedChangeCount = currentChanges.length;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.localUndoRedoService.canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.localUndoRedoService.canRedo();
  }

  /**
   * Get description of the next operation that would be undone
   */
  getUndoDescription(): string | null {
    const command = this.localUndoRedoService.peekUndo();
    return command ? command.description : null;
  }

  /**
   * Get description of the next operation that would be redone
   */
  getRedoDescription(): string | null {
    const command = this.localUndoRedoService.peekRedo();
    return command ? command.description : null;
  }

  /**
   * Clear the undo/redo stack
   * This should be called when pending changes are saved or discarded
   */
  clearStack(): void {
    this.localUndoRedoService.clear();
    this.lastProcessedChangeCount = 0;
  }

  /**
   * Handle the case when pending changes are saved
   * This should clear the undo/redo stack since changes are now committed
   */
  onPendingChangesSaved(): void {
    this.clearStack();
  }

  /**
   * Handle the case when pending changes are discarded
   * This should clear the undo/redo stack since all changes are reverted
   */
  onPendingChangesDiscarded(): void {
    this.clearStack();
  }

  /**
   * Create a batch command for multiple operations (like copy week)
   * @param changes Array of changes to batch
   * @param description Description for the batch operation
   */
  createBatchCommand(changes: Change[], description: string): void {
    if (changes.length === 0) {
      return;
    }

    try {
      const batchCommand = this.commandFactoryService.createBatchFromChanges(changes, description);
      this.addCommandToStack(batchCommand);
      
      // Update tracking to include all the batched changes
      this.lastProcessedChangeCount += changes.length;
    } catch (error) {
      console.error('Failed to create batch command:', error);
    }
  }

  /**
   * Get current undo/redo state for UI binding
   */
  getState() {
    return this.localUndoRedoService.state$;
  }

  /**
   * Get notifications stream for UI feedback
   */
  getNotifications() {
    return this.localUndoRedoService.notifications$;
  }

  /**
   * Get statistics for monitoring and debugging
   */
  getStats() {
    return this.localUndoRedoService.stats$;
  }

  /**
   * Update configuration for the undo/redo system
   * @param config Partial configuration to update
   */
  updateConfig(config: any): void {
    this.localUndoRedoService.updateConfig(config);
  }

  /**
   * Get debug information about the current state
   */
  getDebugInfo(): any {
    return {
      isProcessingUndo: this.isProcessingUndo,
      lastProcessedChangeCount: this.lastProcessedChangeCount,
      stackInfo: this.localUndoRedoService.getStackInfo(),
      pendingChangesCount: this.pendingChangesService.getPendingChanges().length,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }
}