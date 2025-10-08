import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class QRCodeService {
  private readonly logger = new Logger(QRCodeService.name);

  /**
   * Generate a QR code as a data URL for a booking serial key
   * @param serialKey The booking serial key
   * @param options Optional QR code generation options
   * @returns Promise<string> The QR code as a data URL
   */
  async generateQRCode(
    serialKey: string,
    options: QRCode.QRCodeToDataURLOptions = {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    },
  ): Promise<string> {
    try {
      // Generate QR code that points to the booking verification URL
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-booking/${serialKey}`;
      const qrCode = await QRCode.toDataURL(verificationUrl, options);
      return qrCode;
    } catch (error) {
      this.logger.error(`Failed to generate QR code: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate a QR code as a buffer
   * @param serialKey The booking serial key
   * @param options Optional QR code generation options
   * @returns Promise<Buffer> The QR code as a buffer
   */
  async generateQRCodeBuffer(
    serialKey: string,
    options: QRCode.QRCodeToBufferOptions = {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      type: 'png',
    },
  ): Promise<Buffer> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-booking/${serialKey}`;
      const qrCode = await QRCode.toBuffer(verificationUrl, options);
      return qrCode;
    } catch (error) {
      this.logger.error(`Failed to generate QR code buffer: ${error.message}`, error.stack);
      throw error;
    }
  }
}
