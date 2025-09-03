import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { UserPreferencesResponseDto } from './dto/user-preferences-response.dto';

describe('UsersController - Preferences', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    getUserPreferences: jest.fn(),
    updateUserPreferences: jest.fn(),
    resetUserPreferences: jest.fn(),
  };

  const mockRequest = {
    user: { userId: 'test-user-id' },
  } as any;

  const mockUserPreferences = {
    id: 'test-user-id',
    theme: 'dark' as const,
    language: 'en',
    timezone: 'America/New_York',
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
    calendar: {
      defaultView: 'week' as const,
      firstDayOfWeek: 1 as const,
      workingHours: {
        start: '09:00',
        end: '17:00',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyPreferences', () => {
    it('should return user preferences successfully', async () => {
      // Arrange
      mockUsersService.getUserPreferences.mockResolvedValue(
        mockUserPreferences,
      );

      // Act
      const result = await controller.getMyPreferences(mockRequest);

      // Assert
      expect(usersService.getUserPreferences).toHaveBeenCalledWith(
        'test-user-id',
      );
      expect(result).toBeInstanceOf(UserPreferencesResponseDto);
      expect(result.theme).toEqual('dark');
      expect(result.language).toEqual('en');
      expect(result.notifications.email).toEqual(true);
    });

    it('should handle getUserPreferences service errors', async () => {
      // Arrange
      const serviceError = new Error('Database connection failed');
      mockUsersService.getUserPreferences.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.getMyPreferences(mockRequest)).rejects.toThrow(
        'Database connection failed',
      );
      expect(usersService.getUserPreferences).toHaveBeenCalledWith(
        'test-user-id',
      );
    });
  });

  describe('updateMyPreferences', () => {
    const updateDto: UpdateUserPreferencesDto = {
      theme: 'light',
      notifications: {
        email: false,
        push: true,
      },
      calendar: {
        defaultView: 'month',
        workingHours: {
          start: '08:00',
          end: '18:00',
        },
      },
    };

    it('should update user preferences successfully', async () => {
      // Arrange
      const updatedPreferences = {
        ...mockUserPreferences,
        theme: 'light' as const,
        notifications: {
          ...mockUserPreferences.notifications,
          email: false,
        },
        calendar: {
          ...mockUserPreferences.calendar,
          defaultView: 'month' as const,
          workingHours: {
            start: '08:00',
            end: '18:00',
          },
        },
      };
      mockUsersService.updateUserPreferences.mockResolvedValue(
        updatedPreferences,
      );

      // Act
      const result = await controller.updateMyPreferences(
        mockRequest,
        updateDto,
      );

      // Assert
      expect(usersService.updateUserPreferences).toHaveBeenCalledWith(
        'test-user-id',
        updateDto,
      );
      expect(result).toBeInstanceOf(UserPreferencesResponseDto);
      expect(result.theme).toEqual('light');
      expect(result.notifications.email).toEqual(false);
      expect(result.calendar.defaultView).toEqual('month');
      expect(result.calendar.workingHours.start).toEqual('08:00');
    });

    it('should handle partial updates correctly', async () => {
      // Arrange
      const partialUpdateDto: UpdateUserPreferencesDto = {
        theme: 'dark',
      };
      const updatedPreferences = {
        ...mockUserPreferences,
        theme: 'dark' as const,
      };
      mockUsersService.updateUserPreferences.mockResolvedValue(
        updatedPreferences,
      );

      // Act
      const result = await controller.updateMyPreferences(
        mockRequest,
        partialUpdateDto,
      );

      // Assert
      expect(usersService.updateUserPreferences).toHaveBeenCalledWith(
        'test-user-id',
        partialUpdateDto,
      );
      expect(result.theme).toEqual('dark');
      // Other properties should remain unchanged
      expect(result.language).toEqual('en');
      expect(result.notifications.email).toEqual(true);
    });

    it('should handle updateUserPreferences service errors', async () => {
      // Arrange
      const serviceError = new Error('Validation failed');
      mockUsersService.updateUserPreferences.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(
        controller.updateMyPreferences(mockRequest, updateDto),
      ).rejects.toThrow('Validation failed');
      expect(usersService.updateUserPreferences).toHaveBeenCalledWith(
        'test-user-id',
        updateDto,
      );
    });

    it('should handle nested object updates correctly', async () => {
      // Arrange
      const nestedUpdateDto: UpdateUserPreferencesDto = {
        notifications: {
          email: true,
          sms: true,
        },
      };
      const updatedPreferences = {
        ...mockUserPreferences,
        notifications: {
          email: true,
          sms: true,
          push: true, // Should preserve existing value
        },
      };
      mockUsersService.updateUserPreferences.mockResolvedValue(
        updatedPreferences,
      );

      // Act
      const result = await controller.updateMyPreferences(
        mockRequest,
        nestedUpdateDto,
      );

      // Assert
      expect(result.notifications.email).toEqual(true);
      expect(result.notifications.sms).toEqual(true);
      expect(result.notifications.push).toEqual(true); // Preserved
    });
  });

  describe('resetMyPreferences', () => {
    const defaultPreferences = {
      id: 'test-user-id',
      theme: 'system' as const,
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        sms: false,
        push: false,
      },
      calendar: {
        defaultView: 'week' as const,
        firstDayOfWeek: 1 as const,
        workingHours: {
          start: '09:00',
          end: '17:00',
        },
      },
    };

    it('should reset user preferences to defaults successfully', async () => {
      // Arrange
      mockUsersService.resetUserPreferences.mockResolvedValue(
        defaultPreferences,
      );

      // Act
      const result = await controller.resetMyPreferences(mockRequest);

      // Assert
      expect(usersService.resetUserPreferences).toHaveBeenCalledWith(
        'test-user-id',
      );
      expect(result).toBeInstanceOf(UserPreferencesResponseDto);
      expect(result.theme).toEqual('system');
      expect(result.language).toEqual('en');
      expect(result.timezone).toEqual('UTC');
      expect(result.notifications.email).toEqual(true);
      expect(result.notifications.sms).toEqual(false);
      expect(result.notifications.push).toEqual(false);
      expect(result.calendar.defaultView).toEqual('week');
      expect(result.calendar.firstDayOfWeek).toEqual(1);
    });

    it('should handle resetUserPreferences service errors', async () => {
      // Arrange
      const serviceError = new Error('Reset operation failed');
      mockUsersService.resetUserPreferences.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(controller.resetMyPreferences(mockRequest)).rejects.toThrow(
        'Reset operation failed',
      );
      expect(usersService.resetUserPreferences).toHaveBeenCalledWith(
        'test-user-id',
      );
    });
  });

  describe('Request validation', () => {
    it('should handle missing user in request', async () => {
      // Arrange
      const invalidRequest = {} as any;

      // Act & Assert
      await expect(
        controller.getMyPreferences(invalidRequest),
      ).rejects.toThrow();
    });

    it('should handle invalid user ID format', async () => {
      // Arrange
      const invalidRequest = {
        user: { userId: null },
      } as any;
      mockUsersService.getUserPreferences.mockRejectedValue(
        new Error('Invalid user ID'),
      );

      // Act & Assert
      await expect(controller.getMyPreferences(invalidRequest)).rejects.toThrow(
        'Invalid user ID',
      );
    });
  });

  describe('Response formatting', () => {
    it('should return properly formatted UserPreferencesResponseDto', async () => {
      // Arrange
      mockUsersService.getUserPreferences.mockResolvedValue(
        mockUserPreferences,
      );

      // Act
      const result = await controller.getMyPreferences(mockRequest);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          theme: 'dark',
          language: 'en',
          timezone: 'America/New_York',
        }),
      );
      expect(result.notifications).toEqual(
        expect.objectContaining({
          email: true,
          sms: false,
          push: true,
        }),
      );
      expect(result.calendar).toEqual(
        expect.objectContaining({
          defaultView: 'week',
          firstDayOfWeek: 1,
        }),
      );
      expect(result.calendar.workingHours).toEqual(
        expect.objectContaining({
          start: '09:00',
          end: '17:00',
        }),
      );
    });
  });
});
