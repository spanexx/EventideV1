import {
  Injectable,
  UnauthorizedException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../modules/users/users.service';
import * as bcrypt from 'bcryptjs';
import { SecurityMonitoringService } from '../core/security/security-monitoring.service';
import { CreateUserDto } from '../modules/users/dto/create-user.dto';
import { UserDocument } from '../modules/users/user.schema';
import {
  GoogleProfile,
  LoginResponse,
  RefreshTokenResponse,
  SignupResponse,
  TokenPayload,
} from './auth-interfaces/auth.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly securityMonitoringService: SecurityMonitoringService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<UserDocument, 'password'>> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    if (password && user.password) {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedException('Invalid credentials');
      }
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Return the user document directly, which will have the proper id virtual property
    return user;
  }

  async login(
    email: string | undefined,
    password: string,
    ip?: string,
  ): Promise<LoginResponse> {
    if (!email) {
      throw new UnauthorizedException('Email is required for login');
    }

    try {
      const user = await this.validateUser(email, password);

      if (!user.email) {
        throw new UnauthorizedException('User email is not set');
      }

      // Ensure we have a valid user ID
      const userId = user.id?.toString() || (user as any)._id?.toString();
      if (!userId) {
        throw new UnauthorizedException('User ID is missing');
      }

      // Log successful authentication
      this.securityMonitoringService.logAuthenticationAttempt(
        true,
        ip || 'unknown',
        user.email,
        userId,
      );

      const payload: TokenPayload = {
        sub: userId,
        email: user.email as unknown as string,
      };

      return {
        access_token: this.jwtService.sign(payload),
        userId: userId,
        expiresIn: '1h',
      };
    } catch (error) {
      // Log failed authentication
      this.securityMonitoringService.logAuthenticationAttempt(
        false,
        ip || 'unknown',
        email,
      );

      // Re-throw the error
      throw error;
    }
  }

  async refreshToken(token: string): Promise<RefreshTokenResponse> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user || !user.isActive || !user.email) {
        throw new UnauthorizedException('Invalid token');
      }

      // Ensure we have a valid user ID
      const userId = user.id?.toString() || (user as any)._id?.toString();
      if (!userId) {
        throw new UnauthorizedException('User ID is missing');
      }

      const newPayload: TokenPayload = {
        sub: userId,
        email: user.email as unknown as string,
      };

      return {
        access_token: this.jwtService.sign(newPayload),
        userId: userId,
        expiresIn: '1h',
      };
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  // Google OAuth methods
  async loginWithGoogle(googleProfile: GoogleProfile): Promise<LoginResponse> {
    try {
      // Find or create user based on Google profile
      const user =
        await this.usersService.findOrCreateGoogleUser(googleProfile);

      if (!user.email) {
        throw new UnauthorizedException('User email is not set');
      }

      // Log successful authentication
      this.securityMonitoringService.logAuthenticationAttempt(
        true,
        'unknown', // IP would be available in the controller
        user.email,
        user.id as string,
      );

      // Ensure we have a valid user ID
      const userId = user.id?.toString() || (user as any)._id?.toString();
      if (!userId) {
        throw new UnauthorizedException('User ID is missing');
      }

      const payload: TokenPayload = {
        sub: userId,
        email: user.email as unknown as string,
      };

      return {
        access_token: this.jwtService.sign(payload),
        userId: userId,
        expiresIn: '1h',
      };
    } catch (error) {
      // Log failed authentication
      this.securityMonitoringService.logAuthenticationAttempt(
        false,
        'unknown',
        googleProfile?.email,
      );

      // Re-throw the error
      throw error;
    }
  }

  async signup(createUserDto: CreateUserDto): Promise<SignupResponse> {
    this.logger.log(
      `Starting signup process for email: ${createUserDto.email}`,
    );

    try {
      // Check if user already exists
      this.logger.log(
        `Checking if user already exists: ${createUserDto.email}`,
      );
      const existingUser = await this.usersService.findByEmail(
        createUserDto.email,
      );
      if (existingUser) {
        this.logger.warn(
          `User already exists with email: ${createUserDto.email}`,
        );
        throw new ConflictException('Email already exists');
      }

      // Create the user using the users service
      this.logger.log(`Creating new user with email: ${createUserDto.email}`);
      const user = await this.usersService.createUser(createUserDto);

      // Ensure email is not null
      if (!user.email) {
        this.logger.error('User email is null after creation');
        throw new Error('User email is required');
      }

      this.logger.log(
        `User created successfully with ID: ${(user as any).id || (user as any)._id}`,
      );
      return {
        userId: (user as any).id || (user as any)._id,
        email: user.email,
      };
    } catch (error) {
      this.logger.error(
        `Signup failed for email ${createUserDto.email}:`,
        error,
      );
      throw error;
    }
  }
}
