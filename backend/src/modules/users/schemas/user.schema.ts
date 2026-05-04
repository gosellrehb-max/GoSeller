import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class User {
  @Prop({ required: true, trim: true, maxlength: 50 })
  firstName: string;

  @Prop({ required: true, trim: true, maxlength: 50 })
  lastName: string;

  /** Email is the identity key; legacy role-scoped duplicates are still tolerated during migration. */
  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ required: true, minlength: 8, select: false })
  password: string;

  @Prop({ default: 'default-avatar.jpg' })
  avatar: string;

  @Prop({
    enum: [
      'customer',
      'seller',
      'rider',
      'sub-franchise',
      'master-franchise',
      'corporate-franchise',
      'admin',
      'super-admin',
    ],
    default: 'customer',
  })
  role: string;

  /**
   * Future-ready multi-role model.
   * We keep legacy `role` for backward compatibility during migration.
   */
  @Prop({
    type: [String],
    enum: [
      'customer',
      'seller',
      'rider',
      'sub-franchise',
      'master-franchise',
      'corporate-franchise',
      'admin',
      'super-admin',
    ],
    default: ['customer'],
  })
  roles: string[];

  @Prop({ enum: ['active', 'inactive', 'suspended', 'pending'], default: 'active' })
  status: string;

  /** How this user authenticates: local (email/password) or idp (future central verification system). */
  @Prop({ enum: ['local', 'idp'], default: 'local' })
  authSource: string;

  /** IdP subject/id when authSource is idp. Used to link user to central profile system. */
  @Prop({ sparse: true })
  externalId?: string;

  /** Which IdP provider (e.g. "central-profile") when authSource is idp. */
  @Prop()
  idpProvider?: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ default: false })
  phoneVerified: boolean;

  @Prop({ default: 0 })
  loginAttempts: number;

  @Prop()
  lockUntil?: Date;

  @Prop()
  passwordChangedAt?: Date;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  lastActivityAt?: Date;

  @Prop({ type: Object })
  wallet?: { balance?: number; currency?: string };

  @Prop({ type: Object })
  business?: { verified?: boolean; name?: string };

  @Prop({ type: Array, default: [] })
  sessions?: Array<{ token?: string; isActive?: boolean; lastActivity?: Date }>;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

/** Final identity model: one account per email, roles are stored in `roles[]`. */
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ externalId: 1, idpProvider: 1 }, { sparse: true });
UserSchema.index({ roles: 1, status: 1 });

/** Dual-write compatibility between legacy `role` and new `roles[]`. */
UserSchema.pre('save', function (next) {
  const doc = this as User & Document;
  const role = (doc as unknown as { role?: string }).role;
  const roles = (doc as unknown as { roles?: string[] }).roles;

  if ((!roles || roles.length === 0) && role) {
    (doc as unknown as { roles: string[] }).roles = [role];
  } else if ((!role || role.length === 0) && roles && roles.length > 0) {
    (doc as unknown as { role: string }).role = roles[0];
  } else if (role && roles && roles.length > 0 && !roles.includes(role)) {
    (doc as unknown as { roles: string[] }).roles = [role, ...roles];
  }

  next();
});

UserSchema.virtual('isLocked').get(function (this: User & Document) {
  return !!(this.lockUntil && this.lockUntil > new Date());
});

export type UserDocument = User & Document;
