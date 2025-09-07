import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { User } from './user.schema';

@ApiTags('public')
@Controller('public/providers')
export class PublicUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get public provider information' })
  @ApiResponse({
    status: 200,
    description: 'Returns public provider information',
  })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async getPublicProvider(@Param('id') id: string): Promise<Partial<User>> {
    try {
      const provider = await this.usersService.findByIdPublic(id);
      return provider;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }
  }
}
