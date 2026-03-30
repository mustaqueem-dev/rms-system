// apps/menu-service/src/menu/domain/menu-item.entity.ts

import { BaseEntity, Result, Guard, DomainEvent } from '@rms/shared-kernel';
import { Price } from './value-objects/price.vo';
import { Tag }   from './value-objects/tag.vo';

export interface MenuItemProps {
  branchId:               string;
  franchiseId:            string;
  categoryId:             string;
  name:                   string;
  description?:           string;
  price:                  Price;
  isAvailable:            boolean;
  preparationTimeMinutes: number;
  tags:                   Tag[];
  imageUrl?:              string;
  sortOrder:              number;
  createdAt:              Date;
  updatedAt:              Date;
  createdBy:              string;
  updatedBy:              string;
}

// ─── Domain events ────────────────────────────────────────────────────────────

export class MenuItemCreatedEvent extends DomainEvent {
  readonly eventName = 'menu.item.created';
  constructor(
    readonly aggregateId: string,
    readonly branchId:    string,
    readonly franchiseId: string,
  ) { super(); }
}

export class MenuItemUpdatedEvent extends DomainEvent {
  readonly eventName = 'menu.item.updated';
  constructor(
    readonly aggregateId:   string,
    readonly branchId:      string,
    readonly changedFields: string[],
  ) { super(); }
}

export class MenuItemDeletedEvent extends DomainEvent {
  readonly eventName = 'menu.item.deleted';
  constructor(
    readonly aggregateId: string,
    readonly branchId:    string,
  ) { super(); }
}

export class AvailabilityToggledEvent extends DomainEvent {
  readonly eventName = 'menu.item.availability.toggled';
  constructor(
    readonly aggregateId: string,
    readonly branchId:    string,
    readonly isAvailable: boolean,
  ) { super(); }
}

// ─── MenuItem aggregate root ──────────────────────────────────────────────────

export class MenuItem extends BaseEntity<MenuItemProps> {
  private constructor(props: MenuItemProps, id?: string) {
    super(props, id);
  }

  // ─── Factory ─────────────────────────────────────────────────────────────

  static create(
    props: Omit<MenuItemProps, 'isAvailable' | 'sortOrder' | 'createdAt' | 'updatedAt'> & {
      isAvailable?: boolean;
      sortOrder?:   number;
    },
    id?: string
  ): Result<MenuItem, string> {
    const guard = Guard.againstNullOrUndefinedBulk([
      { argument: props.branchId,    argumentName: 'branchId' },
      { argument: props.franchiseId, argumentName: 'franchiseId' },
      { argument: props.categoryId,  argumentName: 'categoryId' },
      { argument: props.name,        argumentName: 'name' },
      { argument: props.price,       argumentName: 'price' },
      { argument: props.createdBy,   argumentName: 'createdBy' },
    ]);
    if (guard.isFailure) return Result.fail(guard.error);

    const nameCheck = Guard.minLength(props.name, 2, 'name');
    if (nameCheck.isFailure) return Result.fail(nameCheck.error);

    const prepCheck = Guard.inRange(props.preparationTimeMinutes, 1, 300, 'preparationTimeMinutes');
    if (prepCheck.isFailure) return Result.fail(prepCheck.error);

    const now  = new Date();
    const item = new MenuItem({
      ...props,
      isAvailable: props.isAvailable ?? true,
      sortOrder:   props.sortOrder   ?? 0,
      createdAt:   now,
      updatedAt:   now,
      updatedBy:   props.createdBy,
    }, id);

    if (!id) {
      item.addDomainEvent(
        new MenuItemCreatedEvent(item.id, props.branchId, props.franchiseId)
      );
    }

    return Result.ok(item);
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  get name():                   string   { return this.props.name; }
  get branchId():               string   { return this.props.branchId; }
  get franchiseId():            string   { return this.props.franchiseId; }
  get categoryId():             string   { return this.props.categoryId; }
  get description():            string | undefined { return this.props.description; }
  get price():                  Price    { return this.props.price; }
  get isAvailable():            boolean  { return this.props.isAvailable; }
  get preparationTimeMinutes(): number   { return this.props.preparationTimeMinutes; }
  get tags():                   Tag[]    { return [...this.props.tags]; }
  get imageUrl():               string | undefined { return this.props.imageUrl; }
  get sortOrder():              number   { return this.props.sortOrder; }
  get createdAt():              Date     { return this.props.createdAt; }
  get updatedAt():              Date     { return this.props.updatedAt; }
  get createdBy():              string   { return this.props.createdBy; }
  get updatedBy():              string   { return this.props.updatedBy; }

  // ─── Behaviour ───────────────────────────────────────────────────────────

  update(
    changes: Partial<Pick<MenuItemProps, 'name' | 'description' | 'categoryId' | 'preparationTimeMinutes' | 'imageUrl' | 'sortOrder'>> & {
      price?: Price;
      tags?:  Tag[];
    },
    updatedBy: string
  ): Result<void, string> {
    const changedFields: string[] = [];

    if (changes.name !== undefined) {
      const check = Guard.minLength(changes.name, 2, 'name');
      if (check.isFailure) return Result.fail(check.error);
      this.props.name = changes.name;
      changedFields.push('name');
    }
    if (changes.description !== undefined) { this.props.description = changes.description; changedFields.push('description'); }
    if (changes.categoryId  !== undefined) { this.props.categoryId  = changes.categoryId;  changedFields.push('categoryId'); }
    if (changes.price       !== undefined) { this.props.price       = changes.price;        changedFields.push('price'); }
    if (changes.tags        !== undefined) { this.props.tags        = changes.tags;         changedFields.push('tags'); }
    if (changes.imageUrl    !== undefined) { this.props.imageUrl    = changes.imageUrl;     changedFields.push('imageUrl'); }
    if (changes.sortOrder   !== undefined) { this.props.sortOrder   = changes.sortOrder;    changedFields.push('sortOrder'); }
    if (changes.preparationTimeMinutes !== undefined) {
      const check = Guard.inRange(changes.preparationTimeMinutes, 1, 300, 'preparationTimeMinutes');
      if (check.isFailure) return Result.fail(check.error);
      this.props.preparationTimeMinutes = changes.preparationTimeMinutes;
      changedFields.push('preparationTimeMinutes');
    }

    if (changedFields.length > 0) {
      this.props.updatedBy = updatedBy;
      this.props.updatedAt = new Date();
      this.addDomainEvent(new MenuItemUpdatedEvent(this.id, this.branchId, changedFields));
    }

    return Result.ok();
  }

  toggleAvailability(updatedBy: string): void {
    this.props.isAvailable = !this.props.isAvailable;
    this.props.updatedBy   = updatedBy;
    this.props.updatedAt   = new Date();
    this.addDomainEvent(new AvailabilityToggledEvent(this.id, this.branchId, this.props.isAvailable));
  }

  markDeleted(deletedBy: string): void {
    this.props.updatedBy = deletedBy;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new MenuItemDeletedEvent(this.id, this.branchId));
  }
}
