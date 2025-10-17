import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../booking.schema';
import { IBooking } from '../interfaces/booking.interface';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';

@Injectable()
export class BookingBaseService {
  private readonly logger = new Logger(BookingBaseService.name);

  constructor(
    @InjectModel(Booking.name)
    private bookingModel: Model<BookingDocument>
  ) {}

  async find(query: any, sort: any = { startTime: 1 }): Promise<IBooking[]> {
    this.logger.log(`[BookingBaseService] Executing find query: ${JSON.stringify(query)}`);
    const bookings = await this.bookingModel.find(query).sort(sort).exec();
    this.logger.log(`[BookingBaseService] Found ${bookings.length} bookings`);
    return bookings.map(booking => ({
      ...booking.toObject(),
      _id: booking._id.toString()
    }));
  }

  async findById(id: string): Promise<IBooking | null> {
    this.logger.log(`[BookingBaseService] Finding booking by ID: ${id}`);
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking) {
      this.logger.warn(`[BookingBaseService] Booking not found with ID: ${id}`);
      return null;
    }

    this.logger.log(`[BookingBaseService] Found booking: ${booking._id} (${booking.guestName})`);
    return {
      ...booking.toObject(),
      _id: booking._id.toString()
    };
  }

  async findByIdAndUpdate(id: string, updateData: UpdateBookingDto, session?: any): Promise<IBooking | null> {
    this.logger.log(`[BookingBaseService] Updating booking ${id} with data:`, updateData);

    const options: any = {
      new: true,
      runValidators: true,
      context: 'query'
    };

    if (session) {
      options.session = session;
      this.logger.log(`[BookingBaseService] Using transaction session`);
    }

    const updated = await this.bookingModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      options
    ).exec();

    if (!updated) {
      this.logger.warn(`[BookingBaseService] Failed to update booking ${id} - not found`);
      return null;
    }

    this.logger.log(`[BookingBaseService] Successfully updated booking ${id} to status: ${updated.status}`);
    return {
      ...updated.toObject(),
      _id: updated._id.toString()
    };
  }

  async findBySerialKey(serialKey: string): Promise<IBooking | null> {
    this.logger.log(`[BookingBaseService] Finding booking by serial key: ${serialKey}`);
    const booking = await this.bookingModel.findOne({ serialKey }).exec();
    if (!booking) {
      this.logger.warn(`[BookingBaseService] Booking not found with serial key: ${serialKey}`);
      return null;
    }

    this.logger.log(`[BookingBaseService] Found booking by serial key: ${booking._id}`);
    return {
      ...booking.toObject(),
      _id: booking._id.toString()
    };
  }

  async create(createBookingDto: CreateBookingDto, session?: any): Promise<IBooking> {
    this.logger.log(`[BookingBaseService] Creating booking:`, {
      providerId: createBookingDto.providerId,
      guestName: createBookingDto.guestName,
      guestEmail: createBookingDto.guestEmail,
      startTime: createBookingDto.startTime,
      endTime: createBookingDto.endTime
    });

    const query = this.bookingModel.create([createBookingDto], { session });
    const [created] = await query;

    this.logger.log(`[BookingBaseService] Successfully created booking: ${created._id} (${created.serialKey})`);
    return {
      ...created.toObject(),
      _id: created._id.toString()
    };
  }

  async createMany(bookings: CreateBookingDto[], session?: any): Promise<IBooking[]> {
    this.logger.log(`[BookingBaseService] Creating ${bookings.length} bookings in batch`);

    const created = await this.bookingModel.create(bookings, { session });
    this.logger.log(`[BookingBaseService] Successfully created ${created.length} bookings`);

    return created.map(booking => ({
      ...booking.toObject(),
      _id: booking._id.toString()
    }));
  }

  async findByFilter(filter: any): Promise<IBooking[]> {
    this.logger.log(`[BookingBaseService] Executing findByFilter: ${JSON.stringify(filter)}`);
    const bookings = await this.bookingModel
      .find(filter)
      .sort({ startTime: 1 })
      .exec();

    this.logger.log(`[BookingBaseService] findByFilter returned ${bookings.length} bookings`);
    return bookings.map(booking => ({
      ...booking.toObject(),
      _id: booking._id.toString()
    }));
  }
}
