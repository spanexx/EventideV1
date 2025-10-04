import { TestBed } from '@angular/core/testing';
import { AvailabilityCreateCommand } from './availability-create-command';
import { AvailabilityUpdateCommand } from './availability-update-command';
import { AvailabilityDeleteCommand } from './availability-delete-command';
import { AvailabilityMoveCommand } from './availability-move-command';
import { AvailabilityResizeCommand } from './availability-resize-command';
import { PendingChangesService } from '../../pending-changes/pending-changes.service';
import { Change } from '../../pending-changes/pending-changes.interface';
import { Availability } from '../../../shared/models/availability.dto';
import { CommandType } from '../types/command-types';

describe('Availability Commands', () => {
  let pendingChangesService: jasmine.SpyObj<PendingChangesService>;
  let mockAvailability: Availability;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('PendingChangesService', [
      'addChange', 
      'removeChange', 
      'getPendingChanges', 
      'getCurrentState'
    ]);

    TestBed.configureTestingModule({
      providers: [
        { provide: PendingChangesService, useValue: spy }
      ]
    });

    pendingChangesService = TestBed.inject(PendingChangesService) as jasmine.SpyObj<PendingChangesService>;
    
    mockAvailability = {
      id: 'test-id',
      providerId: 'provider-1',
      type: 'one_off',
      startTime: new Date('2023-12-25T10:00:00Z'),
      endTime: new Date('2023-12-25T11:00:00Z'),
      duration: 60,
      isBooked: false,
      date: new Date('2023-12-25'),
      dayOfWeek: 1
    };
  });

  describe('AvailabilityCreateCommand', () => {
    it('should create and execute successfully', async () => {
      const command = new AvailabilityCreateCommand(
        'test-command',
        {
          availability: mockAvailability,
          tempId: 'temp-id',
          batchOperation: false
        },
        new Date(),
        pendingChangesService
      );

      expect(command.type).toBe(CommandType.CREATE_AVAILABILITY);
      expect(command.canExecute()).toBe(true);

      const result = await command.execute();
      expect(result.success).toBe(true);
      expect(result.undoable).toBe(true);
      expect(pendingChangesService.addChange).toHaveBeenCalled();
    });

    it('should create from change object', () => {
      const change: Change = {
        id: 'change-1',
        type: 'create',
        entity: mockAvailability,
        timestamp: new Date()
      };

      const command = AvailabilityCreateCommand.fromChange(change, pendingChangesService);
      expect(command).toBeInstanceOf(AvailabilityCreateCommand);
      expect(command.data.tempId).toBe(mockAvailability.id);
    });
  });

  describe('AvailabilityUpdateCommand', () => {
    it('should create and execute successfully', async () => {
      const previousState = { ...mockAvailability };
      const newState = { ...mockAvailability, duration: 90 };

      const command = new AvailabilityUpdateCommand(
        'test-command',
        {
          slotId: mockAvailability.id,
          previousState,
          newState,
          changedProperties: ['duration'],
          cascadingChanges: false
        },
        new Date(),
        pendingChangesService
      );

      expect(command.type).toBe(CommandType.UPDATE_AVAILABILITY);
      expect(command.canExecute()).toBe(true);

      const result = await command.execute();
      expect(result.success).toBe(true);
      expect(result.undoable).toBe(true);
      expect(pendingChangesService.addChange).toHaveBeenCalled();
    });

    it('should identify changed properties', () => {
      const previous = { ...mockAvailability };
      const current = { ...mockAvailability, duration: 90, isBooked: true };

      const changedProperties = AvailabilityUpdateCommand.getChangedProperties(previous, current);
      expect(changedProperties).toContain('duration');
      expect(changedProperties).toContain('isBooked');
      expect(changedProperties).not.toContain('startTime');
    });
  });

  describe('AvailabilityDeleteCommand', () => {
    it('should create and execute successfully', async () => {
      const command = new AvailabilityDeleteCommand(
        'test-command',
        {
          availability: mockAvailability,
          position: 0,
          cleanup: false,
          relatedSlots: []
        },
        new Date(),
        pendingChangesService
      );

      expect(command.type).toBe(CommandType.DELETE_AVAILABILITY);
      expect(command.canExecute()).toBe(true);

      const result = await command.execute();
      expect(result.success).toBe(true);
      expect(result.undoable).toBe(true);
      expect(pendingChangesService.addChange).toHaveBeenCalled();
    });

    it('should validate command data', () => {
      const validData = {
        availability: mockAvailability,
        position: 0,
        cleanup: false,
        relatedSlots: []
      };

      expect(AvailabilityDeleteCommand.validate(validData)).toBe(true);

      const invalidData = {
        availability: { ...mockAvailability, id: '' },
        position: 0,
        cleanup: false,
        relatedSlots: []
      };

      expect(AvailabilityDeleteCommand.validate(invalidData)).toBe(false);
    });
  });

  describe('AvailabilityMoveCommand', () => {
    it('should create and execute successfully', async () => {
      pendingChangesService.getCurrentState.and.returnValue([mockAvailability]);

      const command = new AvailabilityMoveCommand(
        'test-command',
        {
          slotId: mockAvailability.id,
          previousPosition: {
            startTime: new Date('2023-12-25T10:00:00Z'),
            endTime: new Date('2023-12-25T11:00:00Z'),
            date: new Date('2023-12-25')
          },
          newPosition: {
            startTime: new Date('2023-12-25T14:00:00Z'),
            endTime: new Date('2023-12-25T15:00:00Z'),
            date: new Date('2023-12-25')
          },
          duration: 60,
          timezoneConverted: false
        },
        new Date(),
        pendingChangesService
      );

      expect(command.type).toBe(CommandType.MOVE_AVAILABILITY);
      expect(command.canExecute()).toBe(true);

      const result = await command.execute();
      expect(result.success).toBe(true);
      expect(result.undoable).toBe(true);
      expect(pendingChangesService.addChange).toHaveBeenCalled();
    });

    it('should calculate move distance', () => {
      const from = {
        startTime: new Date('2023-12-25T10:00:00Z'),
        endTime: new Date('2023-12-25T11:00:00Z')
      };
      const to = {
        startTime: new Date('2023-12-25T14:00:00Z'),
        endTime: new Date('2023-12-25T15:00:00Z')
      };

      const distance = AvailabilityMoveCommand.getMoveDistance(from, to);
      expect(distance).toBe(240); // 4 hours = 240 minutes
    });
  });

  describe('AvailabilityResizeCommand', () => {
    it('should create and execute successfully', async () => {
      pendingChangesService.getCurrentState.and.returnValue([mockAvailability]);

      const command = new AvailabilityResizeCommand(
        'test-command',
        {
          slotId: mockAvailability.id,
          previousDuration: 60,
          newDuration: 90,
          previousEndTime: new Date('2023-12-25T11:00:00Z'),
          newEndTime: new Date('2023-12-25T11:30:00Z'),
          resizeDirection: 'end',
          minDuration: 15
        },
        new Date(),
        pendingChangesService
      );

      expect(command.type).toBe(CommandType.RESIZE_AVAILABILITY);
      expect(command.canExecute()).toBe(true);

      const result = await command.execute();
      expect(result.success).toBe(true);
      expect(result.undoable).toBe(true);
      expect(pendingChangesService.addChange).toHaveBeenCalled();
    });

    it('should calculate resize delta', () => {
      const data = {
        slotId: 'test',
        previousDuration: 60,
        newDuration: 90,
        previousEndTime: new Date(),
        newEndTime: new Date(),
        resizeDirection: 'end' as const,
        minDuration: 15
      };

      expect(AvailabilityResizeCommand.getResizeDelta(data)).toBe(30);
      expect(AvailabilityResizeCommand.isExtension(data)).toBe(true);
      expect(AvailabilityResizeCommand.getPercentageChange(data)).toBe(50);
    });
  });

  describe('Command Integration', () => {
    it('should handle undo/redo cycles correctly', async () => {
      const command = new AvailabilityCreateCommand(
        'test-command',
        {
          availability: mockAvailability,
          tempId: 'temp-id',
          batchOperation: false
        },
        new Date(),
        pendingChangesService
      );

      // Execute
      const executeResult = await command.execute();
      expect(executeResult.success).toBe(true);
      expect(executeResult.undoable).toBe(true);
      expect(executeResult.redoable).toBe(false);

      // Undo
      const undoResult = await command.undo();
      expect(undoResult.success).toBe(true);
      expect(undoResult.undoable).toBe(false);
      expect(undoResult.redoable).toBe(true);

      // Redo
      const redoResult = await command.redo();
      expect(redoResult.success).toBe(true);
      expect(redoResult.undoable).toBe(true);
      expect(redoResult.redoable).toBe(false);
    });

    it('should provide descriptive messages', () => {
      const createCommand = new AvailabilityCreateCommand(
        'test-command',
        {
          availability: mockAvailability,
          tempId: 'temp-id',
          batchOperation: false
        },
        new Date(),
        pendingChangesService
      );

      const deleteCommand = new AvailabilityDeleteCommand(
        'test-command',
        {
          availability: mockAvailability,
          position: 0,
          cleanup: false,
          relatedSlots: []
        },
        new Date(),
        pendingChangesService
      );

      expect(createCommand.description).toContain('Create availability slot');
      expect(createCommand.description).toContain('10:00:00 AM');
      expect(deleteCommand.description).toContain('Delete availability slot');
      expect(deleteCommand.description).toContain('10:00:00 AM');
    });
  });
});