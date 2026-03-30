// packages/event-contracts/src/menu.events.ts

import { IDomainEvent } from '@rms/shared-kernel';

export const MENU_EVENTS = {
  ITEM_CREATED:     'menu.item.created.v1',
  ITEM_UPDATED:     'menu.item.updated.v1',
  ITEM_DELETED:     'menu.item.deleted.v1',
  AVAILABILITY_TOGGLED: 'menu.item.availability.toggled.v1',
} as const;

export interface MenuItemCreatedPayload {
  itemId:                  string;
  branchId:                string;
  franchiseId:             string;
  name:                    string;
  categoryId:              string;
  priceAmount:             number;
  priceCurrency:           string;
  isAvailable:             boolean;
  preparationTimeMinutes:  number;
  tags:                    string[];
  occurredAt:              string;  // ISO 8601
}

export interface MenuItemUpdatedPayload {
  itemId:      string;
  branchId:    string;
  changedFields: string[];   // ['price', 'name', 'isAvailable']
  occurredAt:  string;
}

export interface MenuItemDeletedPayload {
  itemId:    string;
  branchId:  string;
  occurredAt: string;
}