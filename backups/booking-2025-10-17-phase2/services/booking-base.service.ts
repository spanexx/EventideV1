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
    const bookings = await this.bookingModel.find(query).sort(sort).exec();
    return bookings.map(booking => ({
      ...booking.toObject(),
      _id: booking._id.toString()
    }));
  }

  async findById(id: string): Promise<IBooking | null> {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking) return null;
    
    return {
      ...booking.toObject(),
      _id: booking._id.toString()
    };
  }

  async findByIdAndUpdate(id: string, updateData: UpdateBookingDto, session?: any): Promise<IBooking | null> {
    const options: any = {
      new: true,
      runValidators: true,
      context: 'query'
    };
    
    if (session) {
      options.session = session;
    }

    const updated = await this.bookingModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      options
    ).exec();

    if (!updated) return null;

    return {
      ...updated.toObject(),
      _id: updated._id.toString()
    };
  }

  async findBySerialKey(serialKey: string): Promise<IBooking | null> {
    const booking = await this.bookingModel.findOne({ serialKey }).exec();
    if (!booking) return null;
    
    return {
      ...booking.toObject(),
      _id: booking._id.toString()
    };
  }

  async create(createBookingDto: CreateBookingDto, session?: any): Promise<IBooking> {
    const query = this.bookingModel.create([createBookingDto], { session });
    const [created] = await query;
    
    return {
      ...created.toObject(),
      _id: created._id.toString()
    };
  }

  async createMany(bookings: CreateBookingDto[], session?: any): Promise<IBooking[]> {
    const created = await this.bookingModel.create(bookings, { session });
    return created.map(booking => ({
      ...booking.toObject(),
      _id: booking._id.toString()
    }));
  }

  async findByFilter(filter: any): Promise<IBooking[]> {
    const bookings = await this.bookingModel
      .find(filter)
      .sort({ startTime: 1 })
      .exec();

    return bookings.map(booking => ({
      ...booking.toObject(),
      _id: booking._id.toString()
    }));
  }
}
