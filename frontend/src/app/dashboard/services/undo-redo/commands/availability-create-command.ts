import { UndoableCommand, CommandResult } from '../interfaces/undoable-command.interface';
import { CommandType, CreateAvailabilityCommandData } from '../types/command-types';
import { PendingChangesService } from '../../pending-changes/pending-changes.service';
import { Change } from '../../pending-changes/pending-changes.interface';
import { Availability } from '../../../models/availability.models';

/**
 * Command for creating new availability slots
 * Integrates with the pending changes system for consistent state management
 */
export class AvailabilityCreateCommand implements UndoableCommand<CreateAvailabilityCommandData> {
  readonly type = CommandType.CREATE_AVAILABILITY;
  
  constructor(
    public readonly id: string,
    public readonly data: CreateAvailabilityCommandData,
    public readonly timestamp: Date,
    private pendingChangesService: PendingChangesService
  ) {}

  get description(): string {
    const startTime = this.data.availability.startTime.toLocaleTimeString();
    const date = this.data.availability.startTime.toLocaleDateString();
    return `Create availability slot at ${startTime} on ${date}`;
  }

  async execute(): Promise<CommandResult> {
    try {
      // Create the change object for the pending changes system
      const change: Change = {
        id: `create-${this.id}`,
        type: 'create',
        entity: {
          ...this.data.availability,
          id: this.data.tempId
        } as Availability,
        timestamp: this.timestamp
      };

      // Add to pending changes instead of directly to database
      this.pendingChangesService.addChange(change);

      return {
        success: true,
        undoable: true,
        redoable: false,
        affectedEntities: [this.data.tempId],
        sideEffects: [
          {
            type: 'ui_update',
            description: 'New availability slot added to calendar',
            data: { slotId: this.data.tempId }
          },
          {
            type: 'state_change',
            description: 'Slot added to pending changes',
            data: { changeId: change.id }
          }
        ],
        message: 'Availability slot created successfully'
      };
    } catch (error) {
      return {
        success: false,
        undoable: false,
        redoable: false,
        error: error as Error,
        message: 'Failed to create availability slot'
      };
    }
  }

  async undo(): Promise<CommandResult> {
    try {
      // Remove the change from pending changes
      const changeId = `create-${this.id}`;
      this.pendingChangesService.removeChange(changeId);

      return {
        success: true,
        undoable: false,
        redoable: true,
        affectedEntities: [this.data.tempId],
        sideEffects: [
          {
            type: 'ui_update',
            description: 'Availability slot removed from calendar',
            data: { slotId: this.data.tempId }
          },
          {
            type: 'state_change',
            description: 'Change removed from pending changes',
            data: { changeId }
          }
        ],
        message: 'Availability slot creation undone'
      };
    } catch (error) {
      return {
        success: false,
        undoable: false,
        redoable: false,
        error: error as Error,
        message: 'Failed to undo availability slot creation'
      };
    }
  }

  async redo(): Promise<CommandResult> {
    // Redo is the same as execute for create operations
    return this.execute();
  }

  canExecute(): boolean {
    // Validate that we have valid data
    return !!(
      this.data.availability &&
      this.data.tempId &&
      this.data.availability.startTime &&
      this.data.availability.endTime &&
      this.data.availability.startTime < this.data.availability.endTime
    );
  }

  canUndo(): boolean {
    // Check if the change exists in pending changes
    const changes = this.pendingChangesService.getPendingChanges();
    return changes.some(change => change.id === `create-${this.id}`);
  }

  canRedo(): boolean {
    // Check if the change does NOT exist in pending changes (was undone)
    const changes = this.pendingChangesService.getPendingChanges();
    return !changes.some(change => change.id === `create-${this.id}`);
  }

  /**
   * Factory method to create a command from a Change object
   */
  static fromChange(change: Change, pendingChangesService: PendingChangesService): AvailabilityCreateCommand {
    if (change.type !== 'create' || !change.entity) {
      throw new Error('Invalid change object for CreateAvailabilityCommand');
    }

    const data: CreateAvailabilityCommandData = {
      availability: {
        providerId: change.entity.providerId,
        type: change.entity.type,
        startTime: change.entity.startTime,
        endTime: change.entity.endTime,
        duration: change.entity.duration,
        isBooked: change.entity.isBooked || false,
        date: change.entity.date,
        dayOfWeek: change.entity.dayOfWeek
      },
      tempId: change.entity.id || `temp-${Date.now()}`, // Provide fallback if id is undefined
      batchOperation: false
    };

    return new AvailabilityCreateCommand(
      change.id,
      data,
      change.timestamp,
      pendingChangesService
    );
  }

  /**
   * Validate the command data
   */
  static validate(data: CreateAvailabilityCommandData): boolean {
    if (!data.availability || !data.tempId) {
      return false;
    }

    const { availability } = data;
    
    // Check required fields
    if (!availability.startTime || !availability.endTime || !availability.providerId) {
      return false;
    }

    // Check time validity
    if (availability.startTime >= availability.endTime) {
      return false;
    }

    // Check duration consistency
    const calculatedDuration = Math.round(
      (availability.endTime.getTime() - availability.startTime.getTime()) / (1000 * 60)
    );
    
    if (availability.duration && Math.abs(availability.duration - calculatedDuration) > 1) {
      return false;
    }

    return true;
  }
}