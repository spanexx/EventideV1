import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ProviderAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Get provider ID from JWT token (assuming it's already validated by JWT guard)
    const providerId = request.user?.providerId;
    
    if (!providerId) {
      throw new UnauthorizedException('Provider authentication required');
    }

    return true;
  }
}
