// packages/shared-kernel/src/types/audit.types.ts

/**
 * AuditFields — embedded in every persistent entity for traceability.
 *
 * createdBy / updatedBy store the userId extracted from the JWT
 * so all mutations are attributable to a specific user.
 */
export interface AuditFields {
  createdAt:  Date;
  updatedAt:  Date;
  createdBy:  string;   // userId
  updatedBy:  string;   // userId
  deletedAt?: Date;     // soft-delete timestamp
  deletedBy?: string;   // userId of who soft-deleted
}

/**
 * Partial audit fields for creation — updatedBy/deletedBy not yet set.
 */
export type CreateAuditFields = Pick<AuditFields, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;

/**
 * Helper — builds initial audit fields for a newly created entity.
 */
export function buildCreateAudit(userId: string): CreateAuditFields {
  const now = new Date();
  return {
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    updatedBy: userId,
  };
}

/**
 * Helper — builds updated audit fields for a mutated entity.
 */
export function buildUpdateAudit(userId: string): Pick<AuditFields, 'updatedAt' | 'updatedBy'> {
  return {
    updatedAt: new Date(),
    updatedBy: userId,
  };
}

/**
 * Helper — marks an entity as soft-deleted.
 */
export function buildDeleteAudit(userId: string): Pick<AuditFields, 'deletedAt' | 'deletedBy'> {
  return {
    deletedAt: new Date(),
    deletedBy: userId,
  };
}
