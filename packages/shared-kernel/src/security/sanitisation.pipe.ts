// packages/shared-kernel/src/security/sanitisation.pipe.ts
//
// NFR-S06: Global sanitisation pipe that strips HTML/script tags from
// all string values before they reach controllers/use-cases.
// Applied alongside GlobalValidationPipe as a global pipe.
//
// Uses a simple regex approach (no external dep). For richer sanitisation
// install `sanitize-html` and replace the stripHtml function.

import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/** Strip HTML and potentially dangerous characters from a string. */
function stripHtml(value: string): string {
  // Remove HTML tags
  let sanitized = value.replace(/<[^>]*>/g, '');
  // Collapse multiple spaces/newlines left by tag removal
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  return sanitized;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') return stripHtml(value);
  if (Array.isArray(value))       return value.map(sanitizeValue);
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = sanitizeValue(v);
    }
    return result;
  }
  return value;
}

@Injectable()
export class SanitisationPipe implements PipeTransform {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    return sanitizeValue(value);
  }
}
