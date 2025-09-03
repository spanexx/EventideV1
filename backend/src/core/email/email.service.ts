import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { EmailServiceInterface, EmailOptions } from './email.interface';

@Injectable()
export class EmailService implements EmailServiceInterface {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const provider = this.configService.get<string>('EMAIL_PROVIDER', 'smtp');

    switch (provider) {
      case 'sendgrid':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: this.configService.get<string>('EMAIL_API_KEY'),
          },
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
          },
        });
        break;

      case 'ses':
        // For SES, you would need to configure it with AWS SDK
        // This is a simplified example
        this.transporter = nodemailer.createTransport({
          host: this.configService.get<string>('EMAIL_HOST'),
          port: this.configService.get<number>('EMAIL_PORT', 587),
          secure: this.configService.get<boolean>('EMAIL_SECURE', false),
          auth: {
            user: this.configService.get<string>('EMAIL_USER'),
            pass: this.configService.get<string>('EMAIL_PASS'),
          },
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
          },
        });
        break;

      case 'smtp':
      default:
        this.transporter = nodemailer.createTransport({
          host: this.configService.get<string>('EMAIL_HOST', 'localhost'),
          port: this.configService.get<number>('EMAIL_PORT', 1025),
          secure: this.configService.get<boolean>('EMAIL_SECURE', false),
          auth: this.configService.get<string>('EMAIL_USER')
            ? {
                user: this.configService.get<string>('EMAIL_USER'),
                pass: this.configService.get<string>('EMAIL_PASS'),
              }
            : undefined,
          tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
          },
        });
        break;
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const from = this.configService.get<string>(
        'EMAIL_FROM',
        'noreply@eventide.com',
      );

      await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      this.logger.log(`Email sent successfully to ${options.to}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send email to ${options.to}: ${error.message}`,
      );
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, pin: string): Promise<void> {
    const subject = 'Welcome to Eventide - Your Account Created';
    const text = `Welcome to Eventide!
    
Your account has been created successfully. For security reasons, your PIN is not included in this email.
    
Please use the PIN you created during registration to log in to your account.
    
Best regards,
The Eventide Team`;

    const html = `
      <h1>Welcome to Eventide!</h1>
      <p>Your account has been created successfully. For security reasons, your PIN is not included in this email.</p>
      <p>Please use the PIN you created during registration to log in to your account.</p>
      <p>Best regards,<br/>The Eventide Team</p>
    `;

    await this.sendEmail({ to: email, subject, text, html });
  }

  async sendWelcomeEmailPassword(email: string): Promise<void> {
    const subject = 'Welcome to Eventide - Your Account Created';
    const text = `Welcome to Eventide!
    
Your account has been created successfully.
    
Please use the email and password you created during registration to log in to your account.
    
Best regards,
The Eventide Team`;

    const html = `
      <h1>Welcome to Eventide!</h1>
      <p>Your account has been created successfully.</p>
      <p>Please use the email and password you created during registration to log in to your account.</p>
      <p>Best regards,<br/>The Eventide Team</p>
    `;

    await this.sendEmail({ to: email, subject, text, html });
  }

  async sendPinResetEmail(email: string, token: string): Promise<void> {
    const subject = 'Eventide - PIN Reset Request';
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200')}/reset-pin?token=${token}`;

    const text = `You have requested to reset your PIN for your Eventide account.
    
To reset your PIN, please click on the following link:
${resetUrl}
    
This link will expire in 1 hour.
    
If you did not request this, please ignore this email.
    
Best regards,
The Eventide Team`;

    const html = `
      <h1>Eventide - PIN Reset Request</h1>
      <p>You have requested to reset your PIN for your Eventide account.</p>
      <p>To reset your PIN, please click on the following link:</p>
      <p><a href="${resetUrl}">Reset PIN</a></p>
      <p><em>This link will expire in 1 hour.</em></p>
      <p>If you did not request this, please ignore this email.</p>
      <p>Best regards,<br/>The Eventide Team</p>
    `;

    await this.sendEmail({ to: email, subject, text, html });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const subject = 'Eventide - Password Reset Request';
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200')}/auth/reset-password?token=${token}`;

    const text = `You have requested to reset your password for your Eventide account.
    
To reset your password, please click on the following link:
${resetUrl}
    
This link will expire in 1 hour.
    
If you did not request this, please ignore this email.
    
Best regards,
The Eventide Team`;

    const html = `
      <h1>Eventide - Password Reset Request</h1>
      <p>You have requested to reset your password for your Eventide account.</p>
      <p>To reset your password, please click on the following link:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p><em>This link will expire in 1 hour.</em></p>
      <p>If you did not request this, please ignore this email.</p>
      <p>Best regards,<br/>The Eventide Team</p>
    `;

    await this.sendEmail({ to: email, subject, text, html });
  }

  async sendFixedPinCreatedEmail(email: string): Promise<void> {
    const subject = 'Eventide - Fixed PIN Created';
    const text = `A fixed PIN has been created for your Eventide account.
    
For security reasons, your PIN is not included in this email. Please keep your PIN secure and do not share it with anyone.
    
Best regards,
The Eventide Team`;

    const html = `
      <h1>Eventide - Fixed PIN Created</h1>
      <p>A fixed PIN has been created for your Eventide account.</p>
      <p>For security reasons, your PIN is not included in this email. Please keep your PIN secure and do not share it with anyone.</p>
      <p>Best regards,<br/>The Eventide Team</p>
    `;

    await this.sendEmail({ to: email, subject, text, html });
  }
}
