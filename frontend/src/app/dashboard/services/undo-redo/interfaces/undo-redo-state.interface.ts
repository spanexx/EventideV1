import { Observable } from 'rxjs';
import { UndoableCommand } from './undoable-command.interface';

/**
 * State of the undo/redo system at any point in time
 */
export interface UndoRedoState {
  /** Whether undo operation is available */
  canUndo: boolean;
  
  /** Whether redo operation is available */
  canRedo: boolean;
  
  /** Total number of commands in the stack */
  commandCount: number;
  
  /** Number of commands that can be undone */
  undoStackSize: number;
  
  /** Number of commands that can be redone */
  redoStackSize: number;
  
  /** Description of the last operation performed */
  lastOperation: string | null;
  
  /** Type of the last operation */
  lastOperationType: 'execute' | 'undo' | 'redo' | null;
  
  /** Timestamp of the last operation */
  lastOperationTime: Date | null;
  
  /** Whether the system is currently processing a command */
  isProcessing: boolean;
  
  /** Any error that occurred during the last operation */
  lastError: Error | null;
}

/**
 * Configuration options for the undo/redo system
 */
export interface UndoRedoConfig {
  /** Maximum number of commands to keep in the stack */
  maxStackSize: number;
  
  /** Throttle time in milliseconds to prevent excessive command creation */
  throttleTime: number;
  
  /** Whether to enable debugging logs */
  enableLogging: boolean;
  
  /** Whether to use "History Undo" pattern (recommended) */
  useHistoryUndo: boolean;
  
  /** Whether to automatically clean up old commands */
  autoCleanup: boolean;
  
  /** Time to live for commands in milliseconds */
  commandTTL: number;
}

/**
 * Statistics about undo/redo usage
 */
export interface UndoRedoStats {
  /** Total number of commands executed */
  totalExecutions: number;
  
  /** Total number of undo operations */
  totalUndos: number;
  
  /** Total number of redo operations */
  totalRedos: number;
  
  /** Average time spent executing commands */
  averageExecutionTime: number;
  
  /** Peak memory usage of command stack */
  peakMemoryUsage: number;
  
  /** Most frequently used command types */
  commandTypeUsage: Record<string, number>;
}

/**
 * Notification about undo/redo state changes
 */
export interface UndoRedoNotification {
  /** Type of notification */
  type: 'command_executed' | 'command_undone' | 'command_redone' | 'stack_cleared' | 'error';
  
  /** Command that triggered the notification (if applicable) */
  command?: UndoableCommand;
  
  /** Error that occurred (if applicable) */
  error?: Error;
  
  /** Additional message */
  message?: string;
  
  /** Timestamp of the notification */
  timestamp: Date;
}

/**
 * Service interface for managing undo/redo state
 */
export interface UndoRedoStateManager {
  /** Current state as observable */
  state$: Observable<UndoRedoState>;
  
  /** Notifications stream */
  notifications$: Observable<UndoRedoNotification>;
  
  /** Statistics stream */
  stats$: Observable<UndoRedoStats>;
  
  /**
   * Get current state snapshot
   */
  getCurrentState(): UndoRedoState;
  
  /**
   * Update state after a command operation
   */
  updateState(updates: Partial<UndoRedoState>): void;
  
  /**
   * Send a notification
   */
  notify(notification: UndoRedoNotification): void;
  
  /**
   * Reset state to initial values
   */
  reset(): void;
  
  /**
   * Get current statistics
   */
  getStats(): UndoRedoStats;
}

/**
 * Command stack interface for managing the actual commands
 */
export interface CommandStack {
  /** Commands available for undo (past) */
  undoStack: UndoableCommand[];
  
  /** Commands available for redo (future) */
  redoStack: UndoableCommand[];
  
  /** Current position in the stack */
  currentIndex: number;
  
  /**
   * Push a new command onto the stack
   */
  push(command: UndoableCommand): void;
  
  /**
   * Pop the most recent command for undo
   */
  popUndo(): UndoableCommand | null;
  
  /**
   * Pop the most recent undone command for redo
   */
  popRedo(): UndoableCommand | null;
  
  /**
   * Peek at the next command that would be undone
   */
  peekUndo(): UndoableCommand | null;
  
  /**
   * Peek at the next command that would be redone
   */
  peekRedo(): UndoableCommand | null;
  
  /**
   * Clear the entire stack
   */
  clear(): void;
  
  /**
   * Get the size of the stack
   */
  size(): number;
  
  /**
   * Check if undo is available
   */
  canUndo(): boolean;
  
  /**
   * Check if redo is available
   */
  canRedo(): boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_UNDO_REDO_CONFIG: UndoRedoConfig = {
  maxStackSize: 50,
  throttleTime: 1000,
  enableLogging: false,
  useHistoryUndo: true,
  autoCleanup: true,
  commandTTL: 24 * 60 * 60 * 1000 // 24 hours
};

/**
 * Initial state values
 */
export const INITIAL_UNDO_REDO_STATE: UndoRedoState = {
  canUndo: false,
  canRedo: false,
  commandCount: 0,
  undoStackSize: 0,
  redoStackSize: 0,
  lastOperation: null,
  lastOperationType: null,
  lastOperationTime: null,
  isProcessing: false,
  lastError: null
};