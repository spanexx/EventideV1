export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailServiceInterface {
  sendWelcomeEmail(email: string, pin: string): Promise<void>;
  sendWelcomeEmailPassword(email: string): Promise<void>;
  sendPinResetEmail(email: string, token: string): Promise<void>;
  sendPasswordResetEmail(email: string, token: string): Promise<void>;
  sendEmail(options: EmailOptions): Promise<void>;
}
