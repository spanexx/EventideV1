import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from '@jest/globals';

jest.mock('./auth.service');

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 10,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto = new LoginDto('password123', 'test@example.com');
      const expectedResult = {
        access_token: 'mock_token',
        userId: '123',
        expiresIn: '1h',
      };

      authService.login.mockImplementation(() =>
        Promise.resolve(expectedResult),
      );

      const result = await controller.login(loginDto, '127.0.0.1');

      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
        '127.0.0.1',
      );
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      const loginDto = new LoginDto('wrongpassword', 'test@example.com');

      authService.login.mockImplementation(() =>
        Promise.reject(new UnauthorizedException()),
      );

      await expect(controller.login(loginDto, '127.0.0.1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const refreshTokenDto = new RefreshTokenDto('valid_refresh_token');
      const expectedResult = {
        access_token: 'new_token',
        userId: '123',
        expiresIn: '1h',
      };

      authService.refreshToken.mockImplementation(() =>
        Promise.resolve(expectedResult),
      );

      const result = await controller.refreshToken(refreshTokenDto);

      expect(result).toEqual(expectedResult);
      expect(authService.refreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
      );
    });

    it('should throw UnauthorizedException with invalid refresh token', async () => {
      const refreshTokenDto = new RefreshTokenDto('invalid_token');

      authService.refreshToken.mockImplementation(() =>
        Promise.reject(new UnauthorizedException()),
      );

      await expect(controller.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
