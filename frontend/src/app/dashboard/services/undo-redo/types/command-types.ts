import { Availability } from '../../../models/availability.models';
import { Change } from '../../pending-changes/pending-changes.interface';

/**
 * All supported command types in the system
 */
export enum CommandType {
  // Availability commands
  CREATE_AVAILABILITY = 'CREATE_AVAILABILITY',
  UPDATE_AVAILABILITY = 'UPDATE_AVAILABILITY',
  DELETE_AVAILABILITY = 'DELETE_AVAILABILITY',
  MOVE_AVAILABILITY = 'MOVE_AVAILABILITY',
  RESIZE_AVAILABILITY = 'RESIZE_AVAILABILITY',
  
  // Batch operations
  COPY_WEEK = 'COPY_WEEK',
  BULK_CREATE = 'BULK_CREATE',
  BULK_UPDATE = 'BULK_UPDATE',
  BULK_DELETE = 'BULK_DELETE',
  
  // System commands
  SAVE_CHANGES = 'SAVE_CHANGES',
  DISCARD_CHANGES = 'DISCARD_CHANGES',
  REFRESH_DATA = 'REFRESH_DATA'
}

/**
 * Data structure for create availability command
 */
export interface CreateAvailabilityCommandData {
  /** The availability slot to create */
  availability: Omit<Availability, 'id'>;
  
  /** Temporary ID assigned to the slot */
  tempId: string;
  
  /** Whether this is part of a batch operation */
  batchOperation?: boolean;
  
  /** Position to insert in the list */
  position?: number;
}

/**
 * Data structure for update availability command
 */
export interface UpdateAvailabilityCommandData {
  /** ID of the slot to update */
  slotId: string;
  
  /** Previous state for undo */
  previousState: Availability;
  
  /** New state after update */
  newState: Availability;
  
  /** Properties that were changed */
  changedProperties: string[];
  
  /** Whether this affects other slots */
  cascadingChanges?: boolean;
}

/**
 * Data structure for delete availability command
 */
export interface DeleteAvailabilityCommandData {
  /** The slot to delete */
  availability: Availability;
  
  /** Position where it was located */
  position: number;
  
  /** Whether this is part of cleanup */
  cleanup?: boolean;
  
  /** Related slots that might be affected */
  relatedSlots?: string[];
}

/**
 * Data structure for move availability command
 */
export interface MoveAvailabilityCommandData {
  /** ID of the slot to move */
  slotId: string;
  
  /** Previous position information */
  previousPosition: {
    startTime: Date;
    endTime: Date;
    date?: Date;
  };
  
  /** New position information */
  newPosition: {
    startTime: Date;
    endTime: Date;
    date?: Date;
  };
  
  /** Duration of the move operation */
  duration: number;
  
  /** Whether time zone conversion was applied */
  timezoneConverted?: boolean;
}

/**
 * Data structure for resize availability command
 */
export interface ResizeAvailabilityCommandData {
  /** ID of the slot to resize */
  slotId: string;
  
  /** Previous duration */
  previousDuration: number;
  
  /** New duration */
  newDuration: number;
  
  /** Previous end time */
  previousEndTime: Date;
  
  /** New end time */
  newEndTime: Date;
  
  /** Which end was resized */
  resizeDirection: 'start' | 'end';
  
  /** Minimum allowed duration */
  minDuration?: number;
}

/**
 * Data structure for copy week command
 */
export interface CopyWeekCommandData {
  /** Source week start date */
  sourceWeek: Date;
  
  /** Target week start date */
  targetWeek: Date;
  
  /** Slots that were copied */
  copiedSlots: Availability[];
  
  /** Slots that were created */
  createdSlots: Availability[];
  
  /** Conflict resolution strategy used */
  conflictResolution: 'skip' | 'replace';
  
  /** Any conflicts that were encountered */
  conflicts?: string[];
}

/**
 * Data structure for bulk operations
 */
export interface BulkOperationCommandData {
  /** Type of bulk operation */
  operationType: 'create' | 'update' | 'delete';
  
  /** Individual operations in the bulk */
  operations: Array<{
    slotId?: string;
    data: any;
    position?: number;
  }>;
  
  /** Total number of operations */
  totalCount: number;
  
  /** Number of successful operations */
  successCount: number;
  
  /** Number of failed operations */
  failureCount: number;
  
  /** Any errors that occurred */
  errors?: Array<{
    operation: number;
    error: Error;
  }>;
}

/**
 * Command data type mapping for type safety
 */
export interface CommandDataMap {
  [CommandType.CREATE_AVAILABILITY]: CreateAvailabilityCommandData;
  [CommandType.UPDATE_AVAILABILITY]: UpdateAvailabilityCommandData;
  [CommandType.DELETE_AVAILABILITY]: DeleteAvailabilityCommandData;
  [CommandType.MOVE_AVAILABILITY]: MoveAvailabilityCommandData;
  [CommandType.RESIZE_AVAILABILITY]: ResizeAvailabilityCommandData;
  [CommandType.COPY_WEEK]: CopyWeekCommandData;
  [CommandType.BULK_CREATE]: BulkOperationCommandData;
  [CommandType.BULK_UPDATE]: BulkOperationCommandData;
  [CommandType.BULK_DELETE]: BulkOperationCommandData;
  [CommandType.SAVE_CHANGES]: {};
  [CommandType.DISCARD_CHANGES]: {};
  [CommandType.REFRESH_DATA]: {};
}

/**
 * Helper type for getting command data type from command type
 */
export type CommandDataForType<T extends CommandType> = CommandDataMap[T];

/**
 * Mapping from Change types to Command types
 */
export const CHANGE_TO_COMMAND_TYPE_MAP: Record<Change['type'], CommandType> = {
  'create': CommandType.CREATE_AVAILABILITY,
  'update': CommandType.UPDATE_AVAILABILITY,
  'delete': CommandType.DELETE_AVAILABILITY,
  'move': CommandType.MOVE_AVAILABILITY,
  'resize': CommandType.RESIZE_AVAILABILITY
};

/**
 * Helper function to get command type from change
 */
export function getCommandTypeFromChange(change: Change): CommandType {
  return CHANGE_TO_COMMAND_TYPE_MAP[change.type] || CommandType.UPDATE_AVAILABILITY;
}

/**
 * Priority levels for commands (affects execution order)
 */
export enum CommandPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * Command metadata for additional information
 */
export interface CommandMetadata {
  /** Priority level for execution */
  priority: CommandPriority;
  
  /** Tags for categorization */
  tags: string[];
  
  /** Source of the command */
  source: 'user' | 'system' | 'automation' | 'sync';
  
  /** Whether this command should be included in analytics */
  trackable: boolean;
  
  /** Maximum execution time allowed */
  timeoutMs?: number;
  
  /** Dependencies that must be completed first */
  dependencies?: string[];
  
  /** Commands that this makes invalid */
  invalidates?: string[];
}

/**
 * Reasons why a command might fail validation
 */
export enum CommandValidationFailureReason {
  INVALID_DATA = 'INVALID_DATA',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_STATE = 'INVALID_STATE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  SYSTEM_CONSTRAINT = 'SYSTEM_CONSTRAINT'
}