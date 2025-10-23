import { Controller, Post, Body, Headers, RawBodyRequest, Req, UseGuards, Logger, Get, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import type { Request } from 'express';
import { PaymentService } from './payment.service';
import { CreateCheckoutSessionDto } from './dto/create-checkout-session.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '../booking/booking.schema';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
  ) {}

  @Post('create-checkout-session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Checkout session created' })
  async createCheckoutSession(@Body() dto: CreateCheckoutSessionDto) {
    this.logger.log('📝 Creating checkout session', dto);

    const session = await this.paymentService.createCheckoutSession({
      bookingId: dto.bookingId,
      amount: dto.amount,
      currency: dto.currency || 'usd',
      customerEmail: dto.customerEmail,
      successUrl: dto.successUrl,
      cancelUrl: dto.cancelUrl,
    });

    // Update booking with session ID
    await this.bookingModel.findByIdAndUpdate(dto.bookingId, {
      stripeCheckoutSessionId: session.id,
      paymentStatus: 'pending',
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  @Post('webhook')
  async handleWebhook(@Req() req: any, @Headers('stripe-signature') signature: string) {
    this.logger.log('🔔 Received Stripe webhook');

    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    const event = await this.paymentService.constructWebhookEvent(req.rawBody, signature);

    this.logger.log(`📨 Webhook event type: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as any);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as any);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as any);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  @Get('session/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getSession(@Param('sessionId') sessionId: string) {
    const session = await this.paymentService.retrieveSession(sessionId);
    return {
      id: session.id,
      paymentStatus: session.payment_status,
      paymentIntentId: session.payment_intent,
      metadata: session.metadata,
    };
  }

  private async handleCheckoutSessionCompleted(session: any) {
    this.logger.log('✅ Checkout session completed', { sessionId: session.id });

    const bookingId = session.metadata?.bookingId;
    if (!bookingId) {
      this.logger.warn('No bookingId in session metadata');
      return;
    }

    await this.bookingModel.findByIdAndUpdate(bookingId, {
      stripePaymentIntentId: session.payment_intent,
      paymentStatus: 'paid',
      status: BookingStatus.CONFIRMED,
    });

    this.logger.log('✅ Booking payment confirmed', { bookingId });
  }

  private async handlePaymentIntentSucceeded(paymentIntent: any) {
    this.logger.log('✅ Payment intent succeeded', { paymentIntentId: paymentIntent.id });

    const booking = await this.bookingModel.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (booking) {
      booking.paymentStatus = 'paid';
      booking.status = BookingStatus.CONFIRMED;
      await booking.save();
      this.logger.log('✅ Booking confirmed via payment intent', { bookingId: booking._id });
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: any) {
    this.logger.error('❌ Payment intent failed', { paymentIntentId: paymentIntent.id });

    const booking = await this.bookingModel.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });

    if (booking) {
      booking.paymentStatus = 'failed';
      await booking.save();
      this.logger.log('❌ Booking payment failed', { bookingId: booking._id });
    }
  }
}
