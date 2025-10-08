import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // If no user or data path specified, return whole user object
    if (!user || !data) {
      return user;
    }

    // Return the specific property from user object
    return user[data];
  },
);
