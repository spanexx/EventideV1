import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole, SubscriptionTier } from '../user.schema';

interface GoogleProfile {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}

@Injectable()
export class GoogleOAuthStrategy {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async findOrCreateGoogleUser(profile: GoogleProfile): Promise<UserDocument> {
    // Try to find existing user by Google ID
    let user = await this.userModel
      .findOne({ googleId: profile.googleId })
      .exec();

    if (user) {
      // Update user info if needed
      user.firstName = profile.firstName;
      user.lastName = profile.lastName;
      user.picture = profile.picture;
      return await user.save();
    }

    // If not found by Google ID, try to find by email
    user = await this.userModel.findOne({ email: profile.email }).exec();

    if (user) {
      // Link existing account with Google
      user.googleId = profile.googleId;
      user.firstName = profile.firstName;
      user.lastName = profile.lastName;
      user.picture = profile.picture;
      return await user.save();
    }

    // Create new user
    return await this.userModel.create({
      email: profile.email,
      googleId: profile.googleId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      picture: profile.picture,
      role: UserRole.PROVIDER,
      subscriptionTier: SubscriptionTier.FREE,
      preferences: {},
      isActive: true,
    });
  }

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }
}
