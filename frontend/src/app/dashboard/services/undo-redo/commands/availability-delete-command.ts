import { UndoableCommand, CommandResult } from '../interfaces/undoable-command.interface';
import { CommandType, DeleteAvailabilityCommandData } from '../types/command-types';
import { PendingChangesService } from '../../pending-changes/pending-changes.service';
import { Change } from '../../pending-changes/pending-changes.interface';
import { Availability } from '../../../models/availability.models';

/**
 * Command for deleting availability slots
 * Integrates with the pending changes system for consistent state management
 */
export class AvailabilityDeleteCommand implements UndoableCommand<DeleteAvailabilityCommandData> {
  readonly type = CommandType.DELETE_AVAILABILITY;
  
  constructor(
    public readonly id: string,
    public readonly data: DeleteAvailabilityCommandData,
    public readonly timestamp: Date,
    private pendingChangesService: PendingChangesService
  ) {}

  get description(): string {
    const startTime = this.data.availability.startTime.toLocaleTimeString();
    const date = this.data.availability.startTime.toLocaleDateString();
    return `Delete availability slot at ${startTime} on ${date}`;
  }

  async execute(): Promise<CommandResult> {
    try {
      // Create the change object for the pending changes system
      const change: Change = {
        id: `delete-${this.id}`,
        type: 'delete',
        entityId: this.data.availability.id,
        previousEntity: { ...this.data.availability } as Availability,
        timestamp: this.timestamp
      };

      // Add to pending changes instead of directly to database
      this.pendingChangesService.addChange(change);

      return {
        success: true,
        undoable: true,
        redoable: false,
        affectedEntities: [this.data.availability.id!], // Add non-null assertion
        sideEffects: [
          {
            type: 'ui_update',
            description: 'Availability slot removed from calendar',
            data: { slotId: this.data.availability.id, position: this.data.position }
          },
          {
            type: 'state_change',
            description: 'Delete added to pending changes',
            data: { changeId: change.id }
          }
        ],
        message: 'Availability slot deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        undoable: false,
        redoable: false,
        error: error as Error,
        message: 'Failed to delete availability slot'
      };
    }
  }

  async undo(): Promise<CommandResult> {
    try {
      // Create a change to restore the deleted slot
      const undoChange: Change = {
        id: `undo-delete-${this.id}`,
        type: 'create',
        entity: { ...this.data.availability } as Availability,
        timestamp: new Date()
      };

      // Remove the original delete change and add the restore change
      const changeId = `delete-${this.id}`;
      this.pendingChangesService.removeChange(changeId);
      this.pendingChangesService.addChange(undoChange);

      return {
        success: true,
        undoable: false,
        redoable: true,
        affectedEntities: [this.data.availability.id!], // Add non-null assertion
        sideEffects: [
          {
            type: 'ui_update',
            description: 'Availability slot restored to calendar',
            data: { slotId: this.data.availability.id, position: this.data.position }
          },
          {
            type: 'state_change',
            description: 'Delete change removed and restore change added',
            data: { removedChangeId: changeId, addedChangeId: undoChange.id }
          }
        ],
        message: 'Availability slot deletion undone'
      };
    } catch (error) {
      return {
        success: false,
        undoable: false,
        redoable: false,
        error: error as Error,
        message: 'Failed to undo availability slot deletion'
      };
    }
  }

  async redo(): Promise<CommandResult> {
    try {
      // Remove the undo change and restore the original delete
      const undoChangeId = `undo-delete-${this.id}`;
      this.pendingChangesService.removeChange(undoChangeId);
      
      // Re-execute the original delete
      return this.execute();
    } catch (error) {
      return {
        success: false,
        undoable: false,
        redoable: false,
        error: error as Error,
        message: 'Failed to redo availability slot deletion'
      };
    }
  }

  canExecute(): boolean {
    // Validate that we have valid data
    return !!(
      this.data.availability &&
      this.data.availability.id &&
      this.data.availability.startTime &&
      this.data.availability.endTime &&
      typeof this.data.position === 'number'
    );
  }

  canUndo(): boolean {
    // Check if the delete change exists in pending changes
    const changes = this.pendingChangesService.getPendingChanges();
    return changes.some(change => change.id === `delete-${this.id}`);
  }

  canRedo(): boolean {
    // Check if the undo change exists (meaning delete was undone)
    const changes = this.pendingChangesService.getPendingChanges();
    return changes.some(change => change.id === `undo-delete-${this.id}`);
  }

  /**
   * Factory method to create a command from a Change object
   */
  static fromChange(change: Change, pendingChangesService: PendingChangesService): AvailabilityDeleteCommand {
    if (change.type !== 'delete' || !change.previousEntity || !change.entityId) {
      throw new Error('Invalid change object for DeleteAvailabilityCommand');
    }

    const data: DeleteAvailabilityCommandData = {
      availability: change.previousEntity,
      position: 0, // Position will be determined by the calendar when this command is created
      cleanup: false,
      relatedSlots: []
    };

    return new AvailabilityDeleteCommand(
      change.id,
      data,
      change.timestamp,
      pendingChangesService
    );
  }

  /**
   * Factory method to create a command for deleting a specific slot
   */
  static forSlot(
    availability: Availability,
    position: number,
    pendingChangesService: PendingChangesService,
    options?: {
      cleanup?: boolean;
      relatedSlots?: string[];
    }
  ): AvailabilityDeleteCommand {
    const data: DeleteAvailabilityCommandData = {
      availability,
      position,
      cleanup: options?.cleanup || false,
      relatedSlots: options?.relatedSlots || []
    };

    const id = `delete-${availability.id}-${Date.now()}`;

    return new AvailabilityDeleteCommand(
      id,
      data,
      new Date(),
      pendingChangesService
    );
  }

  /**
   * Validate the command data
   */
  static validate(data: DeleteAvailabilityCommandData): boolean {
    if (!data.availability || !data.availability.id) {
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

    // Check position validity
    if (typeof data.position !== 'number' || data.position < 0) {
      return false;
    }

    return true;
  }

  /**
   * Check if this deletion might affect other slots
   */
  static hasRelatedSlots(availability: Availability, allSlots: Availability[]): boolean {
    // Check if there are other slots that might be affected by this deletion
    // For example, slots on the same day or recurring patterns
    return allSlots.some(slot => 
      slot.id !== availability.id &&
      slot.date?.getTime() === availability.date?.getTime()
    );
  }

  /**
   * Get related slots that might be affected by this deletion
   */
  static getRelatedSlots(availability: Availability, allSlots: Availability[]): string[] {
    return allSlots
      .filter(slot => 
        slot.id !== availability.id &&
        slot.id !== undefined && // Add check for undefined id
        slot.date?.getTime() === availability.date?.getTime()
      )
      .map(slot => slot.id!); // Add non-null assertion
  }
}