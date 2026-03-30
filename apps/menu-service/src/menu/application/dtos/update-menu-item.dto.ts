// apps/menu-service/src/menu/application/dtos/update-menu-item.dto.ts

import { PartialType } from '@nestjs/swagger';
import { CreateMenuItemDto } from './create-menu-item.dto';

/**
 * All fields from CreateMenuItemDto become optional for patch updates.
 * PartialType also inherits Swagger decorators.
 */
export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {}
