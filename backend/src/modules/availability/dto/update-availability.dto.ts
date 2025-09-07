import { PartialType } from '@nestjs/mapped-types';
import { ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { CreateAvailabilityDto } from './create-availability.dto';

@ApiExtraModels(CreateAvailabilityDto)
export class UpdateAvailabilityDto extends PartialType(CreateAvailabilityDto) {}
