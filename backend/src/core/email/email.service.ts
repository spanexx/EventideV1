import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { format } from 'date-fns';
import * as Handlebars from 'handlebars';
import * as path from 'path';
import * as fs from 'fs';
import { EmailServiceInterface, EmailOptions, LoginDetails } from './email.interface';

@Injectable()
export class EmailService implements EmailServiceInterface {
  private readonly logger = new Logger(EmailService.name);
  private transporter!: nodemailer.Transporter;
  private transporterInitialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService
  ) {
    this.initializeTransporter().catch(err => {
      this.logger.error('Failed to initialize email transporter:', err);
    });
  }

  private async initializeTransporter(): Promise<void> {
    const provider = this.configService.get<string>('EMAIL_PROVIDER', 'smtp');
    const secure = this.configService.get<boolean>('EMAIL_SECURE', false);
    const port = this.configService.get<number>('EMAIL_PORT', secure ? 465 : 587);
    const host = this.configService.get<string>('EMAIL_HOST', 'smtp.gmail.com');

    try {
      switch (provider.toLowerCase()) {
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
            host,
            port,
            secure,
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

      await this.transporter.verify();
      this.transporterInitialized = true;
      this.logger.log('Email transporter initialized successfully');
    } catch (error: any) {
      this.logger.error('Failed to initialize email transporter:', error);
      throw error;
    }
  }

  private async ensureTransporterInitialized(): Promise<void> {
    if (!this.transporterInitialized) {
      await this.initializeTransporter();
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    await this.ensureTransporterInitialized();

    try {
      const from = this.configService.get<string>(
        'EMAIL_FROM',
        'noreply@eventide.com'
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
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  async sendTemplatedEmail(options: EmailOptions): Promise<void> {
    try {
      if (!options.template) {
        throw new Error('Template name is required for templated emails');
      }

      const html = this.configService.get('EMAIL_TEMPLATES_DIR')
        ? await this.renderTemplate(options.template, options.context || {})
        : this.getDefaultTemplate(options.template, options.context || {});
      const subject = options.subject || this.getDefaultSubjectForTemplate(options.template);

      await this.sendEmail({
        to: options.to,
        subject,
        html,
      });

      this.logger.log(`Templated email '${options.template}' sent successfully to ${options.to}`);
    } catch (error: any) {
      this.logger.error(
        `Failed to send templated email '${options.template}' to ${options.to}:`,
        error
      );
      throw error;
    }
  }

  private async renderTemplate(templateName: string, context: any): Promise<string> {
    try {
      const templatesDir = this.configService.get('EMAIL_TEMPLATES_DIR');
      const templatePath = path.join(templatesDir, `${templateName}.hbs`);
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template ${templateName} not found at ${templatePath}`);
      }

      const template = await fs.promises.readFile(templatePath, 'utf-8');
      const compiledTemplate = Handlebars.compile(template);
      return compiledTemplate(context);
    } catch (error: any) {
      this.logger.error(`Failed to render template ${templateName}:`, error);
      throw error;
    }
  }

  private getDefaultTemplate(templateName: string, context: any): string {
    const defaultTemplates: Record<string, (ctx: any) => string> = {
      'email-verification': (ctx) => `
        <h1>Verify Your Email Address</h1>
        <p>Hello,</p>
        <p>Please click the button below to verify your email address:</p>
        <a href="${ctx.verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
          Verify Email
        </a>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p>${ctx.verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
      `,
      '2fa-setup': (ctx) => `
        <h1>Set Up Two-Factor Authentication</h1>
        <p>Hello,</p>
        <p>To enhance your account security, please set up two-factor authentication:</p>
        <p>Your setup code is: <strong>${ctx.setupCode}</strong></p>
        <p>Enter this code in your authenticator app to complete the setup.</p>
      `,
      '2fa-code': (ctx) => `
        <h1>Your Authentication Code</h1>
        <p>Hello,</p>
        <p>Your authentication code is: <strong>${ctx.code}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please secure your account immediately.</p>
      `,
      'account-locked': (ctx) => `
        <h1>Account Security Alert</h1>
        <p>Hello,</p>
        <p>Your account has been locked due to multiple failed login attempts.</p>
        <p>To unlock your account, please click the button below:</p>
        <a href="${ctx.unlockLink}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px;">
          Unlock Account
        </a>
        <p>If you didn't attempt to log in, please reset your password immediately.</p>
      `,
      'security-alert': (ctx) => `
        <h1>New Login Detected</h1>
        <p>Hello,</p>
        <p>We detected a new login to your account from:</p>
        <ul>
          <li>Device: ${ctx.device}</li>
          <li>Location: ${ctx.location}</li>
          <li>Time: ${format(ctx.loginTime, 'PPpp')}</li>
        </ul>
        <p>If this wasn't you, please secure your account immediately.</p>
      `,
      'availability-bulk-update': (ctx) => `
        <h1>Schedule Update Notification</h1>
        <p>Hello,</p>
        <p>Your availability has been updated for multiple time slots:</p>
        <ul>
          ${ctx.updates.map((update: any) => `
            <li>${update.date}: ${update.oldTime} → ${update.newTime}</li>
          `).join('')}
        </ul>
      `,
      'availability-cancellation': (ctx) => `
        <h1>Schedule Cancellation</h1>
        <p>Hello,</p>
        <p>The following availability has been cancelled:</p>
        <p>Date: ${ctx.date}</p>
        <p>Time: ${ctx.time}</p>
        <p>Reason: ${ctx.reason || 'Not specified'}</p>
      `,
    };

    const template = defaultTemplates[templateName];
    if (!template) {
      throw new Error(`No default template found for ${templateName}`);
    }

    return template(context);
  }

  private getDefaultSubjectForTemplate(template: string): string {
    const subjects = {
      'email-verification': 'Verify Your Email Address',
      '2fa-setup': 'Two-Factor Authentication Setup',
      '2fa-code': 'Your Two-Factor Authentication Code',
      'account-locked': 'Account Security Alert - Account Locked',
      'security-alert': 'Security Alert - New Login Detected',
      'availability-bulk-update': 'Schedule Update Notification',
      'availability-cancellation': 'Schedule Cancellation Notice',
      'availability-override': 'Schedule Override Notification',
      'availability-update': 'Schedule Change Notification',
      'booking-cancellation': 'Booking Cancellation Notice',
      'booking-confirmation': 'Booking Confirmation',
      'booking-feedback': 'Share Your Feedback',
      'booking-followup': 'How Was Your Experience?',
      'booking-modification': 'Booking Update Notification',
      'booking-payment': 'Payment Confirmation',
      'booking-reminder': 'Upcoming Booking Reminder',
    };

    return subjects[template as keyof typeof subjects] || 'Eventide Notification';
  }

  async sendWelcomeEmail(email: string, pin: string): Promise<void> {
    const subject = 'Welcome to Eventide - Your Account Created';
    const text = `Welcome to Eventide!\n\nYour account has been created successfully. For security reasons, your PIN is not included in this email.\n\nPlease use the PIN you created during registration to log in to your account.\n\nBest regards,\nThe Eventide Team`;
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
    const text = `Welcome to Eventide!\n\nYour account has been created successfully.\n\nPlease use the email and password you created during registration to log in to your account.\n\nBest regards,\nThe Eventide Team`;
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
    const text = `You have requested to reset your PIN for your Eventide account.\n\nTo reset your PIN, please click on the following link:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Eventide Team`;
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
    const text = `You have requested to reset your password for your Eventide account.\n\nTo reset your password, please click on the following link:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Eventide Team`;
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
    const text = `A fixed PIN has been created for your Eventide account.\n\nFor security reasons, your PIN is not included in this email. Please keep your PIN secure and do not share it with anyone.\n\nBest regards,\nThe Eventide Team`;
    const html = `
      <h1>Eventide - Fixed PIN Created</h1>
      <p>A fixed PIN has been created for your Eventide account.</p>
      <p>For security reasons, your PIN is not included in this email. Please keep your PIN secure and do not share it with anyone.</p>
      <p>Best regards,<br/>The Eventide Team</p>
    `;

    await this.sendEmail({ to: email, subject, text, html });
  }

  async sendEmailVerification(
    email: string,
    name: string,
    verificationUrl: string,
    verificationCode: string,
  ): Promise<void> {
    await this.sendTemplatedEmail({
      to: email,
      template: 'email-verification',
      context: {
        name,
        verificationUrl,
        verificationCode,
      },
    });
  }

  async sendAccountLockedNotification(
    email: string,
    name: string,
    reason: string,
    unlockUrl: string,
    attemptCount?: number,
  ): Promise<void> {
    await this.sendTemplatedEmail({
      to: email,
      template: 'account-locked',
      context: {
        name,
        reason,
        unlockUrl,
        attemptCount,
      },
    });
  }

  async sendSecurityAlert(
    email: string,
    name: string,
    loginDetails: LoginDetails,
  ): Promise<void> {
    await this.sendTemplatedEmail({
      to: email,
      template: 'security-alert',
      context: {
        name,
        loginTime: loginDetails.loginTime,
        location: loginDetails.location,
        device: loginDetails.device,
        browser: loginDetails.browser,
        ipAddress: loginDetails.ipAddress,
        securityUrl: loginDetails.securityUrl,
      },
    });
  }

  async send2FASetupComplete(
    email: string,
    name: string,
    backupCodes: string[],
  ): Promise<void> {
    await this.sendTemplatedEmail({
      to: email,
      template: '2fa-setup',
      context: {
        name,
        backupCodes,
      },
    });
  }

  async send2FACode(
    email: string,
    name: string,
    code: string,
    expiryMinutes: number,
  ): Promise<void> {
    await this.sendTemplatedEmail({
      to: email,
      template: '2fa-code',
      context: {
        name,
        code,
        expiryMinutes,
      },
    });
  }
}
