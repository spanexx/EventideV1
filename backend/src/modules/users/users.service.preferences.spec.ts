import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from './users.service';
import { User } from './user.schema';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';

describe('UsersService - User Preferences', () => {
  let service: UsersService;
  let userModel: Model<User>;

  // Mock user data
  const mockUser = {
    _id: 'test-user-id',
    email: 'test@example.com',
    preferences: {
      theme: 'dark',
      language: 'en',
      timezone: 'America/New_York',
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      calendar: {
        defaultView: 'week',
        firstDayOfWeek: 1,
        workingHours: {
          start: '09:00',
          end: '17:00',
        },
      },
    },
    save: jest.fn(),
  };

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
      providers: [
        UsersService,
        {
          provide: getModelToken('User'),
          useValue: {
            findById: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userModel = module.get<Model<User>>(getModelToken('User'));

    // Reset mocks
    jest.clearAllMocks();
    mockUser.save.mockResolvedValue(mockUser);
  });

  describe('getUserPreferences', () => {
    it('should return user preferences successfully', async () => {
      // Arrange
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);

      // Act
      const result = await service.getUserPreferences('test-user-id');

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith('test-user-id');
      expect(result).toEqual({
        id: 'test-user-id',
        theme: 'dark',
        language: 'en',
        timezone: 'America/New_York',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
        calendar: {
          defaultView: 'week',
          firstDayOfWeek: 1,
          workingHours: {
            start: '09:00',
            end: '17:00',
          },
        },
      });
    });

    it('should return default preferences when user has none', async () => {
      // Arrange
      const userWithoutPreferences = {
        ...mockUser,
        preferences: null,
      };
      (userModel.findById as jest.Mock).mockResolvedValue(
        userWithoutPreferences,
      );

      // Act
      const result = await service.getUserPreferences('test-user-id');

      // Assert
      expect(result).toEqual({
        id: 'test-user-id',
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          sms: false,
          push: false,
        },
        calendar: {
          defaultView: 'week',
          firstDayOfWeek: 1,
          workingHours: {
            start: '09:00',
            end: '17:00',
          },
        },
      });
    });

    it('should throw error when user not found', async () => {
      // Arrange
      (userModel.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getUserPreferences('non-existent-id'),
      ).rejects.toThrow('User not found');
      expect(userModel.findById).toHaveBeenCalledWith('non-existent-id');
    });

    it('should handle database errors', async () => {
      // Arrange
      (userModel.findById as jest.Mock).mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(service.getUserPreferences('test-user-id')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('updateUserPreferences', () => {
    const updateDto: UpdateUserPreferencesDto = {
      theme: 'light',
      notifications: {
        email: false,
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
      const updatedUser = {
        ...mockUser,
        preferences: {
          ...mockUser.preferences,
          theme: 'light',
          notifications: {
            ...mockUser.preferences.notifications,
            email: false,
          },
          calendar: {
            ...mockUser.preferences.calendar,
            defaultView: 'month',
            workingHours: {
              start: '08:00',
              end: '18:00',
            },
          },
        },
      };
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
      mockUser.save.mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateUserPreferences(
        'test-user-id',
        updateDto,
      );

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith('test-user-id');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.theme).toEqual('light');
      expect(result.notifications.email).toEqual(false);
      expect(result.notifications.sms).toEqual(false); // Preserved
      expect(result.calendar.defaultView).toEqual('month');
      expect(result.calendar.firstDayOfWeek).toEqual(1); // Preserved
    });

    it('should create preferences when user has none', async () => {
      // Arrange
      const userWithoutPreferences = {
        ...mockUser,
        preferences: null,
      };
      (userModel.findById as jest.Mock).mockResolvedValue(
        userWithoutPreferences,
      );
      const userWithNewPreferences = {
        ...userWithoutPreferences,
        preferences: {
          theme: 'light',
          notifications: {
            email: false,
            sms: false,
            push: false,
          },
          calendar: {
            defaultView: 'month',
            firstDayOfWeek: 1,
            workingHours: {
              start: '08:00',
              end: '18:00',
            },
          },
        },
      };
      userWithoutPreferences.save = jest
        .fn()
        .mockResolvedValue(userWithNewPreferences);

      // Act
      const result = await service.updateUserPreferences(
        'test-user-id',
        updateDto,
      );

      // Assert
      expect(result.theme).toEqual('light');
      expect(result.notifications.email).toEqual(false);
      expect(result.calendar.defaultView).toEqual('month');
    });

    it('should handle partial updates correctly', async () => {
      // Arrange
      const partialUpdateDto: UpdateUserPreferencesDto = {
        theme: 'dark',
      };
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
      const updatedUser = {
        ...mockUser,
        preferences: {
          ...mockUser.preferences,
          theme: 'dark',
        },
      };
      mockUser.save.mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateUserPreferences(
        'test-user-id',
        partialUpdateDto,
      );

      // Assert
      expect(result.theme).toEqual('dark');
      expect(result.language).toEqual('en'); // Should remain unchanged
      expect(result.notifications).toEqual(mockUser.preferences.notifications); // Should remain unchanged
    });

    it('should handle nested object updates correctly', async () => {
      // Arrange
      const nestedUpdateDto: UpdateUserPreferencesDto = {
        notifications: {
          email: true,
          sms: true,
        },
      };
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
      const updatedUser = {
        ...mockUser,
        preferences: {
          ...mockUser.preferences,
          notifications: {
            email: true,
            sms: true,
            push: true, // Should preserve existing value
          },
        },
      };
      mockUser.save.mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateUserPreferences(
        'test-user-id',
        nestedUpdateDto,
      );

      // Assert
      expect(result.notifications.email).toEqual(true);
      expect(result.notifications.sms).toEqual(true);
      expect(result.notifications.push).toEqual(true); // Preserved
    });

    it('should throw error when user not found', async () => {
      // Arrange
      (userModel.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateUserPreferences('non-existent-id', updateDto),
      ).rejects.toThrow('User not found');
    });

    it('should handle save errors', async () => {
      // Arrange
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
      const saveError = new Error('Failed to save user');
      mockUser.save.mockRejectedValue(saveError);

      // Act & Assert
      await expect(
        service.updateUserPreferences('test-user-id', updateDto),
      ).rejects.toThrow('Failed to save user');
    });
  });

  describe('resetUserPreferences', () => {
    it('should reset user preferences to defaults successfully', async () => {
      // Arrange
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
      const resetUser = {
        ...mockUser,
        preferences: {
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            sms: false,
            push: false,
          },
          calendar: {
            defaultView: 'week',
            firstDayOfWeek: 1,
            workingHours: {
              start: '09:00',
              end: '17:00',
            },
          },
        },
      };
      mockUser.save.mockResolvedValue(resetUser);

      // Act
      const result = await service.resetUserPreferences('test-user-id');

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith('test-user-id');
      expect(mockUser.save).toHaveBeenCalled();
      expect(result).toEqual({
        id: 'test-user-id',
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          sms: false,
          push: false,
        },
        calendar: {
          defaultView: 'week',
          firstDayOfWeek: 1,
          workingHours: {
            start: '09:00',
            end: '17:00',
          },
        },
      });
    });

    it('should reset preferences when user has no existing preferences', async () => {
      // Arrange
      const userWithoutPreferences = {
        ...mockUser,
        preferences: null,
      };
      (userModel.findById as jest.Mock).mockResolvedValue(
        userWithoutPreferences,
      );
      const userWithDefaults = {
        ...userWithoutPreferences,
        preferences: {
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: true,
            sms: false,
            push: false,
          },
          calendar: {
            defaultView: 'week',
            firstDayOfWeek: 1,
            workingHours: {
              start: '09:00',
              end: '17:00',
            },
          },
        },
      };
      userWithoutPreferences.save = jest
        .fn()
        .mockResolvedValue(userWithDefaults);

      // Act
      const result = await service.resetUserPreferences('test-user-id');

      // Assert
      expect(result).toEqual({
        id: 'test-user-id',
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          sms: false,
          push: false,
        },
        calendar: {
          defaultView: 'week',
          firstDayOfWeek: 1,
          workingHours: {
            start: '09:00',
            end: '17:00',
          },
        },
      });
    });

    it('should throw error when user not found', async () => {
      // Arrange
      (userModel.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.resetUserPreferences('non-existent-id'),
      ).rejects.toThrow('User not found');
    });

    it('should handle save errors during reset', async () => {
      // Arrange
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
      const saveError = new Error('Failed to reset preferences');
      mockUser.save.mockRejectedValue(saveError);

      // Act & Assert
      await expect(
        service.resetUserPreferences('test-user-id'),
      ).rejects.toThrow('Failed to reset preferences');
    });
  });

  describe('Preference merging logic', () => {
    it('should merge nested preferences correctly', async () => {
      // Arrange
      const updateDto: UpdateUserPreferencesDto = {
        calendar: {
          workingHours: {
            start: '10:00',
            // Note: 'end' is not provided, should be preserved
          },
        },
      };
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
      const updatedUser = {
        ...mockUser,
        preferences: {
          ...mockUser.preferences,
          calendar: {
            defaultView: 'week', // Should be preserved
            firstDayOfWeek: 1, // Should be preserved
            workingHours: {
              start: '10:00', // Updated
              end: '17:00', // Preserved
            },
          },
        },
      };
      mockUser.save.mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateUserPreferences(
        'test-user-id',
        updateDto,
      );

      // Assert
      expect(result.calendar.defaultView).toEqual('week'); // Preserved
      expect(result.calendar.firstDayOfWeek).toEqual(1); // Preserved
      expect(result.calendar.workingHours.start).toEqual('10:00'); // Updated
      expect(result.calendar.workingHours.end).toEqual('17:00'); // Preserved
    });

    it('should handle empty update object gracefully', async () => {
      // Arrange
      const emptyUpdateDto: UpdateUserPreferencesDto = {};
      (userModel.findById as jest.Mock).mockResolvedValue(mockUser);
      mockUser.save.mockResolvedValue(mockUser);

      // Act
      const result = await service.updateUserPreferences(
        'test-user-id',
        emptyUpdateDto,
      );

      // Assert
      expect(result).toEqual({
        id: 'test-user-id',
        theme: 'dark',
        language: 'en',
        timezone: 'America/New_York',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
        calendar: {
          defaultView: 'week',
          firstDayOfWeek: 1,
          workingHours: {
            start: '09:00',
            end: '17:00',
          },
        },
      });
    });
  });
});
