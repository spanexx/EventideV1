import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Ip,
  Get,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/auth.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import type { Response as ExpressResponse, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../modules/users/users.service';
import { CreateUserDto } from '../modules/users/dto/create-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginResponse, RefreshTokenResponse, SignupResponse } from './auth-interfaces/auth.interface';

// Extend Express Request type with our User type
interface RequestWithUser extends Request {
  user?: {
    sub: string;
    email: string;
    [key: string]: any;
  };
}

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  // Custom throttling for signup endpoint:
  @Throttle({
    // Short-term limit: 5 signup attempts per minute per IP
    // Prevents rapid account creation spam
    short: { limit: 5, ttl: 60000 }, // 5 attempts per minute
    // Long-term limit: 10 signup attempts per hour per IP
    // Prevents sustained account creation abuse
    long: { limit: 10, ttl: 3600000 }, // 10 attempts per hour
  })
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async signup(@Body() createUserDto: CreateUserDto): Promise<SignupResponse> {
    return this.authService.signup(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Custom throttling for login endpoint:
  @Throttle({
    // Short-term limit: 5 login attempts per minute per IP
    // Prevents brute force password attacks
    short: { limit: 5, ttl: 60000 }, // 5 attempts per minute
    // Long-term limit: 10 login attempts per hour per IP
    // Prevents sustained login attempts
    long: { limit: 10, ttl: 3600000 }, // 10 attempts per hour
  })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
  ): Promise<LoginResponse> {
    return this.authService.login(loginDto.email, loginDto.password, ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  // Throttling for refresh token endpoint:
  @Throttle({ 
    // Default limit: 10 refresh attempts per minute per IP
    // Prevents token refresh abuse while allowing normal usage
    default: { limit: 10, ttl: 60000 } 
  }) // 10 attempts per minute
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<RefreshTokenResponse> {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  // Throttling for forgot password endpoint:
  @Throttle({ 
    // Default limit: 5 forgot password requests per minute per IP
    // Prevents email spam while allowing legitimate users to request resets
    default: { limit: 5, ttl: 60000 } 
  }) // 5 attempts per minute
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @ApiResponse({ status: 400, description: 'Invalid email' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    try {
      await this.usersService.requestPasswordReset(forgotPasswordDto.email);
      return {
        message:
          'If an account exists with that email, a password reset link has been sent.',
      };
    } catch {
      // We don't reveal whether an account exists with that email for security reasons
      return {
        message:
          'If an account exists with that email, a password reset link has been sent.',
      };
    }
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  // Throttling for reset password endpoint:
  @Throttle({ 
    // Default limit: 5 password reset attempts per minute per IP
    // Prevents brute force attempts to guess reset tokens
    default: { limit: 5, ttl: 60000 } 
  }) // 5 attempts per minute
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token or password' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      await this.usersService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
      return { message: 'Password has been reset successfully.' };
    } catch {
      throw new BadRequestException('Invalid or expired token.');
    }
  }

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify JWT token validity' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verifyToken(@Req() req: RequestWithUser) {
    // If we reach here, the JWT guard has already validated the token
    // Return basic user info from the JWT payload
    return {
      message: 'Token is valid',
      user: {
        id: req.user?.sub,
        email: req.user?.email,
      },
    };
  }

  // Google OAuth endpoints
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirect to Google OAuth' })
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({
    status: 302,
    description: 'Redirect to frontend with JWT token',
  })
  @ApiResponse({ status: 401, description: 'Google authentication failed' })
  async googleAuthRedirect(
    @Req() req: RequestWithUser,
    @Res() res: ExpressResponse,
    @Query('redirect') redirect?: string,
  ) {
    try {
      const profile = req.user as {
        googleId?: string;
        email?: string;
        firstName?: string;
        lastName?: string;
        picture?: string;
        sub?: string;
        [key: string]: any;
      } | undefined;

      // Check if profile exists and has required properties
      if (!profile || !profile.googleId || !profile.email) {
        throw new UnauthorizedException('Google authentication failed - missing required profile information');
      }

      // Create a properly typed GoogleProfile object
      const googleProfile = {
        googleId: profile.googleId,
        email: profile.email,
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        picture: profile.picture || '',
      };

      // Login with Google profile
      const loginResponse = await this.authService.loginWithGoogle(googleProfile);

      // Determine redirect URL
      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:4200',
      );

      // Ensure there's a trailing slash to prevent URL concatenation issues
      const normalizedFrontendUrl = frontendUrl.endsWith('/')
        ? frontendUrl
        : `${frontendUrl}/`;
      const redirectPath = 'auth/google/callback';
      const redirectUrl = redirect || `${normalizedFrontendUrl}${redirectPath}`;

      // Ensure the redirect URL has the proper protocol
      const fullRedirectUrl = redirectUrl.startsWith('http')
        ? redirectUrl
        : `http://${redirectUrl}`;

      // Encode user data for safe URL transmission
      const userData = Buffer.from(
        JSON.stringify({
          id: loginResponse.userId,
          email: profile.email || '',
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          picture: profile.picture || '',
        }),
      ).toString('base64');

      // Construct the redirect URI with proper query parameters
      const redirectUri = `${fullRedirectUrl}?access_token=${encodeURIComponent(loginResponse.access_token)}&user=${encodeURIComponent(userData)}`;

      console.log('Redirecting to:', redirectUri); // For debugging
      return res.redirect(redirectUri);
    } catch (error) {
      console.error('Google auth error:', error);
      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:4200',
      );
      const normalizedFrontendUrl = frontendUrl.endsWith('/')
        ? frontendUrl
        : `${frontendUrl}/`;
      return res.redirect(
        `${normalizedFrontendUrl}auth/login?error=google_auth_failed`,
      );
    }
  }
}
