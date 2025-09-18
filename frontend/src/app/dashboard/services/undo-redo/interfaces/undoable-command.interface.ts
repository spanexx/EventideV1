/**
 * Core interface for all undoable commands in the system.
 * Based on the Command pattern, each command encapsulates an operation
 * that can be executed, undone, and redone.
 */
export interface UndoableCommand<TData = any> {
  /** Unique identifier for this command */
  readonly id: string;
  
  /** Command type identifier for factory and processing */
  readonly type: string;
  
  /** Command-specific data payload */
  readonly data: TData;
  
  /** When this command was created */
  readonly timestamp: Date;
  
  /** Human-readable description for UI display */
  readonly description: string;
  
  /**
   * Execute the command operation
   * @returns Promise resolving to command result
   */
  execute(): Promise<CommandResult>;
  
  /**
   * Undo the command operation
   * @returns Promise resolving to command result
   */
  undo(): Promise<CommandResult>;
  
  /**
   * Redo the command operation (typically same as execute)
   * @returns Promise resolving to command result
   */
  redo(): Promise<CommandResult>;
  
  /**
   * Check if this command can be executed
   * @returns True if command can be executed
   */
  canExecute(): boolean;
  
  /**
   * Check if this command can be undone
   * @returns True if command can be undone
   */
  canUndo(): boolean;
  
  /**
   * Check if this command can be redone
   * @returns True if command can be redone
   */
  canRedo(): boolean;
}

/**
 * Result of executing, undoing, or redoing a command
 */
export interface CommandResult {
  /** Whether the operation succeeded */
  success: boolean;
  
  /** Error information if operation failed */
  error?: Error;
  
  /** IDs of entities affected by this operation */
  affectedEntities?: string[];
  
  /** Additional side effects that occurred */
  sideEffects?: SideEffect[];
  
  /** Whether this operation can be undone */
  undoable: boolean;
  
  /** Whether this operation can be redone */
  redoable: boolean;
  
  /** Optional message for user feedback */
  message?: string;
}

/**
 * Represents a side effect of a command operation
 */
export interface SideEffect {
  /** Type of side effect */
  type: 'ui_update' | 'state_change' | 'notification' | 'validation' | 'sync';
  
  /** Description of the side effect */
  description: string;
  
  /** Additional data about the side effect */
  data?: any;
}

/**
 * Batch command that contains multiple sub-commands
 * Useful for operations like "copy week" that involve multiple changes
 */
export interface BatchCommand extends UndoableCommand {
  /** Sub-commands that make up this batch */
  readonly commands: UndoableCommand[];
  
  /** Whether to stop on first failure or continue */
  readonly stopOnFailure: boolean;
}

/**
 * Factory interface for creating commands from different data sources
 */
export interface CommandFactory {
  /**
   * Create a command from a pending change
   * @param change The change to convert to a command
   * @returns The created command
   */
  createFromChange(change: any): UndoableCommand;
  
  /**
   * Create a batch command from multiple changes
   * @param changes Array of changes to convert
   * @param description Description for the batch operation
   * @returns The created batch command
   */
  createBatchFromChanges(changes: any[], description: string): BatchCommand;
  
  /**
   * Validate that a command can be created from the given data
   * @param data The data to validate
   * @returns True if command can be created
   */
  canCreateCommand(data: any): boolean;
}