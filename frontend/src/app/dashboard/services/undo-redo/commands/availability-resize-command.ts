import { UndoableCommand, CommandResult } from '../interfaces/undoable-command.interface';
import { CommandType, ResizeAvailabilityCommandData } from '../types/command-types';
import { PendingChangesService } from '../../pending-changes/pending-changes.service';
import { Change } from '../../pending-changes/pending-changes.interface';
import { Availability } from '../../../models/availability.models';

/**
 * Command for resizing availability slots (changing duration)
 * Integrates with the pending changes system for consistent state management
 */
export class AvailabilityResizeCommand implements UndoableCommand<ResizeAvailabilityCommandData> {
  readonly type = CommandType.RESIZE_AVAILABILITY;
  
  constructor(
    public readonly id: string,
    public readonly data: ResizeAvailabilityCommandData,
    public readonly timestamp: Date,
    private pendingChangesService: PendingChangesService
  ) {}

  get description(): string {
    const startTime = this.data.previousEndTime.toLocaleTimeString(); // Using the slot's start time context
    const direction = this.data.resizeDirection === 'start' ? 'start' : 'end';
    const change = this.data.newDuration > this.data.previousDuration ? 'extended' : 'shortened';
    const diff = Math.abs(this.data.newDuration - this.data.previousDuration);
    
    return `Resize availability slot ${direction} ${change} by ${diff} minutes`;
  }

  async execute(): Promise<CommandResult> {
    try {
      // Get the current slot to create the updated version
      const currentSlots = this.pendingChangesService.getCurrentState();
      const currentSlot = currentSlots.find(slot => slot.id === this.data.slotId);
      
      if (!currentSlot) {
        throw new Error(`Slot with id ${this.data.slotId} not found`);
      }

      // Create the updated slot with new duration
      const updatedSlot: Availability = {
        ...currentSlot,
        endTime: this.data.newEndTime,
        duration: this.data.newDuration
      };

      // If resizing start time, update that too
      if (this.data.resizeDirection === 'start') {
        // Calculate new start time based on duration and end time
        const newStartTime = new Date(this.data.newEndTime.getTime() - (this.data.newDuration * 60 * 1000));
        updatedSlot.startTime = newStartTime;
      }

      // Create the change object for the pending changes system
      const change: Change = {
        id: `resize-${this.id}`,
        type: 'resize',
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
            description: 'Availability slot resized in calendar',
            data: { 
              slotId: this.data.slotId, 
              direction: this.data.resizeDirection,
              previousDuration: this.data.previousDuration,
              newDuration: this.data.newDuration,
              previousEndTime: this.data.previousEndTime,
              newEndTime: this.data.newEndTime
            }
          },
          {
            type: 'state_change',
            description: 'Resize added to pending changes',
            data: { changeId: change.id }
          }
        ],
        message: 'Availability slot resized successfully'
      };
    } catch (error) {
      return {
        success: false,
        undoable: false,
        redoable: false,
        error: error as Error,
        message: 'Failed to resize availability slot'
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

      // Create the reverted slot with original duration
      const revertedSlot: Availability = {
        ...currentSlot,
        endTime: this.data.previousEndTime,
        duration: this.data.previousDuration
      };

      // If we had resized the start time, revert that too
      if (this.data.resizeDirection === 'start') {
        const originalStartTime = new Date(this.data.previousEndTime.getTime() - (this.data.previousDuration * 60 * 1000));
        revertedSlot.startTime = originalStartTime;
      }

      // Create a change to restore the previous size
      const undoChange: Change = {
        id: `undo-resize-${this.id}`,
        type: 'resize',
        entityId: this.data.slotId,
        entity: revertedSlot,
        previousEntity: currentSlot,
        timestamp: new Date()
      };

      // Remove the original resize change and add the undo change
      const changeId = `resize-${this.id}`;
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
            description: 'Availability slot reverted to original size',
            data: { 
              slotId: this.data.slotId, 
              direction: this.data.resizeDirection,
              fromDuration: this.data.newDuration,
              toDuration: this.data.previousDuration
            }
          },
          {
            type: 'state_change',
            description: 'Resize change removed and undo change added',
            data: { removedChangeId: changeId, addedChangeId: undoChange.id }
          }
        ],
        message: 'Availability slot resize undone'
      };
    } catch (error) {
      return {
        success: false,
        undoable: false,
        redoable: false,
        error: error as Error,
        message: 'Failed to undo availability slot resize'
      };
    }
  }

  async redo(): Promise<CommandResult> {
    try {
      // Remove the undo change and restore the original resize
      const undoChangeId = `undo-resize-${this.id}`;
      this.pendingChangesService.removeChange(undoChangeId);
      
      // Re-execute the original resize
      return this.execute();
    } catch (error) {
      return {
        success: false,
        undoable: false,
        redoable: false,
        error: error as Error,
        message: 'Failed to redo availability slot resize'
      };
    }
  }

  canExecute(): boolean {
    // Validate that we have valid data
    return !!(
      this.data.slotId &&
      this.data.previousDuration > 0 &&
      this.data.newDuration > 0 &&
      this.data.previousEndTime &&
      this.data.newEndTime &&
      this.data.resizeDirection &&
      ['start', 'end'].includes(this.data.resizeDirection) &&
      // Must have actual change in duration
      this.data.previousDuration !== this.data.newDuration &&
      // Check minimum duration if specified
      (!this.data.minDuration || this.data.newDuration >= this.data.minDuration)
    );
  }

  canUndo(): boolean {
    // Check if the resize change exists in pending changes
    const changes = this.pendingChangesService.getPendingChanges();
    return changes.some(change => change.id === `resize-${this.id}`);
  }

  canRedo(): boolean {
    // Check if the undo change exists (meaning resize was undone)
    const changes = this.pendingChangesService.getPendingChanges();
    return changes.some(change => change.id === `undo-resize-${this.id}`);
  }

  /**
   * Factory method to create a command from a Change object
   */
  static fromChange(change: Change, pendingChangesService: PendingChangesService): AvailabilityResizeCommand {
    if (change.type !== 'resize' || !change.entity || !change.previousEntity || !change.entityId) {
      throw new Error('Invalid change object for ResizeAvailabilityCommand');
    }

    // Determine resize direction based on what changed
    const resizeDirection = change.previousEntity.startTime.getTime() !== change.entity.startTime.getTime() 
      ? 'start' : 'end';

    const data: ResizeAvailabilityCommandData = {
      slotId: change.entityId,
      previousDuration: change.previousEntity.duration,
      newDuration: change.entity.duration,
      previousEndTime: change.previousEntity.endTime,
      newEndTime: change.entity.endTime,
      resizeDirection,
      minDuration: 15 // Default minimum duration
    };

    return new AvailabilityResizeCommand(
      change.id,
      data,
      change.timestamp,
      pendingChangesService
    );
  }

  /**
   * Factory method to create a command for resizing a specific slot
   */
  static forSlot(
    slotId: string,
    previousDuration: number,
    newDuration: number,
    previousEndTime: Date,
    newEndTime: Date,
    resizeDirection: 'start' | 'end',
    pendingChangesService: PendingChangesService,
    options?: {
      minDuration?: number;
    }
  ): AvailabilityResizeCommand {
    const data: ResizeAvailabilityCommandData = {
      slotId,
      previousDuration,
      newDuration,
      previousEndTime,
      newEndTime,
      resizeDirection,
      minDuration: options?.minDuration || 15
    };

    const id = `resize-${slotId}-${Date.now()}`;

    return new AvailabilityResizeCommand(
      id,
      data,
      new Date(),
      pendingChangesService
    );
  }

  /**
   * Validate the command data
   */
  static validate(data: ResizeAvailabilityCommandData): boolean {
    if (!data.slotId) {
      return false;
    }

    // Check duration validity
    if (data.previousDuration <= 0 || data.newDuration <= 0) {
      return false;
    }

    // Check that there's an actual change
    if (data.previousDuration === data.newDuration) {
      return false;
    }

    // Check end times
    if (!data.previousEndTime || !data.newEndTime) {
      return false;
    }

    // Check resize direction
    if (!data.resizeDirection || !['start', 'end'].includes(data.resizeDirection)) {
      return false;
    }

    // Check minimum duration if specified
    if (data.minDuration && data.newDuration < data.minDuration) {
      return false;
    }

    // Check duration consistency with end time difference
    const timeDifference = Math.abs(data.newEndTime.getTime() - data.previousEndTime.getTime());
    const expectedDurationDifference = Math.abs(data.newDuration - data.previousDuration) * 60 * 1000;
    
    // Allow 1 minute tolerance for rounding
    if (Math.abs(timeDifference - expectedDurationDifference) > 60000) {
      return false;
    }

    return true;
  }

  /**
   * Calculate the resize delta (positive for extension, negative for reduction)
   */
  static getResizeDelta(data: ResizeAvailabilityCommandData): number {
    return data.newDuration - data.previousDuration;
  }

  /**
   * Check if the resize is an extension or reduction
   */
  static isExtension(data: ResizeAvailabilityCommandData): boolean {
    return data.newDuration > data.previousDuration;
  }

  /**
   * Calculate the percentage change in duration
   */
  static getPercentageChange(data: ResizeAvailabilityCommandData): number {
    return ((data.newDuration - data.previousDuration) / data.previousDuration) * 100;
  }
}