import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../modules/users/users.service';
import { UnauthorizedException } from '@nestjs/common';
import {
  User,
  UserDocument,
  PinMode,
  UserRole,
  SubscriptionTier,
} from '../modules/users/user.schema';
import { defaultUserPreferences } from '../modules/users/user.preferences';
import * as bcryptjs from 'bcryptjs';
import { SecurityMonitoringService } from '../core/security/security-monitoring.service';
import {
  jest,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from '@jest/globals';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const mockUser: Partial<UserDocument> = {
  id: '123',
  _id: '123',
  email: 'test@example.com',
  hashedPin: 'hashedPin',
  isActive: true,
  pinMode: PinMode.ROTATING,
  role: UserRole.PROVIDER,
  subscriptionTier: SubscriptionTier.FREE,
  preferences: defaultUserPreferences,
  createdAt: new Date(),
  updatedAt: new Date(),
  pinResetToken: undefined,
  pinResetTokenExpiresAt: undefined,
  isValidPinResetToken: () => true,
  toObject: jest.fn().mockReturnValue({
    id: '123',
    _id: '123',
    email: 'test@example.com',
    isActive: true,
    pinMode: PinMode.ROTATING,
    role: UserRole.PROVIDER,
    subscriptionTier: SubscriptionTier.FREE,
    preferences: defaultUserPreferences,
  }),
};

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: jest.Mocked<UsersService>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockSecurityMonitoringService: jest.Mocked<SecurityMonitoringService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest
              .fn()
              .mockImplementation(() => Promise.resolve(mockUser)),
            findById: jest.fn(),
            findAllActive: jest.fn(),
            updatePin: jest.fn(),
            createUser: jest.fn(),
            updateUser: jest.fn(),
            verifyPin: jest.fn(),
            generatePinResetToken: jest.fn(),
            findByPinResetToken: jest.fn(),
            resetPin: jest.fn(),
            resetPinWithToken: jest.fn(),
            updateSubscriptionTier: jest.fn(),
            deactivateUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: SecurityMonitoringService,
          useValue: {
            logAuthenticationAttempt: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mockUsersService = module.get(UsersService);
    mockJwtService = module.get(JwtService);
    mockSecurityMonitoringService = module.get(SecurityMonitoringService);

    // Setup mock implementations
    mockUsersService.findByEmail.mockResolvedValue(mockUser as UserDocument);
    mockUsersService.findById.mockResolvedValue(mockUser as UserDocument);
    mockUsersService.findAllActive.mockResolvedValue([
      mockUser,
    ] as UserDocument[]);
    jest.spyOn(bcryptjs, 'compare').mockImplementation(() => true as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    beforeEach(() => {
      jest.spyOn(bcryptjs, 'compare').mockReset();
    });

    it('should successfully validate user with correct credentials', async () => {
      jest.spyOn(bcryptjs, 'compare').mockImplementation(() => true as any);

      const result = await service.validateUser('test@example.com', '123456');
      const userObject = result.toObject() as Omit<UserDocument, 'hashedPin'>;

      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
      expect(userObject).not.toHaveProperty('hashedPin');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(bcryptjs, 'compare').mockImplementation(() => false as any);

      await expect(
        service.validateUser('test@example.com', 'wrongpin'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockUsersService.findByEmail.mockResolvedValue(
        inactiveUser as UserDocument,
      );
      jest.spyOn(bcryptjs, 'compare').mockImplementation(() => true as any);

      await expect(
        service.validateUser('test@example.com', '123456'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token on successful login', async () => {
      const user: Partial<UserDocument> = {
        id: '123',
        _id: '123',
        email: 'test@example.com',
        pinMode: PinMode.ROTATING,
        role: UserRole.PROVIDER,
        subscriptionTier: SubscriptionTier.FREE,
        preferences: defaultUserPreferences,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        hashedPin: 'hashedPin',
        pinResetToken: undefined,
        pinResetTokenExpiresAt: undefined,
        isValidPinResetToken: () => true,
      };

      const mockToken = 'jwt_token';
      mockJwtService.sign.mockReturnValue(mockToken);

      jest
        .spyOn(service, 'validateUser')
        .mockResolvedValue(user as Omit<UserDocument, 'hashedPin'>);

      const result = await service.login(
        'test@example.com',
        '123456',
        '127.0.0.1',
      );

      expect(result).toEqual({
        access_token: mockToken,
        userId: user._id as string,
        expiresIn: '1h',
      });

      // Verify that security monitoring was called
      expect(
        mockSecurityMonitoringService.logAuthenticationAttempt,
      ).toHaveBeenCalledWith(true, '127.0.0.1', 'test@example.com', '123');
    });
  });

  describe('refreshToken', () => {
    const mockToken = 'valid_token';

    it('should successfully refresh token', async () => {
      mockJwtService.verify.mockReturnValue({
        sub: mockUser._id as string,
        email: mockUser.email as string,
      });
      mockJwtService.sign.mockReturnValue('new_token');

      const result = await service.refreshToken(mockToken);

      expect(result).toEqual({
        access_token: 'new_token',
        userId: mockUser._id as string,
        expiresIn: '1h',
      });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error();
      });

      await expect(service.refreshToken('invalid_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockUsersService.findById.mockResolvedValue(inactiveUser as UserDocument);
      mockJwtService.verify.mockReturnValue({
        sub: inactiveUser._id as string,
        email: inactiveUser.email as string,
      });

      await expect(service.refreshToken(mockToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('rotateUserPins', () => {
    it('should rotate PINs for all active users with rotating PIN mode', async () => {
      const mockUsers: Partial<User>[] = [
        {
          id: '1',
          _id: '1',
          email: 'user1@test.com',
          pinMode: PinMode.ROTATING,
          hashedPin: 'hashedPin',
          role: UserRole.PROVIDER,
          subscriptionTier: SubscriptionTier.FREE,
          preferences: defaultUserPreferences,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          pinResetToken: undefined,
          pinResetTokenExpiresAt: undefined,
          isValidPinResetToken: () => true,
        },
        {
          id: '2',
          _id: '2',
          email: 'user2@test.com',
          pinMode: PinMode.FIXED,
          hashedPin: 'hashedPin',
          role: UserRole.PROVIDER,
          subscriptionTier: SubscriptionTier.FREE,
          preferences: defaultUserPreferences,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          pinResetToken: undefined,
          pinResetTokenExpiresAt: undefined,
          isValidPinResetToken: () => true,
        },
        {
          id: '3',
          _id: '3',
          email: 'user3@test.com',
          pinMode: PinMode.ROTATING,
          hashedPin: 'hashedPin',
          role: UserRole.PROVIDER,
          subscriptionTier: SubscriptionTier.FREE,
          preferences: defaultUserPreferences,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          pinResetToken: undefined,
          pinResetTokenExpiresAt: undefined,
          isValidPinResetToken: () => true,
        },
      ];

      mockUsersService.findAllActive.mockResolvedValue(
        mockUsers as UserDocument[],
      );

      await service.rotateUserPins();

      expect(mockUsersService.updatePin).toHaveBeenCalledTimes(2);
      expect(mockUsersService.updatePin).toHaveBeenCalledWith(
        '1',
        expect.any(String),
      );
      expect(mockUsersService.updatePin).toHaveBeenCalledWith(
        '3',
        expect.any(String),
      );
    });

    it('should handle errors during PIN rotation', async () => {
      mockUsersService.findAllActive.mockRejectedValue(
        new Error('Database error'),
      );

      await service.rotateUserPins(); // Should not throw

      expect(mockUsersService.updatePin).not.toHaveBeenCalled();
    });
  });
});
