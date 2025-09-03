import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailOptions } from './email.interface';

// Mock nodemailer
const mockTransporter = {
  sendMail: jest.fn(),
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'EMAIL_PROVIDER':
                  return 'smtp';
                case 'EMAIL_HOST':
                  return 'localhost';
                case 'EMAIL_PORT':
                  return 1025;
                case 'EMAIL_SECURE':
                  return false;
                case 'EMAIL_FROM':
                  return 'noreply@eventide.com';
                case 'FRONTEND_URL':
                  return 'http://localhost:4200';
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test text content',
        html: '<p>Test HTML content</p>',
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: '12345' });

      await service.sendEmail(emailOptions);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'noreply@eventide.com',
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test text content',
        html: '<p>Test HTML content</p>',
      });
    });

    it('should throw an error when email sending fails', async () => {
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test Subject',
        text: 'Test text content',
      };

      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

      await expect(service.sendEmail(emailOptions)).rejects.toThrow(
        'SMTP Error',
      );
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send a welcome email with PIN', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: '12345' });

      await service.sendWelcomeEmail('test@example.com', '123456');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('test@example.com');
      expect(callArgs.subject).toBe('Welcome to Eventide - Your Account PIN');
      expect(callArgs.text).toContain('123456');
      expect(callArgs.html).toContain('123456');
    });
  });

  describe('sendPinResetEmail', () => {
    it('should send a PIN reset email with token', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: '12345' });

      await service.sendPinResetEmail('test@example.com', 'reset-token-123');

      expect(mockTransporter.sendMail).toHaveBeenCalled();
      const callArgs = mockTransporter.sendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('test@example.com');
      expect(callArgs.subject).toBe('Eventide - PIN Reset Request');
      expect(callArgs.text).toContain('reset-token-123');
      expect(callArgs.html).toContain('reset-token-123');
    });
  });
});
