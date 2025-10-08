import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentProvider = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Extract providerId from the JWT payload
    return request.user?.providerId;
  },
);
