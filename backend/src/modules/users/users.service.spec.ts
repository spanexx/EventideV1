import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument, UserRole, SubscriptionTier } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { EmailService } from '../../core/email/email.service';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<User>;

  const mockUser: Partial<UserDocument> = {
    _id: 'a uuid',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: UserRole.PROVIDER,
    subscriptionTier: SubscriptionTier.FREE,
    isActive: true,
    save: jest.fn().mockResolvedValue({}),
  };

  const mockEmailService = {
    sendWelcomeEmailPassword: jest.fn(),
    sendPinResetEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: {
            new: jest.fn().mockResolvedValue(mockUser),
            create: jest.fn().mockResolvedValue(mockUser),
            findOne: jest
              .fn()
              .mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) }),
            findById: jest
              .fn()
              .mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) }),
            find: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([mockUser]),
            }),
            findByIdAndUpdate: jest
              .fn()
              .mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) }),
            deleteOne: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            }),
          },
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<User>>(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully create a new user', async () => {
      jest
        .spyOn(model, 'findOne')
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) } as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      jest.spyOn(model, 'create').mockResolvedValue(mockUser as any);

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(mockUser);
      expect(model.findOne).toHaveBeenCalledWith({
        email: createUserDto.email,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(model.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: 'hashedPassword',
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.FREE,
        preferences: {},
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findById', () => {
    it('should return a user if found', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);
      const result = await service.findById('a uuid');
      expect(result).toEqual(mockUser);
      expect(model.findById).toHaveBeenCalledWith('a uuid');
    });

    it('should throw NotFoundException if user not found', async () => {
      jest
        .spyOn(model, 'findById')
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) } as any);

      await expect(service.findById('a uuid')).rejects.toThrow(
        NotFoundException,
      );
      expect(model.findById).toHaveBeenCalledWith('a uuid');
    });
  });

  describe('findAllActive', () => {
    it('should return all active users', async () => {
      const mockUsers = [mockUser, mockUser];
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUsers),
      } as any);

      const result = await service.findAllActive();

      expect(result).toEqual(mockUsers);
      expect(model.find).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe('updateUser', () => {
    it('should update and return user', async () => {
      const updates = {
        preferences: {
          notifications: {
            email: true,
            sms: false,
            push: true,
          },
          theme: 'dark' as 'light' | 'dark' | 'system',
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
      const updatedUser = { ...mockUser, ...updates };
      const save = jest.fn().mockResolvedValue(updatedUser);
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockUser, save }),
      } as any);

      const result = await service.updateUser('a uuid', updates);

      expect(result).toEqual(updatedUser);
      expect(save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      jest
        .spyOn(model, 'findById')
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) } as any);

      await expect(service.updateUser('a uuid', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateSubscriptionTier', () => {
    it('should update subscription tier', async () => {
      const updatedUser = {
        ...mockUser,
        subscriptionTier: SubscriptionTier.PREMIUM,
      };
      const save = jest.fn().mockResolvedValue(updatedUser);
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockUser, save }),
      } as any);

      const result = await service.updateSubscriptionTier(
        'a uuid',
        SubscriptionTier.PREMIUM,
      );

      expect(result).toEqual(updatedUser);
      expect(save).toHaveBeenCalled();
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user', async () => {
      const save = jest
        .fn()
        .mockResolvedValue({ ...mockUser, isActive: false });
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockUser, save }),
      } as any);

      await service.deactivateUser('a uuid');

      expect(save).toHaveBeenCalled();
    });
  });

  describe('verifyPin', () => {
    it('should verify pin correctly', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.verifyPin('test@example.com', '123456');

      expect(result).toBe(true);
      expect(model.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });

  describe('generatePinResetToken', () => {
    it('should generate reset token', async () => {
      const save = jest.fn().mockResolvedValue({
        ...mockUser,
        pinResetToken: 'a token',
        pinResetTokenExpires: new Date(),
      });
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockUser, save }),
      } as any);

      const result = await service.generatePinResetToken('test@example.com');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(save).toHaveBeenCalled();
    });

    it('should return null for non-existent user', async () => {
      jest
        .spyOn(model, 'findOne')
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) } as any);

      const result = await service.generatePinResetToken(
        'nonexistent@example.com',
      );

      expect(result).toBeNull();
    });
  });
});
