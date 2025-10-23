export interface IBooking {
  _id: string;
  providerId: string;
  availabilityId: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: string;
  totalAmount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
  serialKey: string;
  qrCode?: string; // QR code data URL (optional since it's generated on-demand)
}
