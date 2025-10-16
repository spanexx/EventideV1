import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PublicUsersController } from './public-users.controller';
import { AccessCodeService } from './services/access-code.service';
import { EmailModule } from '../../core/email/email.module';

// Import modular components
import { AuthProvider } from './providers/auth.provider';
import { UserQueryUtils } from './utils/user-query.utils';
import { UserManagementUtils } from './utils/user-management.utils';
import { PreferencesHandler } from './handlers/preferences.handler';
import { GoogleOAuthStrategy } from './strategies/google-oauth.strategy';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    EmailModule,
  ],
  providers: [
    UsersService, 
    AccessCodeService,
    // Modular components
    AuthProvider,
    UserQueryUtils,
    UserManagementUtils,
    PreferencesHandler,
    GoogleOAuthStrategy,
  ],
  controllers: [UsersController, PublicUsersController],
  exports: [UsersService, AccessCodeService], // Export for use in other modules
})
export class UsersModule {}
