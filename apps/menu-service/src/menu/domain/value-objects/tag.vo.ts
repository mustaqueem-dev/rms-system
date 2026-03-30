// apps/menu-service/src/menu/domain/value-objects/tag.vo.ts

import { ValueObject, Result, Guard } from '@rms/shared-kernel';

interface TagProps {
  value: string;
}

export class Tag extends ValueObject<TagProps> {
  get value(): string { return this.props.value; }

  private constructor(props: TagProps) {
    super(props);
  }

  static create(raw: string): Result<Tag, string> {
    const notEmpty = Guard.againstEmptyString(raw, 'tag');
    if (notEmpty.isFailure) return Result.fail(notEmpty.error);

    const maxLen = Guard.maxLength(raw, 30, 'tag');
    if (maxLen.isFailure) return Result.fail(maxLen.error);

    // Normalize: lowercase, alphanumeric + hyphens only
    const normalized = raw.toLowerCase().trim().replace(/\s+/g, '-');
    return Result.ok(new Tag({ value: normalized }));
  }
}
