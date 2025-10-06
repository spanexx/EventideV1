export interface EmailOptions {
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  template?: string;
  context?: any;
}

export interface EmailServiceInterface {
  sendWelcomeEmail(email: string, pin: string): Promise<void>;
  sendWelcomeEmailPassword(email: string): Promise<void>;
  sendPinResetEmail(email: string, token: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
  sendEmail(options: EmailOptions): Promise<void>;
  sendTemplatedEmail(options: EmailOptions): Promise<void>;
  sendEmailVerification(email: string, name: string, verificationUrl: string, verificationCode: string): Promise<void>;
  sendAccountLockedNotification(email: string, name: string, reason: string, unlockUrl: string, attemptCount?: number): Promise<void>;
  sendSecurityAlert(email: string, name: string, loginDetails: LoginDetails): Promise<void>;
  send2FASetupComplete(email: string, name: string, backupCodes: string[]): Promise<void>;
  send2FACode(email: string, name: string, code: string, expiryMinutes: number): Promise<void>;
}

export interface LoginDetails {
  loginTime: Date;
  location: string;
  device: string;
  browser: string;
  ipAddress: string;
  securityUrl: string;
}
