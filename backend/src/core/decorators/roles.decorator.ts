import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/modules/users/user.schema';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
