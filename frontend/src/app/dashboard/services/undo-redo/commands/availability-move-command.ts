import { UndoableCommand, CommandResult } from '../interfaces/undoable-command.interface';
import { CommandType, MoveAvailabilityCommandData } from '../types/command-types';
import { PendingChangesService } from '../../pending-changes/pending-changes.service';
import { Change } from '../../pending-changes/pending-changes.interface';
import { Availability } from '../../../models/availability.models';

/**
 * Command for moving availability slots to different times/dates
 * Integrates with the pending changes system for consistent state management
 */
export class AvailabilityMoveCommand implements UndoableCommand<MoveAvailabilityCommandData> {
  readonly type = CommandType.MOVE_AVAILABILITY;
  
  constructor(
    public readonly id: string,
    public readonly data: MoveAvailabilityCommandData,
    public readonly timestamp: Date,
    private pendingChangesService: PendingChangesService
  ) {}

  get description(): string {
    const fromTime = this.data.previousPosition.startTime.toLocaleTimeString();
    const toTime = this.data.newPosition.startTime.toLocaleTimeString();
    const fromDate = this.data.previousPosition.date?.toLocaleDateString() || 
                     this.data.previousPosition.startTime.toLocaleDateString();
    const toDate = this.data.newPosition.date?.toLocaleDateString() || 
                   this.data.newPosition.startTime.toLocaleDateString();
    
    if (fromDate === toDate) {
      return `Move availability slot from ${fromTime} to ${toTime}`;
    } else {
      return `Move availability slot from ${fromTime} on ${fromDate} to ${toTime} on ${toDate}`;
    }
  }

  async execute(): Promise<CommandResult> {
    try {
      // Get the current slot to create the updated version
      const currentSlots = this.pendingChangesService.getCurrentState();
      const currentSlot = currentSlots.find(slot => slot.id === this.data.slotId);
      
      if (!currentSlot) {
        throw new Error(`Slot with id ${this.data.slotId} not found`);
      }

      // Create the updated slot with new position
      const updatedSlot: Availability = {
        ...currentSlot,
        startTime: this.data.newPosition.startTime,
        endTime: this.data.newPosition.endTime,
        date: this.data.newPosition.date || this.data.newPosition.startTime,
        duration: this.data.duration
      };

      // Create the change object for the pending changes system
      const change: Change = {
        id: `move-${this.id}`,
        type: 'move',
        entityId: this.data.slotId,
        entity: updatedSlot,
        previousEntity: currentSlot,
        timestamp: this.timestamp
      };

      // Add to pending changes instead of directly to database
      this.pendingChangesService.addChange(change);

      return {
        success: true,
        undoable: true,
        redoable: false,
        affectedEntities: [this.data.slotId],
        sideEffects: [
          {
            type: 'ui_update',
            description: 'Availability slot moved in calendar',
            data: { 
              slotId: this.data.slotId, 
              from: this.data.previousPosition,
              to: this.data.newPosition,
              duration: this.data.duration
            }
          },
          {
            type: 'state_change',
            description: 'Move added to pending changes',
            data: { changeId: change.id }
          }
        ],
        message: 'Availability slot moved successfully'
      };
    } catch (error) {
      return {
        success: false,
        undoable: false,
        redoable: false,
        error: error as Error,
        message: 'Failed to move availability slot'
      };
    }
  }

  async undo(): Promise<CommandResult> {
    try {
      // Get the current slot to create the reverted version
      const currentSlots = this.pendingChangesService.getCurrentState();
      const currentSlot = currentSlots.find(slot => slot.id === this.data.slotId);
      
      if (!currentSlot) {
        throw new Error(`Slot with id ${this.data.slotId} not found`);
      }

      // Create the reverted slot with original position
      const revertedSlot: Availability = {
        ...currentSlot,
        startTime: this.data.previousPosition.startTime,
        endTime: this.data.previousPosition.endTime,
        date: this.data.previousPosition.date || this.data.previousPosition.startTime
      };

      // Create a change to restore the previous position
      const undoChange: Change = {
        id: `undo-move-${this.id}`,
        type: 'move',
        entityId: this.data.slotId,
        entity: revertedSlot,
        previousEntity: currentSlot,
        timestamp: new Date()
      };

      // Remove the original move change and add the undo change
      const changeId = `move-${this.id}`;
      this.pendingChangesService.removeChange(changeId);
      this.pendingChangesService.addChange(undoChange);

      return {
        success: true,
        undoable: false,
        redoable: true,
        affectedEntities: [this.data.slotId],
        sideEffects: [
          {
            type: 'ui_update',
            description: 'Availability slot moved back to original position',
            data: { 
              slotId: this.data.slotId, 
              from: this.data.newPosition,
              to: this.data.previousPosition
            }
          },
          {
            type: 'state_change',
            description: 'Move change removed and undo change added',
            data: { removedChangeId: changeId, addedChangeId: undoChange.id }
          }
        ],
        message: 'Availability slot move undone'
      };
    } catch (error) {
      return {
        success: false,
        undoable: false,
        redoable: false,
        error: error as Error,
        message: 'Failed to undo availability slot move'
      };
    }
  }

  async redo(): Promise<CommandResult> {
    try {
      // Remove the undo change and restore the original move
      const undoChangeId = `undo-move-${this.id}`;
      this.pendingChangesService.removeChange(undoChangeId);
      
      // Re-execute the original move
      return this.execute();
    } catch (error) {
      return {
        success: false,
        undoable: false,
        redoable: false,
        error: error as Error,
        message: 'Failed to redo availability slot move'
      };
    }
  }

  canExecute(): boolean {
    // Validate that we have valid data
    return !!(
      this.data.slotId &&
      this.data.previousPosition &&
      this.data.newPosition &&
      this.data.previousPosition.startTime &&
      this.data.previousPosition.endTime &&
      this.data.newPosition.startTime &&
      this.data.newPosition.endTime &&
      this.data.newPosition.startTime < this.data.newPosition.endTime &&
      this.data.duration > 0
    );
  }

  canUndo(): boolean {
    // Check if the move change exists in pending changes
    const changes = this.pendingChangesService.getPendingChanges();
    return changes.some(change => change.id === `move-${this.id}`);
  }

  canRedo(): boolean {
    // Check if the undo change exists (meaning move was undone)
    const changes = this.pendingChangesService.getPendingChanges();
    return changes.some(change => change.id === `undo-move-${this.id}`);
  }

  /**
   * Factory method to create a command from a Change object
   */
  static fromChange(change: Change, pendingChangesService: PendingChangesService): AvailabilityMoveCommand {
    if (change.type !== 'move' || !change.entity || !change.previousEntity || !change.entityId) {
      throw new Error('Invalid change object for MoveAvailabilityCommand');
    }

    const data: MoveAvailabilityCommandData = {
      slotId: change.entityId,
      previousPosition: {
        startTime: change.previousEntity.startTime,
        endTime: change.previousEntity.endTime,
        date: change.previousEntity.date
      },
      newPosition: {
        startTime: change.entity.startTime,
        endTime: change.entity.endTime,
        date: change.entity.date
      },
      duration: change.entity.duration,
      timezoneConverted: false
    };

    return new AvailabilityMoveCommand(
      change.id,
      data,
      change.timestamp,
      pendingChangesService
    );
  }

  /**
   * Factory method to create a command for moving a specific slot
   */
  static forSlot(
    slotId: string,
    fromPosition: { startTime: Date; endTime: Date; date?: Date },
    toPosition: { startTime: Date; endTime: Date; date?: Date },
    pendingChangesService: PendingChangesService,
    options?: {
      timezoneConverted?: boolean;
    }
  ): AvailabilityMoveCommand {
    const duration = Math.round(
      (toPosition.endTime.getTime() - toPosition.startTime.getTime()) / (1000 * 60)
    );

    const data: MoveAvailabilityCommandData = {
      slotId,
      previousPosition: fromPosition,
      newPosition: toPosition,
      duration,
      timezoneConverted: options?.timezoneConverted || false
    };

    const id = `move-${slotId}-${Date.now()}`;

    return new AvailabilityMoveCommand(
      id,
      data,
      new Date(),
      pendingChangesService
    );
  }

  /**
   * Validate the command data
   */
  static validate(data: MoveAvailabilityCommandData): boolean {
    if (!data.slotId || !data.previousPosition || !data.newPosition) {
      return false;
    }

    const { previousPosition, newPosition } = data;
    
    // Check required fields for previous position
    if (!previousPosition.startTime || !previousPosition.endTime) {
      return false;
    }

    // Check required fields for new position
    if (!newPosition.startTime || !newPosition.endTime) {
      return false;
    }

    // Check time validity for both positions
    if (previousPosition.startTime >= previousPosition.endTime ||
        newPosition.startTime >= newPosition.endTime) {
      return false;
    }

    // Check that positions are actually different
    if (previousPosition.startTime.getTime() === newPosition.startTime.getTime() &&
        previousPosition.endTime.getTime() === newPosition.endTime.getTime()) {
      return false;
    }

    // Check duration validity
    if (!data.duration || data.duration <= 0) {
      return false;
    }

    // Check duration consistency with new position
    const calculatedDuration = Math.round(
      (newPosition.endTime.getTime() - newPosition.startTime.getTime()) / (1000 * 60)
    );
    
    if (Math.abs(data.duration - calculatedDuration) > 1) {
      return false;
    }

    return true;
  }

  /**
   * Calculate if the move crosses timezone boundaries
   */
  static crossesTimezone(fromPosition: any, toPosition: any): boolean {
    // This would need to be implemented based on your timezone handling logic
    // For now, return false as a placeholder
    return false;
  }

  /**
   * Calculate the distance of the move (in minutes)
   */
  static getMoveDistance(fromPosition: any, toPosition: any): number {
    const timeDiff = toPosition.startTime.getTime() - fromPosition.startTime.getTime();
    return Math.abs(Math.round(timeDiff / (1000 * 60)));
  }
}