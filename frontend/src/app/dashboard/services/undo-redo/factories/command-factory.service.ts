import { Injectable } from '@angular/core';
import { UndoableCommand, BatchCommand, CommandFactory } from '../interfaces/undoable-command.interface';
import { CommandType, getCommandTypeFromChange } from '../types/command-types';
import { Change } from '../../pending-changes/pending-changes.interface';
import { AvailabilityCreateCommand } from '../commands/availability-create-command';
import { AvailabilityUpdateCommand } from '../commands/availability-update-command';
import { AvailabilityDeleteCommand } from '../commands/availability-delete-command';
import { AvailabilityMoveCommand } from '../commands/availability-move-command';
import { AvailabilityResizeCommand } from '../commands/availability-resize-command';
import { PendingChangesService } from '../../pending-changes/pending-changes.service';

/**
 * Factory service for creating commands from various data sources
 * Follows the Factory pattern for clean, extensible command creation
 */
@Injectable({
  providedIn: 'root'
})
export class CommandFactoryService implements CommandFactory {
  
  constructor(private pendingChangesService: PendingChangesService) {}

  /**
   * Create a command from a pending change
   * @param change The change to convert to a command
   * @returns The created command
   */
  createFromChange(change: Change): UndoableCommand {
    const commandType = getCommandTypeFromChange(change);
    
    switch (commandType) {
      case CommandType.CREATE_AVAILABILITY:
        return AvailabilityCreateCommand.fromChange(change, this.pendingChangesService);
        
      case CommandType.UPDATE_AVAILABILITY:
        return AvailabilityUpdateCommand.fromChange(change, this.pendingChangesService);
        
      case CommandType.DELETE_AVAILABILITY:
        return AvailabilityDeleteCommand.fromChange(change, this.pendingChangesService);
        
      case CommandType.MOVE_AVAILABILITY:
        return AvailabilityMoveCommand.fromChange(change, this.pendingChangesService);
        
      case CommandType.RESIZE_AVAILABILITY:
        return AvailabilityResizeCommand.fromChange(change, this.pendingChangesService);
        
      default:
        throw new Error(`Unsupported command type: ${commandType}`);
    }
  }

  /**
   * Create a batch command from multiple changes
   * @param changes Array of changes to convert
   * @param description Description for the batch operation
   * @returns The created batch command
   */
  createBatchFromChanges(changes: Change[], description: string): BatchCommand {
    const commands = changes.map(change => this.createFromChange(change));
    
    return {
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      type: 'BATCH',
      data: { commands, description },
      timestamp: new Date(),
      description,
      commands,
      stopOnFailure: false,
      
      async execute() {
        const results = [];
        let allSuccessful = true;
        
        for (const command of commands) {
          const result = await command.execute();
          results.push(result);
          
          if (!result.success && this.stopOnFailure) {
            allSuccessful = false;
            break;
          }
        }
        
        return {
          success: allSuccessful,
          undoable: allSuccessful,
          redoable: false,
          affectedEntities: results.flatMap(r => r.affectedEntities || []),
          sideEffects: results.flatMap(r => r.sideEffects || []),
          message: allSuccessful ? 
            `Batch operation completed: ${description}` : 
            `Batch operation partially failed: ${description}`
        };
      },
      
      async undo() {
        const results = [];
        let allSuccessful = true;
        
        // Undo in reverse order
        for (let i = commands.length - 1; i >= 0; i--) {
          const command = commands[i];
          if (command.canUndo()) {
            const result = await command.undo();
            results.push(result);
            
            if (!result.success && this.stopOnFailure) {
              allSuccessful = false;
              break;
            }
          }
        }
        
        return {
          success: allSuccessful,
          undoable: false,
          redoable: allSuccessful,
          affectedEntities: results.flatMap(r => r.affectedEntities || []),
          sideEffects: results.flatMap(r => r.sideEffects || []),
          message: allSuccessful ? 
            `Batch operation undone: ${description}` : 
            `Batch undo partially failed: ${description}`
        };
      },
      
      async redo() {
        // Redo is the same as execute for batch operations
        return this.execute();
      },
      
      canExecute() {
        return commands.every(cmd => cmd.canExecute());
      },
      
      canUndo() {
        return commands.some(cmd => cmd.canUndo());
      },
      
      canRedo() {
        return commands.every(cmd => cmd.canRedo());
      }
    };
  }

  /**
   * Validate that a command can be created from the given data
   * @param data The data to validate
   * @returns True if command can be created
   */
  canCreateCommand(data: any): boolean {
    try {
      if (!data || typeof data !== 'object') {
        return false;
      }

      // Check if it's a Change object
      if (this.isChange(data)) {
        const commandType = getCommandTypeFromChange(data);
        return this.isCommandTypeSupported(commandType);
      }

      // Check if it's an array of changes (for batch)
      if (Array.isArray(data)) {
        return data.every(item => this.isChange(item));
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Create a command for copy week operation
   * @param sourceSlots Slots from source week
   * @param targetSlots Slots created in target week
   * @param sourceWeek Source week date
   * @param targetWeek Target week date
   * @returns Batch command for copy week operation
   */
  createCopyWeekCommand(
    sourceSlots: any[],
    targetSlots: any[],
    sourceWeek: Date,
    targetWeek: Date
  ): BatchCommand {
    // Create changes for each new slot
    const changes: Change[] = targetSlots.map(slot => ({
      id: `copy-week-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      type: 'create' as const,
      entity: slot,
      timestamp: new Date()
    }));

    const description = `Copy ${sourceSlots.length} slots from ${sourceWeek.toDateString()} to ${targetWeek.toDateString()}`;
    
    return this.createBatchFromChanges(changes, description);
  }

  /**
   * Get supported command types
   */
  getSupportedCommandTypes(): CommandType[] {
    return [
      CommandType.CREATE_AVAILABILITY,
      CommandType.UPDATE_AVAILABILITY,
      CommandType.DELETE_AVAILABILITY,
      CommandType.MOVE_AVAILABILITY,
      CommandType.RESIZE_AVAILABILITY,
      CommandType.COPY_WEEK,
      CommandType.BULK_CREATE,
      CommandType.BULK_UPDATE,
      CommandType.BULK_DELETE
    ];
  }

  /**
   * Check if a command type is supported
   */
  private isCommandTypeSupported(commandType: CommandType): boolean {
    return this.getSupportedCommandTypes().includes(commandType);
  }

  /**
   * Type guard to check if an object is a Change
   */
  private isChange(obj: any): obj is Change {
    return obj &&
           typeof obj.id === 'string' &&
           typeof obj.type === 'string' &&
           ['create', 'update', 'delete', 'move', 'resize'].includes(obj.type) &&
           obj.timestamp instanceof Date;
  }

  /**
   * Create a command with custom data
   * @param type Command type
   * @param data Command data
   * @param description Optional description
   * @returns Created command
   */
  createCustomCommand<T extends CommandType>(
    type: T,
    data: any,
    description?: string
  ): UndoableCommand {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const timestamp = new Date();

    switch (type) {
      case CommandType.CREATE_AVAILABILITY:
        return new AvailabilityCreateCommand(
          id,
          data,
          timestamp,
          this.pendingChangesService
        );
        
      default:
        throw new Error(`Custom command creation not supported for type: ${type}`);
    }
  }
}