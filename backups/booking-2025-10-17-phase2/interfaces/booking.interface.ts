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
  notes?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
  serialKey: string;
  qrCode?: string; // QR code data URL (optional since it's generated on-demand)
}
