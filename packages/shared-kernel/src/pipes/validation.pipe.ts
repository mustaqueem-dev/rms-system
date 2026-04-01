// packages/shared-kernel/src/pipes/validation.pipe.ts
//
// Global validation pipe that:
//   1. Transforms plain request bodies to typed DTO instances (class-transformer)
//   2. Validates them with class-validator decorators
//   3. Strips unknown properties (whitelist) to prevent mass assignment
//   4. Returns structured 422 errors mapped to the SRS response envelope

import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

function flattenErrors(errors: ValidationError[], prefix = ''): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    const field = prefix ? `${prefix}.${error.property}` : error.property;
    if (error.constraints) {
      messages.push(...Object.values(error.constraints).map((m) => `${field}: ${m}`));
    }
    if (error.children?.length) {
      messages.push(...flattenErrors(error.children, field));
    }
  }
  return messages;
}

@Injectable()
export class GlobalValidationPipe implements PipeTransform {
  async transform(value: unknown, { metatype }: ArgumentMetadata): Promise<unknown> {
    // Skip primitives and metadata types that don't need validation
    if (!metatype || !this.shouldValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value, {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    });

    const errors = await validate(object as object, {
      whitelist: true,           // strip unknown props (mass-assignment protection)
      forbidNonWhitelisted: false,
      forbidUnknownValues: false,
      skipMissingProperties: false,
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        details: flattenErrors(errors),
      });
    }

    return object;
  }

  private shouldValidate(metatype: unknown): boolean {
    const primitives = [String, Boolean, Number, Array, Object];
    return !primitives.includes(metatype as never);
  }
}
