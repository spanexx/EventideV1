import { I18nResolver } from 'nestjs-i18n';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../../modules/users/users.service';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class UserPreferenceResolver implements I18nResolver {
  constructor(private readonly usersService: UsersService) {}

  async resolve(
    context: ExecutionContext,
  ): Promise<string | string[] | undefined> {
    // Get the request object from the context
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];

    if (userId) {
      try {
        const user = await this.usersService.findById(userId as string);
        if (user && user.preferences && user.preferences.language) {
          return user.preferences.language;
        }
      } catch (error) {
        // If user not found or any other error, continue with other resolvers
        return undefined;
      }
    }
    return undefined;
  }
}
