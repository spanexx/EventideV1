// Core interfaces
export * from './interfaces/undoable-command.interface';
export * from './interfaces/undo-redo-state.interface';
export type {
  CommandResultCode,
  DetailedCommandResult,
  CommandError,
  StateChange,
  CommandValidationResult,
  ValidationError,
  ValidationWarning,
  CommandPerformanceMetrics,
  CommandExecutionContext
} from './interfaces/command-result.interface';

// Types
export * from './types/command-types';

// Core services
export * from './core/local-undo-redo.service';

// Command implementations
export * from './commands/availability-create-command';
export * from './commands/availability-update-command';
export * from './commands/availability-delete-command';
export * from './commands/availability-move-command';
export * from './commands/availability-resize-command';

// Factory services
export * from './factories/command-factory.service';

// Integration services
export * from './integration/pending-changes-integration.service';

// Main coordinator service
export * from './undo-redo-coordinator.service';

// Re-export for convenience
export { UndoRedoCoordinatorService as UndoRedoService } from './undo-redo-coordinator.service';