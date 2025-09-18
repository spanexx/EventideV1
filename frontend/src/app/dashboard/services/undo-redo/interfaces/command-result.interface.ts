/**
 * Command result types and related interfaces
 */

/**
 * Standard result codes for command operations
 */
export enum CommandResultCode {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  INVALID_STATE = 'INVALID_STATE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  CONFLICT = 'CONFLICT',
  TIMEOUT = 'TIMEOUT'
}

/**
 * Detailed command execution result
 */
export interface DetailedCommandResult {
  /** Operation result code */
  code: CommandResultCode;
  
  /** Whether the operation was successful */
  success: boolean;
  
  /** Execution time in milliseconds */
  executionTime?: number;
  
  /** Memory used by the operation */
  memoryUsage?: number;
  
  /** Error details if operation failed */
  error?: CommandError;
  
  /** Entities affected by this operation */
  affectedEntities?: string[];
  
  /** State changes made by this operation */
  stateChanges?: StateChange[];
  
  /** Side effects that occurred */
  sideEffects?: SideEffect[];
  
  /** Whether this operation can be undone */
  undoable: boolean;
  
  /** Whether this operation can be redone */
  redoable: boolean;
  
  /** User-friendly message */
  message?: string;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Enhanced error information for command failures
 */
export interface CommandError {
  /** Error code for programmatic handling */
  code: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Technical details about the error */
  details?: string;
  
  /** Original error object if available */
  originalError?: Error;
  
  /** Stack trace for debugging */
  stackTrace?: string;
  
  /** Context in which the error occurred */
  context?: Record<string, any>;
  
  /** Whether this error is recoverable */
  recoverable: boolean;
  
  /** Suggested recovery actions */
  recoveryActions?: string[];
}

/**
 * Represents a state change made by a command
 */
export interface StateChange {
  /** Type of state change */
  type: 'created' | 'updated' | 'deleted' | 'moved' | 'resized';
  
  /** Entity that was changed */
  entityId: string;
  
  /** Entity type */
  entityType: string;
  
  /** Previous value (for updates) */
  previousValue?: any;
  
  /** New value */
  newValue?: any;
  
  /** Property that was changed (for updates) */
  property?: string;
  
  /** Timestamp of the change */
  timestamp: Date;
}

/**
 * Side effect of a command operation
 */
export interface SideEffect {
  /** Type of side effect */
  type: 'ui_update' | 'state_sync' | 'notification' | 'validation' | 'cache_invalidation' | 'event_emission';
  
  /** Description of what happened */
  description: string;
  
  /** Target of the side effect */
  target?: string;
  
  /** Data related to the side effect */
  data?: any;
  
  /** Whether this side effect can be undone */
  reversible: boolean;
  
  /** How to reverse this side effect */
  reversalAction?: () => void;
}

/**
 * Validation result for command operations
 */
export interface CommandValidationResult {
  /** Whether the command is valid */
  valid: boolean;
  
  /** Validation errors if any */
  errors: ValidationError[];
  
  /** Validation warnings */
  warnings: ValidationWarning[];
  
  /** Whether the command can proceed despite warnings */
  canProceed: boolean;
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Error code */
  code: string;
  
  /** Field or property that failed validation */
  field?: string;
  
  /** Error message */
  message: string;
  
  /** Expected value or format */
  expected?: any;
  
  /** Actual value that failed */
  actual?: any;
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;
  
  /** Field or property that triggered warning */
  field?: string;
  
  /** Warning message */
  message: string;
  
  /** Severity level */
  severity: 'low' | 'medium' | 'high';
}

/**
 * Performance metrics for command operations
 */
export interface CommandPerformanceMetrics {
  /** Time to execute the command */
  executionTime: number;
  
  /** Time to undo the command */
  undoTime?: number;
  
  /** Time to redo the command */
  redoTime?: number;
  
  /** Memory usage during execution */
  memoryUsage: number;
  
  /** CPU usage during execution */
  cpuUsage?: number;
  
  /** Number of DOM updates triggered */
  domUpdates?: number;
  
  /** Number of API calls made */
  apiCalls?: number;
  
  /** Size of data processed */
  dataSize?: number;
}

/**
 * Context information for command execution
 */
export interface CommandExecutionContext {
  /** User who initiated the command */
  userId?: string;
  
  /** Session ID */
  sessionId?: string;
  
  /** Current application state */
  appState?: any;
  
  /** Environment information */
  environment: {
    userAgent: string;
    platform: string;
    timestamp: Date;
  };
  
  /** Additional context data */
  metadata?: Record<string, any>;
}