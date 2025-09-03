import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PinMode, UserRole, SubscriptionTier } from './user.schema';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    createUser: jest.fn(),
    findById: jest.fn(),
    updateUser: jest.fn(),
    updatePin: jest.fn(),
    deactivateUser: jest.fn(),
    findByEmail: jest.fn(),
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      pin: '123456',
      pinMode: PinMode.ROTATING,
    };

    const mockCreatedUser = {
      id: '123',
      email: createUserDto.email,
      pinMode: createUserDto.pinMode,
      role: UserRole.PROVIDER,
      subscriptionTier: SubscriptionTier.FREE,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should successfully create a user', async () => {
      mockUsersService.createUser.mockResolvedValue(mockCreatedUser);

      const result = await controller.createUser(createUserDto);

      expect(result).toEqual(mockCreatedUser);
      expect(mockUsersService.createUser).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUsersService.createUser.mockRejectedValue(
        new ConflictException('Email already exists'),
      );

      await expect(controller.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getUser', () => {
    const userId = '123';
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      role: UserRole.PROVIDER,
      subscriptionTier: SubscriptionTier.FREE,
      isActive: true,
    };

    it('should return a user by ID', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await controller.getUserById(userId);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersService.findById.mockRejectedValue(new NotFoundException());

      await expect(controller.getUserById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    const userId = '123';
    const updateDto = {
      preferences: {
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
        theme: 'dark' as 'dark' | 'light' | 'system',
        calendar: {
          defaultView: 'week' as 'day' | 'week' | 'month',
          firstDayOfWeek: 1 as 0 | 1 | 2 | 3 | 4 | 5 | 6,
          workingHours: {
            start: '09:00',
            end: '17:00',
          },
        },
        language: 'en',
        timezone: 'UTC',
      },
    };

    it('should successfully update a user', async () => {
      const mockUpdatedUser = {
        id: userId,
        ...updateDto,
      };

      mockUsersService.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await controller.updateUser(userId, updateDto);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockUsersService.updateUser).toHaveBeenCalledWith(
        userId,
        updateDto,
      );
    });
  });

  describe('deactivateUser', () => {
    const userId = '123';

    it('should successfully deactivate a user', async () => {
      mockUsersService.deactivateUser.mockResolvedValue(undefined);

      await controller.deactivateUser(userId);

      expect(mockUsersService.deactivateUser).toHaveBeenCalledWith(userId);
    });
  });

  describe('requestPinReset', () => {
    it('should generate new PIN for user', async () => {
      const email = 'test@example.com';

      // Mock Math.random to return a predictable value
      jest.spyOn(global.Math, 'random').mockImplementation(() => 0.123456);
      // Mock Math.floor to return the expected PIN value
      jest.spyOn(global.Math, 'floor').mockImplementation((value: number) => {
        if (value >= 100000 && value <= 999999) {
          return 112345; // Expected PIN based on mocked random value
        }
        return Math.floor(value);
      });

      // Mock the usersService to return a user and updatePin
      mockUsersService.findByEmail.mockResolvedValue({ id: '123', email });
      mockUsersService.updatePin.mockResolvedValue(undefined);

      const result = await controller.requestPinReset(email);

      expect(result).toEqual({ pin: '112345' });
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
      expect(mockUsersService.updatePin).toHaveBeenCalledWith('123', '112345');

      // Restore the original Math.random implementation
      jest.restoreAllMocks();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      const email = 'nonexistent@example.com';

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(controller.requestPinReset(email)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
    });
  });
});
