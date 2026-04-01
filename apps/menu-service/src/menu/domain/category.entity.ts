// apps/menu-service/src/menu/domain/category.entity.ts

import { BaseEntity, Result, Guard, DomainEvent } from '@rms/shared-kernel';

export interface CategoryProps {
  branchId:    string;
  franchiseId: string;
  name:        string;
  description?: string;
  sortOrder:   number;
  isActive:    boolean;
  createdAt:   Date;
  updatedAt:   Date;
  createdBy:   string;
  updatedBy:   string;
}

// ─── Domain events ────────────────────────────────────────────────────────────

export class CategoryCreatedEvent extends DomainEvent {
  readonly eventName = 'menu.category.created.v1';
  constructor(
    readonly aggregateId: string,
    readonly branchId:    string,
    readonly franchiseId: string,
  ) { super(); }
}

export class CategoryUpdatedEvent extends DomainEvent {
  readonly eventName = 'menu.category.updated.v1';
  constructor(
    readonly aggregateId: string,
    readonly branchId:    string,
  ) { super(); }
}

export class CategoryDeletedEvent extends DomainEvent {
  readonly eventName = 'menu.category.deleted.v1';
  constructor(
    readonly aggregateId: string,
    readonly branchId:    string,
  ) { super(); }
}

// ─── Category aggregate root ──────────────────────────────────────────────────

export class Category extends BaseEntity<CategoryProps> {
  private constructor(props: CategoryProps, id?: string) {
    super(props, id);
  }

  static create(
    props: Omit<CategoryProps, 'isActive' | 'createdAt' | 'updatedAt' | 'updatedBy'>,
    id?: string,
  ): Result<Category, string> {
    const guard = Guard.againstNullOrUndefinedBulk([
      { argument: props.branchId,    argumentName: 'branchId' },
      { argument: props.franchiseId, argumentName: 'franchiseId' },
      { argument: props.name,        argumentName: 'name' },
      { argument: props.createdBy,   argumentName: 'createdBy' },
    ]);
    if (guard.isFailure) return Result.fail(guard.error);

    const nameCheck = Guard.minLength(props.name, 2, 'name');
    if (nameCheck.isFailure) return Result.fail(nameCheck.error);

    const now = new Date();
    const cat = new Category(
      { ...props, isActive: true, createdAt: now, updatedAt: now, updatedBy: props.createdBy },
      id,
    );

    if (!id) {
      cat.addDomainEvent(new CategoryCreatedEvent(cat.id, props.branchId, props.franchiseId));
    }

    return Result.ok(cat);
  }

  /**
   * Reconstitute an existing Category from a persistence store.
   * Used ONLY by repository mappers — does NOT emit domain events.
   */
  static reconstitute(props: CategoryProps, id: string): Result<Category, string> {
    const guard = Guard.againstNullOrUndefinedBulk([
      { argument: props.branchId,    argumentName: 'branchId' },
      { argument: props.franchiseId, argumentName: 'franchiseId' },
      { argument: props.name,        argumentName: 'name' },
    ]);
    if (guard.isFailure) return Result.fail(guard.error);
    return Result.ok(new Category(props, id));
  }

  get name():        string           { return this.props.name; }
  get branchId():    string           { return this.props.branchId; }
  get franchiseId(): string           { return this.props.franchiseId; }
  get description(): string | undefined { return this.props.description; }
  get sortOrder():   number           { return this.props.sortOrder; }
  get isActive():    boolean          { return this.props.isActive; }
  get createdAt():   Date             { return this.props.createdAt; }
  get updatedAt():   Date             { return this.props.updatedAt; }
  get createdBy():   string           { return this.props.createdBy; }
  get updatedBy():   string           { return this.props.updatedBy; }

  update(
    changes: Partial<Pick<CategoryProps, 'name' | 'description' | 'sortOrder'>>,
    updatedBy: string,
  ): Result<void, string> {
    if (changes.name !== undefined) {
      const check = Guard.minLength(changes.name, 2, 'name');
      if (check.isFailure) return Result.fail(check.error);
      this.props.name = changes.name;
    }
    if (changes.description !== undefined) this.props.description = changes.description;
    if (changes.sortOrder   !== undefined) this.props.sortOrder   = changes.sortOrder;
    this.props.updatedBy = updatedBy;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new CategoryUpdatedEvent(this.id, this.branchId));
    return Result.ok();
  }

  deactivate(deletedBy: string): void {
    this.props.isActive  = false;
    this.props.updatedBy = deletedBy;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new CategoryDeletedEvent(this.id, this.branchId));
  }
}
