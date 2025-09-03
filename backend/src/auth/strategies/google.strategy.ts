import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../modules/users/users.service';

type GoogleUser = {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  accessToken: string;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    _request: unknown,
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    // Ensure we have valid email
    if (!profile.emails?.[0]?.value) {
      done(new Error('No email provided from Google'));
      return;
    }

    try {
      const googleProfile = {
        googleId: profile.id,
        email: profile.emails[0].value,
        firstName: profile.name?.givenName ?? '',
        lastName: profile.name?.familyName ?? '',
        picture: profile.photos?.[0]?.value ?? '',
      };

      // Create or update user in database
      await this.usersService.findOrCreateGoogleUser(googleProfile);

      const user: GoogleUser = {
        ...googleProfile,
        accessToken,
      };

      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  }
}
