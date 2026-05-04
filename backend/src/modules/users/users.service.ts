import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { ApiException } from '../../common/exceptions/api.exception';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /** Prefer {@link findByEmailAndRole} when the role is known (multiple accounts can share an email). */
  async findByEmail(email: string): Promise<UserDocument | null> {
    const users = await this.findUsersByEmail(email);
    if (users.length === 0) return null;
    if (users.length === 1) return users[0];
    return null;
  }

  async findByEmailAndRole(email: string, role: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        email: email.toLowerCase().trim(),
        $or: [{ role }, { roles: role }],
      })
      .exec();
  }

  async findUsersByEmail(email: string): Promise<UserDocument[]> {
    return this.userModel.find({ email: email.toLowerCase().trim() }).exec();
  }

  async findById(id: string, selectPassword = false): Promise<UserDocument | null> {
    const q = this.userModel.findById(id);
    if (selectPassword) q.select('+password');
    return q.exec();
  }

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
    roles?: string[];
    status?: string;
    authSource?: string;
    externalId?: string;
    idpProvider?: string;
  }): Promise<UserDocument> {
    const primaryRole = data.role ?? data.roles?.[0] ?? 'customer';
    const roles = Array.from(new Set([...(data.roles ?? []), primaryRole]));
    const user = new this.userModel({
      ...data,
      email: data.email.toLowerCase().trim(),
      role: primaryRole,
      roles,
      authSource: data.authSource ?? 'local',
    });
    return user.save();
  }

  /** Updates password for a specific user by ID (used for authenticated change-password). */
  async updatePasswordById(id: string, hashedPassword: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { $set: { password: hashedPassword, passwordChangedAt: new Date() } })
      .exec();
  }

  /** Updates password for all local-auth user documents with this email (normally one). */
  async updatePasswordForEmail(email: string, hashedPassword: string): Promise<number> {
    const normalized = email.toLowerCase().trim();
    const res = await this.userModel
      .updateMany(
        {
          email: normalized,
          $or: [{ authSource: 'local' }, { authSource: { $exists: false } }],
        },
        { $set: { password: hashedPassword, passwordChangedAt: new Date() } },
      )
      .exec();
    return res.modifiedCount ?? 0;
  }

  async addRole(userId: string, role: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw ApiException.notFound('User not found');
    const primary = (user as unknown as { role?: string }).role;
    let currentRoles = Array.isArray((user as unknown as { roles?: string[] }).roles)
      ? [...(user as unknown as { roles: string[] }).roles]
      : [];
    if (primary && !currentRoles.includes(primary)) {
      currentRoles = [primary, ...currentRoles];
    }
    if (!currentRoles.includes(role)) {
      currentRoles = [...currentRoles, role];
    }
    (user as unknown as { roles: string[] }).roles = currentRoles;
    if (!(user as unknown as { role?: string }).role) {
      (user as unknown as { role: string }).role = role;
    }
    return user.save();
  }

  /** Return user IDs that have any of the given roles (e.g. for notifying all admins). */
  async findUserIdsByRoles(roles: string[]): Promise<string[]> {
    if (!roles?.length) return [];
    const users = await this.userModel
      .find({
        isDeleted: { $ne: true },
        $or: [{ role: { $in: roles } }, { roles: { $in: roles } }],
      })
      .select('_id')
      .lean()
      .exec();
    return users.map((u) => (u as { _id: { toString(): string } })._id.toString());
  }

  /** Find user by IdP external id (for future IdP callback). */
  async findByExternalId(externalId: string, idpProvider?: string): Promise<UserDocument | null> {
    const query: Record<string, string> = { externalId, authSource: 'idp' };
    if (idpProvider) query.idpProvider = idpProvider;
    return this.userModel.findOne(query).exec();
  }

  /** Admin creates a user (seller or buyer). User is created with status pending by default until admin approves. */
  async createByAdmin(data: {
    name: string;
    email: string;
    password: string;
    role?: 'customer' | 'seller';
    status?: 'pending' | 'active';
  }): Promise<UserDocument> {
    const role = data.role ?? 'customer';
    const existing = await this.findByEmailAndRole(data.email, role);
    if (existing) throw ApiException.conflict(`User already exists with this email for role "${role}"`);
    const nameParts = data.name.trim().split(/\s+/);
    const firstName = nameParts[0] || data.name;
    const lastName = nameParts.slice(1).join(' ') || '';
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.create({
      firstName,
      lastName,
      email: data.email,
      password: hashedPassword,
      role: data.role ?? 'customer',
      status: data.status ?? 'pending',
      authSource: 'local',
    });
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    userType?: string;
    isActive?: boolean;
  }) {
    const { page = 1, limit = 20, search, userType, isActive } = params;
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (userType) {
      const roleFilter = { $or: [{ role: userType }, { roles: userType }] };
      if (query.$or) {
        query.$and = [{ $or: query.$or as unknown[] }, roleFilter];
        delete query.$or;
      } else {
        Object.assign(query, roleFilter);
      }
    }
    if (isActive !== undefined) query.status = isActive ? 'active' : { $ne: 'active' };

    const [users, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);
    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async updateById(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      phone: string;
      isActive: boolean;
      emailVerified: boolean;
      status: string;
      role: string;
    }>,
  ) {
    const setUpdate: Record<string, unknown> = { ...data };
    if (data.isActive !== undefined) setUpdate.status = data.isActive ? 'active' : 'inactive';
    const updateDoc: Record<string, unknown> = { $set: setUpdate };
    if (typeof data.role === 'string' && data.role.trim()) {
      updateDoc.$addToSet = { roles: data.role.trim() };
    }
    const user = await this.userModel.findByIdAndUpdate(id, updateDoc, { new: true }).select('-password').exec();
    if (!user) throw ApiException.notFound('User not found');
    return user;
  }
}
