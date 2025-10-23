import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly stripe: Stripe;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    });
    this.logger.log('✅ Stripe SDK initialized');
  }

  async createCheckoutSession(params: {
    bookingId: string;
    amount: number;
    currency: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    try {
      this.logger.log('💳 Creating Stripe Checkout session', { bookingId: params.bookingId, amount: params.amount });

      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: params.currency,
              product_data: {
                name: 'Booking Payment',
                description: `Payment for booking ${params.bookingId}`,
              },
              unit_amount: params.amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer_email: params.customerEmail,
        metadata: {
          bookingId: params.bookingId,
          ...params.metadata,
        },
      });

      this.logger.log('✅ Checkout session created', { sessionId: session.id, bookingId: params.bookingId });
      return session;
    } catch (error) {
      this.logger.error('❌ Failed to create checkout session', error.stack);
      throw new BadRequestException('Failed to create payment session');
    }
  }

  async retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      this.logger.error('❌ Failed to retrieve session', error.stack);
      throw new BadRequestException('Invalid session ID');
    }
  }

  async constructWebhookEvent(payload: Buffer, signature: string): Promise<Stripe.Event> {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error('❌ Webhook signature verification failed', error.message);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      this.logger.log('💰 Creating refund', { paymentIntentId, amount });
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
      });
      this.logger.log('✅ Refund created', { refundId: refund.id });
      return refund;
    } catch (error) {
      this.logger.error('❌ Failed to create refund', error.stack);
      throw new BadRequestException('Failed to process refund');
    }
  }
}
