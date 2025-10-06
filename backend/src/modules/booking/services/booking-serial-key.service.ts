import { Injectable, Logger } from '@nestjs/common';
import { IBooking } from '../interfaces/booking.interface';
import { SerialKeyService } from '../../../core/utils/serial-key.service';
import { QRCodeService } from '../../../core/utils/qr-code.service';

@Injectable()
export class BookingSerialKeyService {
  private readonly logger = new Logger(BookingSerialKeyService.name);

  constructor(
    private readonly serialKeyService: SerialKeyService,
    private readonly qrCodeService: QRCodeService
  ) {}

  generateBookingSerialKey(startTime: Date): string {
    return this.serialKeyService.generateBookingSerialKey(startTime);
  }

  async generateQRCode(serialKey: string): Promise<string> {
    try {
      return await this.qrCodeService.generateQRCode(serialKey);
    } catch (error) {
      this.logger.error(`Failed to generate QR code: ${error.message}`, error.stack);
      throw error;
    }
  }

  async generateQRCodeBuffer(serialKey: string): Promise<Buffer> {
    try {
      return await this.qrCodeService.generateQRCodeBuffer(serialKey);
    } catch (error) {
      this.logger.error(`Failed to generate QR code buffer: ${error.message}`, error.stack);
      throw error;
    }
  }

  async enrichBookingWithQRCode(booking: IBooking): Promise<IBooking> {
    const qrCode = await this.generateQRCode(booking.serialKey);
    return {
      ...booking,
      qrCode
    };
  }
}
