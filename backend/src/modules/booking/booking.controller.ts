import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { GetBookingsDto } from './dto/get-bookings.dto';
import { RequestCancellationDto } from './dto/request-cancellation.dto';
import { VerifyCancellationDto } from './dto/verify-cancellation.dto';
import { IBooking } from './interfaces/booking.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BookingCancellationService } from './services/booking-cancellation.service';

@Controller('bookings')
@ApiTags('bookings')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly cancellationService: BookingCancellationService
  ) {}

  /**
   * Create a new booking - public endpoint, no auth required
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createBookingDto: CreateBookingDto): Promise<IBooking | IBooking[]> {
    console.log('🎯 [Booking Controller] Create endpoint called with data:', createBookingDto);
    try {
      const result = await this.bookingService.create(createBookingDto);
      console.log('✅ [Booking Controller] Successfully created booking:', result);
      return result;
    } catch (error) {
      console.error('❌ [Booking Controller] Error creating booking:', error);
      throw error;
    }
  }

  /**
   * Update a booking's status or notes
   * Public endpoint but validates guest email for cancellations
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @Body('guestEmail') guestEmail?: string
  ): Promise<IBooking> {
    const booking = await this.bookingService.findOne(id);
    
    // If trying to cancel, verify guest email
    if (updateBookingDto.status === 'cancelled') {
      if (!guestEmail) {
        throw new BadRequestException('Guest email required for cancellation');
      }
      if (booking.guestEmail !== guestEmail) {
        throw new BadRequestException('Invalid guest email');
      }
    }

    return this.bookingService.update(id, updateBookingDto);
  }

  /**
   * Get all bookings for a provider - requires provider authentication
   */
  @Get('provider')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get provider bookings' })
  @ApiOkResponse({ description: 'List of bookings for the authenticated provider' })
  async findProviderBookings(
    @CurrentUser('providerId') providerId: string,
    @Query() query: GetBookingsDto
  ): Promise<IBooking[]> {
    console.log('📋 [Booking Controller] GET /bookings/provider', { providerId, query });
    return this.bookingService.findAll({
      ...query,
      providerId,
    });
  }

  /**
   * Provider cancels a booking - requires provider authentication, no guest email needed
   */
  @Patch('provider/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Provider cancels a booking' })
  @ApiOkResponse({ description: 'Booking cancelled' })
  async providerCancelBooking(
    @Param('id') id: string,
    @CurrentUser('providerId') providerId: string
  ): Promise<IBooking> {
    console.log('🚫 [Booking Controller] PATCH /bookings/provider/:id/cancel', { id, providerId });
    const booking = await this.bookingService.findOne(id);
    
    // Verify booking belongs to provider
    if (booking.providerId !== providerId) {
      throw new BadRequestException('Booking does not belong to this provider');
    }

    const result = await this.bookingService.update(id, { status: 'cancelled' as any });
    console.log('✅ [Booking Controller] Provider cancelled booking successfully');
    return result;
  }

  /**
   * Provider approves a pending booking - requires provider authentication
   */
  @Patch('provider/:id/approve')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Provider approves a pending booking' })
  @ApiOkResponse({ description: 'Booking approved' })
  async providerApproveBooking(
    @Param('id') id: string,
    @CurrentUser('providerId') providerId: string
  ): Promise<IBooking> {
    console.log('✅ [Booking Controller] PATCH /bookings/provider/:id/approve', { id, providerId });
    const booking = await this.bookingService.findOne(id);

    if (booking.providerId !== providerId) {
      throw new BadRequestException('Booking does not belong to this provider');
    }
    if ((booking as any).status !== 'pending') {
      throw new BadRequestException('Only pending bookings can be approved');
    }

    return this.bookingService.update(id, { status: 'confirmed' as any });
  }

  /**
   * Provider declines a pending booking - requires provider authentication
   */
  @Patch('provider/:id/decline')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Provider declines a pending booking' })
  @ApiOkResponse({ description: 'Booking declined' })
  async providerDeclineBooking(
    @Param('id') id: string,
    @CurrentUser('providerId') providerId: string
  ): Promise<IBooking> {
    console.log('❎ [Booking Controller] PATCH /bookings/provider/:id/decline', { id, providerId });
    const booking = await this.bookingService.findOne(id);

    if (booking.providerId !== providerId) {
      throw new BadRequestException('Booking does not belong to this provider');
    }
    if ((booking as any).status !== 'pending') {
      throw new BadRequestException('Only pending bookings can be declined');
    }

    return this.bookingService.update(id, { status: 'cancelled' as any });
  }

  /**
   * Get a specific booking by ID
   * Public endpoint but returns limited data for non-providers
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser('providerId') providerId?: string
  ): Promise<IBooking> {
    const booking = await this.bookingService.findOne(id);
    
    // If not the provider, remove sensitive information
    if (booking.providerId !== providerId) {
      const { guestEmail, guestPhone, notes, ...publicBooking } = booking;
      return publicBooking as IBooking;
    }
    
    return booking;
  }

  /**
   * Get all bookings for a guest by email
   * Public endpoint but requires email verification
   */
  /**
   * Get booking by serial key with QR code
   * Public endpoint but returns only essential information
   */
  @Get('verify/:serialKey')
  async verifyBooking(@Param('serialKey') serialKey: string): Promise<IBooking> {
    return this.bookingService.verifyBooking(serialKey);
  }

  /**
   * Get QR code for a booking by serial key
   * Returns the QR code as a data URL
   */
  @Get('qr/:serialKey')
  async getQRCode(@Param('serialKey') serialKey: string): Promise<{ qrCode: string }> {
    const booking = await this.bookingService.findBySerialKey(serialKey);
    if (!booking.qrCode) {
      throw new BadRequestException('Failed to generate QR code for booking');
    }
    return { qrCode: booking.qrCode };
  }

  @Get('guest/:email')
  async findGuestBookings(
    @Param('email') email: string,
    @Query('verificationToken') verificationToken: string
  ): Promise<IBooking[]> {
    // In a real implementation, we would verify the token
    // For now, we'll just check if it's provided
    if (!verificationToken) {
      throw new BadRequestException('Verification token required');
    }

    return this.bookingService.findByGuestEmail(email);
  }

  /**
   * Request booking cancellation - sends verification code to email
   * Public endpoint
   */
  @Post('cancel/request')
  @HttpCode(HttpStatus.OK)
  async requestCancellation(
    @Body() requestCancellationDto: RequestCancellationDto
  ): Promise<{ message: string }> {
    return this.cancellationService.requestCancellation(
      requestCancellationDto.bookingId,
      requestCancellationDto.guestEmail,
      requestCancellationDto.serialKey
    );
  }

  /**
   * Verify cancellation code and cancel booking
   * Public endpoint
   */
  @Post('cancel/verify')
  @HttpCode(HttpStatus.OK)
  async verifyCancellation(
    @Body() verifyCancellationDto: VerifyCancellationDto
  ): Promise<{ message: string; booking: IBooking }> {
    const result = await this.cancellationService.verifyCancellation(
      verifyCancellationDto.bookingId,
      verifyCancellationDto.guestEmail,
      verifyCancellationDto.verificationCode
    );
    
    // Convert BookingDocument to IBooking
    return {
      message: result.message,
      booking: result.booking.toObject() as IBooking
    };
  }
}
