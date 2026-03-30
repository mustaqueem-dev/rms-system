// apps/auth-service/src/auth/domain/user.entity.ts

import { BaseEntity, Result, Guard, DomainEvent } from '@rms/shared-kernel';
import { UserRole }                                from '@rms/shared-kernel';
import { Email }                                   from './value-objects/email.vo';
import { HashedPassword }                          from './value-objects/hashed-password.vo';

export interface UserProps {
  email:       Email;
  password:    HashedPassword;
  name:        string;
  role:        UserRole;
  franchiseId: string;
  branchId?:   string;
  isActive:    boolean;
  createdAt:   Date;
  updatedAt:   Date;
}

// ─── Domain Events ────────────────────────────────────────────────────────────

export class UserRegisteredEvent extends DomainEvent {
  readonly eventName = 'auth.user.registered';

  constructor(
    readonly aggregateId: string,
    readonly email:       string,
    readonly role:        string,
    readonly franchiseId: string,
  ) {
    super();
  }
}

export class PasswordChangedEvent extends DomainEvent {
  readonly eventName   = 'auth.password.changed';
  readonly aggregateId: string;

  constructor(userId: string) {
    super();
    this.aggregateId = userId;
  }
}

// ─── User aggregate root ──────────────────────────────────────────────────────

export class User extends BaseEntity<UserProps> {
  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }

  // ─── Factory method ───────────────────────────────────────────────────────

  static create(
    props: Omit<UserProps, 'isActive' | 'createdAt' | 'updatedAt'>,
    id?:   string
  ): Result<User, string> {
    const guardResult = Guard.againstNullOrUndefinedBulk([
      { argument: props.email,       argumentName: 'email' },
      { argument: props.password,    argumentName: 'password' },
      { argument: props.name,        argumentName: 'name' },
      { argument: props.role,        argumentName: 'role' },
      { argument: props.franchiseId, argumentName: 'franchiseId' },
    ]);

    if (guardResult.isFailure) return Result.fail(guardResult.error);

    const nameCheck = Guard.minLength(props.name, 2, 'name');
    if (nameCheck.isFailure) return Result.fail(nameCheck.error);

    const now  = new Date();
    const user = new User(
      { ...props, isActive: true, createdAt: now, updatedAt: now },
      id
    );

    // Emit domain event only when creating a brand new user (no id provided)
    if (!id) {
      user.addDomainEvent(
        new UserRegisteredEvent(user.id, props.email.value, props.role, props.franchiseId)
      );
    }

    return Result.ok(user);
  }

  // ─── Getters ──────────────────────────────────────────────────────────────

  get email():       string    { return this.props.email.value; }
  get name():        string    { return this.props.name; }
  get role():        UserRole  { return this.props.role; }
  get franchiseId(): string    { return this.props.franchiseId; }
  get branchId():    string | undefined { return this.props.branchId; }
  get isActive():    boolean   { return this.props.isActive; }
  get passwordHash(): string   { return this.props.password.value; }
  get createdAt():   Date      { return this.props.createdAt; }
  get updatedAt():   Date      { return this.props.updatedAt; }

  // ─── Behaviour ───────────────────────────────────────────────────────────

  changePassword(newHashedPassword: HashedPassword): void {
    this.props.password  = newHashedPassword;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new PasswordChangedEvent(this.id));
  }

  deactivate(): void {
    this.props.isActive  = false;
    this.props.updatedAt = new Date();
  }

  updateName(name: string): Result<void, string> {
    const check = Guard.minLength(name, 2, 'name');
    if (check.isFailure) return Result.fail(check.error);
    this.props.name      = name;
    this.props.updatedAt = new Date();
    return Result.ok();
  }
}
