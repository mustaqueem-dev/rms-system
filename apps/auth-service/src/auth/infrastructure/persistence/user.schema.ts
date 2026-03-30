// apps/auth-service/src/auth/infrastructure/persistence/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document }                    from 'mongoose';

export type UserDocument = UserModel & Document;

@Schema({ collection: 'users', timestamps: false, versionKey: false })
export class UserModel {
  @Prop({ required: true, unique: true })
  _id: string;   // UUID — we control the ID, not Mongo

  @Prop({ required: true, unique: true, index: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['SUPER_ADMIN', 'FRANCHISE_OWNER', 'BRANCH_MANAGER', 'STAFF'] })
  role: string;

  @Prop({ required: true, index: true })
  franchiseId: string;

  @Prop({ index: true })
  branchId?: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true, default: () => new Date() })
  createdAt: Date;

  @Prop({ required: true, default: () => new Date() })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserModel);

// Compound index for tenant-scoped queries
UserSchema.index({ franchiseId: 1, branchId: 1, role: 1 });
