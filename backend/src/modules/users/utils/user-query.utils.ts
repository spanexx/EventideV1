import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../user.schema';

@Injectable()
export class UserQueryUtils {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByIdPublic(id: string): Promise<Partial<UserDocument>> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    // Return only public information
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      businessName: user.businessName,
      bio: user.bio,
      location: user.location,
      contactPhone: user.contactPhone,
      services: user.services,
      categories: user.categories,
      customCategories: user.customCategories,
      availableDurations: user.availableDurations,
      rating: user.rating,
      reviewCount: user.reviewCount,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      picture: user.picture,
    };
  }

  async findAllPublicProviders(
    search?: string,
    location?: string,
    service?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    const query: any = {
      isActive: true,
      role: UserRole.PROVIDER,
    };

    // Add search filter
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
      ];
    }

    // Add location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Add service filter
    if (service) {
      query.services = { $in: [service] };
    }

    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      this.userModel
        .find(query)
        .select(
          'id email username firstName lastName businessName bio location locationDetails contactPhone services categories customCategories availableDurations rating reviewCount subscriptionTier picture',
        )
        .skip(skip)
        .limit(limit)
        .sort({ rating: -1, reviewCount: -1 })
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      providers: results.map((user) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        bio: user.bio,
        location: user.location,
        locationDetails: user.locationDetails,
        contactPhone: user.contactPhone,
        services: user.services,
        categories: user.categories,
        customCategories: user.customCategories,
        availableDurations: user.availableDurations,
        rating: user.rating,
        reviewCount: user.reviewCount,
        subscriptionTier: user.subscriptionTier,
        picture: user.picture,
      })),
      total,
      page,
      pages: totalPages,
    };
  }

  async findAllActive(): Promise<UserDocument[]> {
    return this.userModel.find({ isActive: true }).exec();
  }

  async findAllActivePaginated(
    page: number = 1,
    limit: number = 10,
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const [results, total] = await Promise.all([
      this.userModel.find({ isActive: true }).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments({ isActive: true }).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
