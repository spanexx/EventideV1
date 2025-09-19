import { UndoableCommand, CommandResult } from '../interfaces/undoable-command.interface';
import { CommandType, UpdateAvailabilityCommandData } from '../types/command-types';
import { PendingChangesService } from '../../pending-changes/pending-changes.service';
import { Change } from '../../pending-changes/pending-changes.interface';
import { Availability } from '../../../models/availability.models';

/**
 * Command for updating existing availability slots
 * Integrates with the pending changes system for consistent state management
 */
export class AvailabilityUpdateCommand implements UndoableCommand<UpdateAvailabilityCommandData> {
  readonly type = CommandType.UPDATE_AVAILABILITY;
  
  constructor(
    public readonly id: string,
    public readonly data: UpdateAvailabilityCommandData,
    public readonly timestamp: Date,
    private pendingChangesService: PendingChangesService
  ) {}

  get description(): string {
    const startTime = this.data.newState.startTime.toLocaleTimeString();
    const date = this.data.newState.startTime.toLocaleDateString();
    const properties = this.data.changedProperties.join(', ');
    return `Update availability slot at ${startTime} on ${date} (${properties})`;
  }

  async execute(): Promise<CommandResult> {
    try {
      // Create the change object for the pending changes system
      const change: Change = {
        id: `update-${this.id}`,
        type: 'update',
        entityId: this.data.slotId,
        entity: { ...this.data.newState } as Availability,
        previousEntity: { ...this.data.previousState } as Availability,
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
            description: 'Availability slot updated in calendar',
            data: { slotId: this.data.slotId, changedProperties: this.data.changedProperties }
          },
          {
            type: 'state_change',
            description: 'Update added to pending changes',
            data: { changeId: change.id }
          }
        ],
        message: 'Availability slot updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        undoable: false,
        redoable: false,
        error: error as Error,
        message: 'Failed to update availability slot'
      };
    }
  }

  async undo(): Promise<CommandResult> {
    try {
      // Create a change to restore the previous state
      const undoChange: Change = {
        id: `undo-update-${this.id}`,
        type: 'update',
        entityId: this.data.slotId,
        entity: { ...this.data.previousState } as Availability,
        previousEntity: { ...this.data.newState } as Availability,
        timestamp: new Date()
      };

      // Remove the original update change and add the undo change
      const changeId = `update-${this.id}`;
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
            description: 'Availability slot reverted to previous state',
            data: { slotId: this.data.slotId }
          },
          {
            type: 'state_change',
            description: 'Update change removed and undo change added',
            data: { removedChangeId: changeId, addedChangeId: undoChange.id }
          }
        ],
        message: 'Availability slot update undone'
      };
    } catch (error) {
      return {
        success: false,
        undoable: false,
        redoable: false,
        error: error as Error,
        message: 'Failed to undo availability slot update'
      };
    }
  }

  async redo(): Promise<CommandResult> {
    try {
      // Remove the undo change and restore the original update
      const undoChangeId = `undo-update-${this.id}`;
      this.pendingChangesService.removeChange(undoChangeId);
      
      // Re-execute the original update
      return this.execute();
    } catch (error) {
      return {
        success: false,
        undoable: false,
        redoable: false,
        error: error as Error,
        message: 'Failed to redo availability slot update'
      };
    }
  }

  canExecute(): boolean {
    // Validate that we have valid data
    return !!(
      this.data.slotId &&
      this.data.previousState &&
      this.data.newState &&
      this.data.changedProperties &&
      this.data.changedProperties.length > 0 &&
      this.data.newState.startTime &&
      this.data.newState.endTime &&
      this.data.newState.startTime < this.data.newState.endTime
    );
  }

  canUndo(): boolean {
    // Check if the update change exists in pending changes
    const changes = this.pendingChangesService.getPendingChanges();
    return changes.some(change => change.id === `update-${this.id}`);
  }

  canRedo(): boolean {
    // Check if the undo change exists (meaning update was undone)
    const changes = this.pendingChangesService.getPendingChanges();
    return changes.some(change => change.id === `undo-update-${this.id}`);
  }

  /**
   * Factory method to create a command from a Change object
   */
  static fromChange(change: Change, pendingChangesService: PendingChangesService): AvailabilityUpdateCommand {
    if (change.type !== 'update' || !change.entity || !change.previousEntity || !change.entityId) {
      throw new Error('Invalid change object for UpdateAvailabilityCommand');
    }

    // Determine what properties changed
    const changedProperties = AvailabilityUpdateCommand.getChangedProperties(
      change.previousEntity,
      change.entity
    );

    const data: UpdateAvailabilityCommandData = {
      slotId: change.entityId,
      previousState: change.previousEntity,
      newState: change.entity,
      changedProperties,
      cascadingChanges: false
    };

    return new AvailabilityUpdateCommand(
      change.id,
      data,
      change.timestamp,
      pendingChangesService
    );
  }

  /**
   * Determine what properties changed between two availability objects
   */
  static getChangedProperties(previous: Availability, current: Availability): string[] {
    const changed: string[] = [];
    
    const propertiesToCheck = ['startTime', 'endTime', 'duration', 'type', 'isBooked', 'date'];
    
    propertiesToCheck.forEach(prop => {
      const prevValue = (previous as any)[prop];
      const currValue = (current as any)[prop];
      
      // Handle Date objects specially
      if (prop === 'startTime' || prop === 'endTime' || prop === 'date') {
        if (prevValue?.getTime() !== currValue?.getTime()) {
          changed.push(prop);
        }
      } else if (prevValue !== currValue) {
        changed.push(prop);
      }
    });
    
    return changed;
  }

  /**
   * Validate the command data
   */
  static validate(data: UpdateAvailabilityCommandData): boolean {
    if (!data.slotId || !data.previousState || !data.newState) {
      return false;
    }

    const { newState } = data;
    
    // Check required fields
    if (!newState.startTime || !newState.endTime || !newState.providerId) {
      return false;
    }

    // Check time validity
    if (newState.startTime >= newState.endTime) {
      return false;
    }

    // Check that there are actual changes
    if (!data.changedProperties || data.changedProperties.length === 0) {
      return false;
    }

    // Check duration consistency
    const calculatedDuration = Math.round(
      (newState.endTime.getTime() - newState.startTime.getTime()) / (1000 * 60)
    );
    
    if (newState.duration && Math.abs(newState.duration - calculatedDuration) > 1) {
      return false;
    }

    return true;
  }
}