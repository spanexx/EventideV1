import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus, CompletionReason } from '../booking/booking.schema';
import { DashboardBookingsQueryDto } from './dto/bookings-query.dto';
import { Availability, AvailabilityDocument } from '../availability/availability.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Booking.name) private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Availability.name) private readonly availabilityModel: Model<AvailabilityDocument>
  ) {}

  async getStats(providerId: string) {
    console.log('📊 [DashboardService] getStats()', { providerId });

    const [totalBookings, upcomingBookings, occupancy, revenue] = await Promise.all([
      this.bookingModel.countDocuments({ providerId }),
      this.bookingModel.countDocuments({ providerId, startTime: { $gte: new Date() }, status: { $ne: BookingStatus.CANCELLED } }),
      this.computeOccupancy(providerId),
      this.computeRevenue(providerId),
    ]);

    // Simple change placeholders (to be refined with period over period)
    const stats = {
      totalBookings,
      revenue,
      upcomingBookings,
      occupancy,
      bookingChange: '0% vs prev',
      revenueChange: '0% vs prev',
      upcomingChange: '0% vs prev',
      occupancyChange: '0% vs prev',
    };

    return stats;
  }

  async getRecentActivity(providerId: string) {
    console.log('📰 [DashboardService] getRecentActivity()', { providerId });
    // Use bookings + availability changes as activity feed (latest 20)
    const recentBookings = await this.bookingModel
      .find({ providerId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    const activities = recentBookings.map((b) => ({
      id: (b as any)._id?.toString(),
      description: `${b.guestName} ${b.status === BookingStatus.CANCELLED ? 'cancelled' : 'booked'} a ${Math.round(((b.endTime as any) - (b.startTime as any)) / 60000)}-minute session`,
      time: b.updatedAt,
      type: b.status === BookingStatus.CANCELLED ? 'cancellation' : 'booking',
    }));

    return activities;
  }

  async getBookings(
    providerId: string,
    query: { status?: BookingStatus; startDate?: string; endDate?: string; page?: number; limit?: number; sortBy?: string; order?: 'asc' | 'desc' }
  ) {
    console.log('📒 [DashboardService] getBookings()', { providerId, query });

    const { status, startDate, endDate } = query;
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const sortBy = query.sortBy || 'startTime';
    const order = query.order === 'asc' ? 1 : -1;

    const filter: any = { providerId };
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.startTime = {} as any;
      if (startDate) (filter.startTime as any).$gte = new Date(startDate);
      if (endDate) (filter.startTime as any).$lte = new Date(endDate);
    }

    const [items, total] = await Promise.all([
      this.bookingModel
        .find(filter)
        .sort({ [sortBy]: order })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.bookingModel.countDocuments(filter),
    ]);

    return { items, total, page, limit };
  }

  private async computeOccupancy(providerId: string): Promise<number> {
    // Occupancy = booked slots / total slots in next 30 days
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [totalSlots, bookedSlots] = await Promise.all([
      this.availabilityModel.countDocuments({ providerId, startTime: { $gte: now, $lte: in30 } }),
      this.availabilityModel.countDocuments({ providerId, startTime: { $gte: now, $lte: in30 }, isBooked: true }),
    ]);

    if (totalSlots === 0) return 0;
    return Math.round((bookedSlots / totalSlots) * 100);
  }

  private async computeRevenue(providerId: string): Promise<number> {
    // No payments module yet; estimate revenue by duration * nominal rate if available on availability in future
    // Placeholder: count of confirmed/completed bookings * 0 for now
    const revenue = 0;
    return revenue;
  }

  async approveBooking(providerId: string, bookingId: string) {
    const booking = await this.bookingModel.findOne({ 
      _id: bookingId, 
      providerId,
      status: BookingStatus.PENDING 
    });
    
    if (!booking) {
      throw new NotFoundException('Pending booking not found');
    }

    booking.status = BookingStatus.CONFIRMED;
    await booking.save();

    console.log('✅ [DashboardService] Booking approved:', bookingId);
    return { message: 'Booking approved successfully', booking };
  }

  async declineBooking(providerId: string, bookingId: string) {
    const booking = await this.bookingModel.findOne({ 
      _id: bookingId, 
      providerId,
      status: BookingStatus.PENDING 
    });
    
    if (!booking) {
      throw new NotFoundException('Pending booking not found');
    }

    booking.status = BookingStatus.CANCELLED;
    await booking.save();

    console.log('❌ [DashboardService] Booking declined:', bookingId);
    return { message: 'Booking declined successfully', booking };
  }

  async completeBooking(providerId: string, bookingId: string, reason?: string) {
    console.error(`🔍 [DashboardService] completeBooking called: providerId=${providerId}, bookingId=${bookingId}, reason=${reason}`);
    
    // First try with providerId match
    let booking = await this.bookingModel.findOne({ 
      _id: bookingId, 
      providerId
    });
    
    // If not found with providerId, try without (for debugging/admin access)
    if (!booking) {
      booking = await this.bookingModel.findOne({ _id: bookingId });
    }
    
    console.log('📋 [DashboardService] booking lookup result:', { 
      found: !!booking, 
      bookingId, 
      providerId,
      bookingProviderId: booking?.providerId,
      bookingStatus: booking?.status 
    });
    
    if (!booking) {
      // Try finding without providerId to see if booking exists at all
      const anyBooking = await this.bookingModel.findOne({ _id: bookingId });
      const debugInfo = {
        searchedProviderId: providerId,
        searchedBookingId: bookingId,
        bookingExists: !!anyBooking,
        actualProviderId: anyBooking?.providerId,
        actualStatus: anyBooking?.status,
        providerIdType: typeof providerId,
        providerIdValue: String(providerId)
      };
      throw new NotFoundException(`Booking not found. Debug: ${JSON.stringify(debugInfo)}`);
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Booking is already completed');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot complete a cancelled booking');
    }

    const now = new Date();
    const appointmentStart = new Date(booking.startTime);
    const appointmentEnd = new Date(booking.endTime);
    
    // Determine completion reason
    let completionReason: CompletionReason;
    if (now < appointmentEnd) {
      completionReason = CompletionReason.MANUAL_DURING;
    } else {
      completionReason = CompletionReason.MANUAL_AFTER;
    }

    booking.status = BookingStatus.COMPLETED;
    booking.completionReason = completionReason;
    booking.completedAt = now;
    if (reason) {
      booking.completionNotes = reason;
    }
    
    await booking.save();

    console.log('✅ [DashboardService] Booking completed:', { bookingId, completionReason, reason });
    return { message: 'Booking completed successfully', booking };
  }

  async cancelBooking(providerId: string, bookingId: string) {
    const booking = await this.bookingModel.findOne({ 
      _id: bookingId, 
      providerId,
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] }
    });
    
    if (!booking) {
      throw new NotFoundException('Booking not found or already completed/cancelled');
    }

    booking.status = BookingStatus.CANCELLED;
    await booking.save();

    console.log('🚫 [DashboardService] Booking cancelled:', bookingId);
    return { message: 'Booking cancelled successfully', booking };
  }
}
