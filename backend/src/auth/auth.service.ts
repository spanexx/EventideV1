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
import { EmailService } from '../core/email/email.service';
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
    private readonly emailService: EmailService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<UserDocument, 'password'>> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email address before logging in. Check your inbox for the verification link.');
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

      // Send security alert for new login
      try {
        await this.emailService.sendTemplatedEmail({
          to: user.email,
          template: 'security-alert',
          context: {
            device: 'Web Browser', // TODO: Add device detection
            location: ip || 'unknown',
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        // Log but don't fail the login
        this.logger.warn(`Failed to send security alert email: ${error.message}`);
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
      // Log failed authentication attempt
      this.securityMonitoringService.logAuthenticationAttempt(
        false,
        ip || 'unknown',
        email,
      );

      // Check if account should be locked
      const failedAttempts = await this.securityMonitoringService.getFailedAttempts(email);
      if (failedAttempts >= 5) {  // After 5 failed attempts
        const user = await this.usersService.findByEmail(email);
        if (user) {
          // Lock the account
          await this.usersService.updateUser(user.id, { isActive: false });

          // Generate unlock token
          const unlockToken = this.jwtService.sign(
            { sub: user.id, email: user.email, action: 'unlock' },
            { expiresIn: '24h' }
          );

          // Send account locked notification
          const unlockLink = `${process.env.FRONTEND_URL}/unlock-account?token=${unlockToken}`;
          await this.emailService.sendTemplatedEmail({
            to: email,
            template: 'account-locked',
            context: {
              unlockLink
            }
          }).catch((err) => this.logger.warn(`Failed to send account locked email: ${err.message}`));
        }
      }

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
        (user as UserDocument).id,
      );

      // Send security alert for OAuth sign-in
      try {
        await this.emailService.sendTemplatedEmail({
          to: user.email,
          template: 'security-alert',
          context: {
            device: 'Google OAuth Sign-In',
            location: 'unknown',
            timestamp: new Date().toISOString(),
            provider: 'Google'
          }
        });
      } catch (error) {
        // Log but don't fail the login
        this.logger.warn(`Failed to send OAuth security alert email: ${error.message}`);
      }

      // Ensure we have a valid user ID
      const userId = (user as UserDocument).id;
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

      // Generate verification token
      const verificationToken = this.jwtService.sign(
        { sub: (user as UserDocument).id, email: user.email },
        { expiresIn: '24h' }
      );

      // Send verification email
      const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;
      await this.emailService.sendTemplatedEmail({
        to: user.email,
        template: 'email-verification',
        context: {
          verificationLink
        }
      });

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

  async verifyEmail(token: string): Promise<{ message: string }> {
    try {
      const decoded = this.jwtService.verify(token) as { email: string };
      const user = await this.usersService.findByEmail(decoded.email);
      
      if (!user) {
        throw new UnauthorizedException('Invalid verification token');
      }

      if (user.isEmailVerified) {
        return { message: 'Email already verified' };
      }

      await this.usersService.markEmailAsVerified(user.id);
      return { message: 'Email verified successfully' };
    } catch (error) {
      this.logger.error(`Email verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired verification token');
    }
  }
}
