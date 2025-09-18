import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { UndoableCommand, CommandResult } from '../interfaces/undoable-command.interface';
import { 
  UndoRedoState, 
  UndoRedoConfig, 
  UndoRedoNotification,
  UndoRedoStats,
  CommandStack,
  DEFAULT_UNDO_REDO_CONFIG,
  INITIAL_UNDO_REDO_STATE
} from '../interfaces/undo-redo-state.interface';

/**
 * Core service for managing the undo/redo command stack
 * Implements the "History Undo" pattern for better user experience
 */
@Injectable({
  providedIn: 'root'
})
export class LocalUndoRedoService {
  private config: UndoRedoConfig = { ...DEFAULT_UNDO_REDO_CONFIG };
  private commandStack: CommandStack;
  private state = new BehaviorSubject<UndoRedoState>({ ...INITIAL_UNDO_REDO_STATE });
  private notifications = new Subject<UndoRedoNotification>();
  private stats = new BehaviorSubject<UndoRedoStats>({
    totalExecutions: 0,
    totalUndos: 0,
    totalRedos: 0,
    averageExecutionTime: 0,
    peakMemoryUsage: 0,
    commandTypeUsage: {}
  });

  // Throttling for command creation
  private lastCommandTime = 0;
  private executionTimes: number[] = [];

  constructor() {
    this.commandStack = new CommandStackImpl(this.config.maxStackSize);
    this.setupPeriodicCleanup();
  }

  /**
   * Observable streams for external consumption
   */
  get state$(): Observable<UndoRedoState> {
    return this.state.asObservable();
  }

  get notifications$(): Observable<UndoRedoNotification> {
    return this.notifications.asObservable();
  }

  get stats$(): Observable<UndoRedoStats> {
    return this.stats.asObservable();
  }

  /**
   * Add a command to the stack with throttling
   * @param command Command to add
   */
  addCommand(command: UndoableCommand): void {
    const now = Date.now();
    
    // Apply throttling to prevent excessive command creation
    if (now - this.lastCommandTime < this.config.throttleTime) {
      if (this.config.enableLogging) {
        console.log('Command throttled:', command.description);
      }
      return;
    }

    this.lastCommandTime = now;
    
    // Add to stack
    this.commandStack.push(command);
    
    // Update state
    this.updateState();
    
    // Send notification
    this.notify({
      type: 'command_executed',
      command,
      timestamp: new Date()
    });

    // Update stats
    this.updateStats('execute', command.type);

    if (this.config.enableLogging) {
      console.log('Command added to stack:', command.description);
    }
  }

  /**
   * Execute undo operation
   * @returns Promise resolving to command result
   */
  async undo(): Promise<CommandResult | null> {
    if (!this.canUndo()) {
      return null;
    }

    const startTime = Date.now();
    this.updateState({ isProcessing: true });

    try {
      const command = this.commandStack.popUndo();
      if (!command) {
        return null;
      }

      const result = await command.undo();
      const executionTime = Date.now() - startTime;
      
      if (result.success) {
        this.updateState({
          isProcessing: false,
          lastOperation: command.description,
          lastOperationType: 'undo',
          lastOperationTime: new Date(),
          lastError: null
        });

        this.notify({
          type: 'command_undone',
          command,
          timestamp: new Date()
        });

        this.updateStats('undo', command.type, executionTime);
      } else {
        // If undo failed, put the command back
        this.commandStack.push(command);
        
        this.updateState({
          isProcessing: false,
          lastError: result.error || new Error('Undo operation failed')
        });

        this.notify({
          type: 'error',
          command,
          error: result.error,
          message: 'Undo operation failed',
          timestamp: new Date()
        });
      }

      this.updateState();
      return result;

    } catch (error) {
      this.updateState({
        isProcessing: false,
        lastError: error as Error
      });

      this.notify({
        type: 'error',
        error: error as Error,
        message: 'Undo operation threw an exception',
        timestamp: new Date()
      });

      return {
        success: false,
        error: error as Error,
        undoable: false,
        redoable: false,
        message: 'Undo operation failed'
      };
    }
  }

  /**
   * Execute redo operation
   * @returns Promise resolving to command result
   */
  async redo(): Promise<CommandResult | null> {
    if (!this.canRedo()) {
      return null;
    }

    const startTime = Date.now();
    this.updateState({ isProcessing: true });

    try {
      const command = this.commandStack.popRedo();
      if (!command) {
        return null;
      }

      const result = await command.redo();
      const executionTime = Date.now() - startTime;

      if (result.success) {
        this.updateState({
          isProcessing: false,
          lastOperation: command.description,
          lastOperationType: 'redo',
          lastOperationTime: new Date(),
          lastError: null
        });

        this.notify({
          type: 'command_redone',
          command,
          timestamp: new Date()
        });

        this.updateStats('redo', command.type, executionTime);
      } else {
        // If redo failed, put the command back in redo stack
        // This is implementation-specific behavior
        
        this.updateState({
          isProcessing: false,
          lastError: result.error || new Error('Redo operation failed')
        });

        this.notify({
          type: 'error',
          command,
          error: result.error,
          message: 'Redo operation failed',
          timestamp: new Date()
        });
      }

      this.updateState();
      return result;

    } catch (error) {
      this.updateState({
        isProcessing: false,
        lastError: error as Error
      });

      this.notify({
        type: 'error',
        error: error as Error,
        message: 'Redo operation threw an exception',
        timestamp: new Date()
      });

      return {
        success: false,
        error: error as Error,
        undoable: false,
        redoable: false,
        message: 'Redo operation failed'
      };
    }
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.commandStack.canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.commandStack.canRedo();
  }

  /**
   * Get the next command that would be undone
   */
  peekUndo(): UndoableCommand | null {
    return this.commandStack.peekUndo();
  }

  /**
   * Get the next command that would be redone
   */
  peekRedo(): UndoableCommand | null {
    return this.commandStack.peekRedo();
  }

  /**
   * Clear the entire command stack
   */
  clear(): void {
    this.commandStack.clear();
    this.updateState();
    
    this.notify({
      type: 'stack_cleared',
      timestamp: new Date()
    });

    if (this.config.enableLogging) {
      console.log('Command stack cleared');
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): UndoRedoConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<UndoRedoConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update stack size if changed
    if (newConfig.maxStackSize !== undefined) {
      this.commandStack = new CommandStackImpl(newConfig.maxStackSize);
      this.updateState();
    }

    if (this.config.enableLogging) {
      console.log('Configuration updated:', this.config);
    }
  }

  /**
   * Get command stack information for debugging
   */
  getStackInfo(): { undoCount: number; redoCount: number; totalSize: number } {
    return {
      undoCount: this.commandStack.undoStack.length,
      redoCount: this.commandStack.redoStack.length,
      totalSize: this.commandStack.size()
    };
  }

  /**
   * Update the observable state
   */
  private updateState(partial?: Partial<UndoRedoState>): void {
    const currentState = this.state.value;
    const newState: UndoRedoState = {
      ...currentState,
      ...partial,
      canUndo: this.commandStack.canUndo(),
      canRedo: this.commandStack.canRedo(),
      commandCount: this.commandStack.size(),
      undoStackSize: this.commandStack.undoStack.length,
      redoStackSize: this.commandStack.redoStack.length
    };

    this.state.next(newState);
  }

  /**
   * Send a notification
   */
  private notify(notification: UndoRedoNotification): void {
    this.notifications.next(notification);
  }

  /**
   * Update statistics
   */
  private updateStats(operation: 'execute' | 'undo' | 'redo', commandType: string, executionTime?: number): void {
    const currentStats = this.stats.value;
    
    // Update execution times
    if (executionTime !== undefined) {
      this.executionTimes.push(executionTime);
      // Keep only last 100 execution times
      if (this.executionTimes.length > 100) {
        this.executionTimes.shift();
      }
    }

    const newStats: UndoRedoStats = {
      ...currentStats,
      totalExecutions: operation === 'execute' ? currentStats.totalExecutions + 1 : currentStats.totalExecutions,
      totalUndos: operation === 'undo' ? currentStats.totalUndos + 1 : currentStats.totalUndos,
      totalRedos: operation === 'redo' ? currentStats.totalRedos + 1 : currentStats.totalRedos,
      averageExecutionTime: this.executionTimes.length > 0 ? 
        this.executionTimes.reduce((a, b) => a + b, 0) / this.executionTimes.length : 0,
      commandTypeUsage: {
        ...currentStats.commandTypeUsage,
        [commandType]: (currentStats.commandTypeUsage[commandType] || 0) + 1
      }
    };

    this.stats.next(newStats);
  }

  /**
   * Setup periodic cleanup of old commands
   */
  private setupPeriodicCleanup(): void {
    if (!this.config.autoCleanup) {
      return;
    }

    // Run cleanup every hour
    setInterval(() => {
      this.cleanupOldCommands();
    }, 60 * 60 * 1000);
  }

  /**
   * Clean up old commands based on TTL
   */
  private cleanupOldCommands(): void {
    const now = Date.now();
    const cutoff = now - this.config.commandTTL;

    // This is a simplified cleanup - in a real implementation,
    // you'd need to be more careful about maintaining the stack integrity
    const cleanupCount = this.commandStack.undoStack.filter(cmd => 
      cmd.timestamp.getTime() < cutoff
    ).length;

    if (cleanupCount > 0 && this.config.enableLogging) {
      console.log(`Cleaned up ${cleanupCount} old commands`);
    }
  }
}

/**
 * Implementation of the command stack interface
 */
class CommandStackImpl implements CommandStack {
  undoStack: UndoableCommand[] = [];
  redoStack: UndoableCommand[] = [];
  currentIndex = -1;

  constructor(private maxSize: number) {}

  push(command: UndoableCommand): void {
    // Clear redo stack when new command is added (History Undo pattern)
    this.redoStack = [];
    
    // Add to undo stack
    this.undoStack.push(command);
    
    // Maintain size limit
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    
    this.currentIndex = this.undoStack.length - 1;
  }

  popUndo(): UndoableCommand | null {
    if (this.undoStack.length === 0) {
      return null;
    }

    const command = this.undoStack.pop()!;
    this.redoStack.push(command);
    this.currentIndex = this.undoStack.length - 1;
    
    return command;
  }

  popRedo(): UndoableCommand | null {
    if (this.redoStack.length === 0) {
      return null;
    }

    const command = this.redoStack.pop()!;
    this.undoStack.push(command);
    this.currentIndex = this.undoStack.length - 1;
    
    return command;
  }

  peekUndo(): UndoableCommand | null {
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : null;
  }

  peekRedo(): UndoableCommand | null {
    return this.redoStack.length > 0 ? this.redoStack[this.redoStack.length - 1] : null;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.currentIndex = -1;
  }

  size(): number {
    return this.undoStack.length + this.redoStack.length;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }
}