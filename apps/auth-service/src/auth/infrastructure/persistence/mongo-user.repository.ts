// apps/auth-service/src/auth/infrastructure/persistence/mongo-user.repository.ts

import { Injectable }          from '@nestjs/common';
import { InjectModel }         from '@nestjs/mongoose';
import { Model }               from 'mongoose';
import { UserRole, Result }    from '@rms/shared-kernel';
import { User }                from '../../domain/user.entity';
import { Email }               from '../../domain/value-objects/email.vo';
import { HashedPassword }      from '../../domain/value-objects/hashed-password.vo';
import { IUserRepository }     from '../../domain/repositories/user.repository.interface';
import { UserModel, UserDocument } from './user.schema';

@Injectable()
export class MongoUserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserModel.name) private readonly model: Model<UserDocument>
  ) {}

  async findById(id: string): Promise<User | null> {
    const doc = await this.model.findById(id).lean().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.model.findOne({ email: email.toLowerCase() }).lean().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async save(user: User): Promise<void> {
    await this.model.create({
      _id:          user.id,
      email:        user.email,
      passwordHash: user.passwordHash,
      name:         user.name,
      role:         user.role,
      franchiseId:  user.franchiseId,
      branchId:     user.branchId,
      isActive:     user.isActive,
      createdAt:    user.createdAt,
      updatedAt:    user.updatedAt,
    });
  }

  async update(user: User): Promise<void> {
    await this.model.findByIdAndUpdate(user.id, {
      passwordHash: user.passwordHash,
      name:         user.name,
      isActive:     user.isActive,
      updatedAt:    user.updatedAt,
    }).exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.model.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  // ─── Mapper: raw Mongo doc → User aggregate ───────────────────────────────

  private toDomain(doc: Record<string, any>): User {
    const emailResult = Email.create(doc.email);
    const pwResult    = HashedPassword.fromHash(doc.passwordHash);

    // These should never fail if the DB is consistent — throw if they do
    if (emailResult.isFailure) throw new Error(`Corrupt email in DB for user ${doc._id}`);
    if (pwResult.isFailure)    throw new Error(`Corrupt password hash in DB for user ${doc._id}`);

    const userResult = User.create(
      {
        email:       emailResult.value,
        password:    pwResult.value,
        name:        doc.name,
        role:        doc.role as UserRole,
        franchiseId: doc.franchiseId,
        branchId:    doc.branchId,
      },
      doc._id
    );

    if (userResult.isFailure) throw new Error(`Cannot reconstitute User ${doc._id}: ${userResult.error}`);
    return userResult.value;
  }
}
