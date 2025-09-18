import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PendingChangesIntegrationService } from './integration/pending-changes-integration.service';
import { UndoRedoState, UndoRedoNotification, UndoRedoStats } from './interfaces/undo-redo-state.interface';
import { SnackbarService } from '../../../shared/services/snackbar.service';

/**
 * Main coordinator service for undo/redo functionality
 * Provides a clean, high-level API for components to use
 */
@Injectable({
  providedIn: 'root'
})
export class UndoRedoCoordinatorService {
  
  constructor(
    private integrationService: PendingChangesIntegrationService,
    private snackbarService: SnackbarService
  ) {
    this.setupNotificationHandling();
  }

  /**
   * Observable streams for UI binding
   */
  get state$(): Observable<UndoRedoState> {
    return this.integrationService.getState();
  }

  get canUndo$(): Observable<boolean> {
    return this.state$.pipe(map(state => state.canUndo));
  }

  get canRedo$(): Observable<boolean> {
    return this.state$.pipe(map(state => state.canRedo));
  }

  get undoDescription$(): Observable<string | null> {
    return this.state$.pipe(
      map(() => this.integrationService.getUndoDescription())
    );
  }

  get redoDescription$(): Observable<string | null> {
    return this.state$.pipe(
      map(() => this.integrationService.getRedoDescription())
    );
  }

  get notifications$(): Observable<UndoRedoNotification> {
    return this.integrationService.getNotifications();
  }

  get stats$(): Observable<UndoRedoStats> {
    return this.integrationService.getStats();
  }

  /**
   * Execute undo operation
   * @param showFeedback Whether to show user feedback (default: true)
   * @returns Promise resolving to success status
   */
  async undo(showFeedback = true): Promise<boolean> {
    if (!this.canUndo()) {
      if (showFeedback) {
        this.snackbarService.showInfo('Nothing to undo');
      }
      return false;
    }

    const description = this.integrationService.getUndoDescription();
    const success = await this.integrationService.executeUndo();

    if (showFeedback) {
      if (success) {
        this.snackbarService.showSuccess(
          description ? `Undone: ${description}` : 'Operation undone'
        );
      } else {
        this.snackbarService.showError('Failed to undo operation');
      }
    }

    return success;
  }

  /**
   * Execute redo operation
   * @param showFeedback Whether to show user feedback (default: true)
   * @returns Promise resolving to success status
   */
  async redo(showFeedback = true): Promise<boolean> {
    if (!this.canRedo()) {
      if (showFeedback) {
        this.snackbarService.showInfo('Nothing to redo');
      }
      return false;
    }

    const description = this.integrationService.getRedoDescription();
    const success = await this.integrationService.executeRedo();

    if (showFeedback) {
      if (success) {
        this.snackbarService.showSuccess(
          description ? `Redone: ${description}` : 'Operation redone'
        );
      } else {
        this.snackbarService.showError('Failed to redo operation');
      }
    }

    return success;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.integrationService.canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.integrationService.canRedo();
  }

  /**
   * Get description of next undo operation
   */
  getUndoDescription(): string | null {
    return this.integrationService.getUndoDescription();
  }

  /**
   * Get description of next redo operation
   */
  getRedoDescription(): string | null {
    return this.integrationService.getRedoDescription();
  }

  /**
   * Clear the undo/redo stack
   * Should be called when changes are saved or discarded
   */
  clear(): void {
    this.integrationService.clearStack();
  }

  /**
   * Handle when pending changes are saved
   * Clears the undo/redo stack since changes are now committed
   */
  onChangesSaved(): void {
    this.integrationService.onPendingChangesSaved();
  }

  /**
   * Handle when pending changes are discarded
   * Clears the undo/redo stack since all changes are reverted
   */
  onChangesDiscarded(): void {
    this.integrationService.onPendingChangesDiscarded();
  }

  /**
   * Create a batch operation for multiple changes
   * Useful for operations like "copy week" that involve multiple changes
   * @param changes Array of changes to batch
   * @param description Description for the batch operation
   */
  createBatchOperation(changes: any[], description: string): void {
    this.integrationService.createBatchCommand(changes, description);
  }

  /**
   * Update undo/redo system configuration
   * @param config Configuration options to update
   */
  updateConfig(config: {
    maxStackSize?: number;
    throttleTime?: number;
    enableLogging?: boolean;
    useHistoryUndo?: boolean;
    autoCleanup?: boolean;
    commandTTL?: number;
  }): void {
    this.integrationService.updateConfig(config);
  }

  /**
   * Get current configuration
   */
  getConfig(): any {
    return this.integrationService.getDebugInfo();
  }

  /**
   * Get debug information for troubleshooting
   */
  getDebugInfo(): any {
    return this.integrationService.getDebugInfo();
  }

  /**
   * Execute keyboard shortcut for undo
   * @param event Keyboard event (for preventing default)
   */
  handleUndoShortcut(event?: KeyboardEvent): void {
    if (event) {
      event.preventDefault();
    }
    this.undo();
  }

  /**
   * Execute keyboard shortcut for redo
   * @param event Keyboard event (for preventing default)
   */
  handleRedoShortcut(event?: KeyboardEvent): void {
    if (event) {
      event.preventDefault();
    }
    this.redo();
  }

  /**
   * Get user-friendly status message
   */
  getStatusMessage(): string {
    const canUndo = this.canUndo();
    const canRedo = this.canRedo();
    
    if (canUndo && canRedo) {
      return `Can undo "${this.getUndoDescription()}" or redo "${this.getRedoDescription()}"`;
    } else if (canUndo) {
      return `Can undo "${this.getUndoDescription()}"`;
    } else if (canRedo) {
      return `Can redo "${this.getRedoDescription()}"`;
    } else {
      return 'No undo/redo operations available';
    }
  }

  /**
   * Setup notification handling for user feedback
   */
  private setupNotificationHandling(): void {
    this.notifications$.subscribe(notification => {
      switch (notification.type) {
        case 'error':
          if (notification.message) {
            this.snackbarService.showError(notification.message);
          }
          break;
        
        case 'stack_cleared':
          // Could show a subtle notification that history was cleared
          // but might be too noisy for regular use
          break;
        
        // Other notification types are handled by the explicit undo/redo methods
        default:
          break;
      }
    });
  }

  /**
   * Force a full reset of the undo/redo system
   * Use with caution - this will lose all history
   */
  reset(): void {
    this.clear();
    this.snackbarService.showInfo('Undo/redo history cleared');
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): Observable<{
    totalOperations: number;
    averageExecutionTime: number;
    undoToExecuteRatio: number;
    mostUsedCommands: Array<{ type: string; count: number }>;
  }> {
    return this.stats$.pipe(
      map(stats => ({
        totalOperations: stats.totalExecutions + stats.totalUndos + stats.totalRedos,
        averageExecutionTime: stats.averageExecutionTime,
        undoToExecuteRatio: stats.totalExecutions > 0 ? 
          stats.totalUndos / stats.totalExecutions : 0,
        mostUsedCommands: Object.entries(stats.commandTypeUsage)
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      }))
    );
  }
}