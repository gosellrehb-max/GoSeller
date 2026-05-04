import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { Rider, RiderDocument } from './schemas/rider.schema';
import { UsersService } from '../users/users.service';
import { ApiException } from '../../common/exceptions/api.exception';
import { EmailService } from '../email/email.service';
import { VerificationService } from '../verification/verification.service';
import { UploadService } from '../upload/upload.service';

export type RiderRegistrationPayload = {
  firstName: string;
  lastName: string;
  email: string;
  /** Required for a new account; omit when adding rider to an existing email (OTP verifies access). */
  password?: string;
  verificationCode: string;
  /** Required personal details */
  phone: string;
  address: string;
  idNumber: string;
  /** CNIC / national ID card image (multipart field `idCard`). */
  idCardFile?: Express.Multer.File;
  personalNotes?: string;
  /** Optional courier/company details */
  courierCompanyName?: string;
  courierCompanyBranch?: string;
  courierEmployeeId?: string;
  vehicleType?: string;
  courierCompanyDetails?: string;
};

@Injectable()
export class RidersService {
  constructor(
    @InjectModel(Rider.name) private riderModel: Model<RiderDocument>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private verificationService: VerificationService,
    private uploadService: UploadService,
  ) {}

  private validateName(value: string, fieldName: string) {
    if (!/^[A-Za-z][A-Za-z\s'-]*$/.test((value ?? '').trim())) {
      throw ApiException.badRequest(`${fieldName} must contain letters only.`);
    }
  }

  private validatePhone(value: string) {
    if (!/^\+?[0-9\s()-]+$/.test((value ?? '').trim())) {
      throw ApiException.badRequest('Phone number must contain digits only.');
    }
  }

  private validatePassword(value: string) {
    if (!/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(value ?? '')) {
      throw ApiException.badRequest(
        'Password must be at least 8 characters and contain at least one uppercase letter and one number.',
      );
    }
  }

  private collectRoleLabels(u: { role: string; roles?: string[] }): string[] {
    const set = new Set<string>();
    if (u.role) set.add(u.role);
    if (Array.isArray(u.roles)) u.roles.forEach((r) => set.add(r));
    return [...set];
  }

  private formatRolesMessage(roles: string[]): string {
    const map: Record<string, string> = {
      customer: 'a customer',
      seller: 'a seller',
      rider: 'a rider',
      admin: 'an admin',
      'super-admin': 'an administrator',
    };
    const parts = [...new Set(roles)].map((r) => map[r] ?? r);
    if (parts.length === 0) return 'another account type';
    if (parts.length === 1) return parts[0];
    if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
    return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
  }

  async sendRegistrationCode(email: string) {
    const users = await this.usersService.findUsersByEmail((email ?? '').trim().toLowerCase());
    const hasRider = users.some((u) => {
      const roles = (u as unknown as { roles?: string[] }).roles;
      return (Array.isArray(roles) && roles.includes('rider')) || u.role === 'rider';
    });
    if (hasRider) {
      throw ApiException.badRequest('A rider account already exists for this email.');
    }
    const result = await this.verificationService.sendSignupCode(email, 'rider');
    return {
      ...result,
      existingAccountWithoutRole: users.length > 0,
    };
  }

  /** Before rider signup step 2 — same email can add rider if rider role not present. */
  async checkRegistrationEmail(email: string) {
    const normalizedEmail = (email ?? '').trim().toLowerCase();
    if (!normalizedEmail) throw ApiException.badRequest('Email is required.');
    const users = await this.usersService.findUsersByEmail(normalizedEmail);
    const hasRider = users.some((u) => {
      const roles = (u as unknown as { roles?: string[] }).roles;
      return (Array.isArray(roles) && roles.includes('rider')) || u.role === 'rider';
    });
    const existingAccountWithoutRole = users.length > 0 && !hasRider;
    const existingRoles = users.length === 1 ? this.collectRoleLabels(users[0] as { role: string; roles?: string[] }) : [];
    const summary = this.formatRolesMessage(existingRoles.filter((r) => r !== 'rider'));
    return {
      email: normalizedEmail,
      canRegister: !hasRider,
      existingAccountWithoutRole,
      existingRoles,
      message: hasRider
        ? 'A rider account already exists for this email.'
        : existingAccountWithoutRole
          ? `This email is already registered as ${summary}. We'll email a verification code — we'll add rider access after you confirm.`
          : 'Email is available.',
    };
  }

  /**
   * Ensure a minimal rider profile exists for an authenticated user who just gained rider role
   * through in-session switching. Profile is completed later in account settings.
   */
  async ensureDraftProfileForUser(userId: string, defaults?: { phone?: string }): Promise<RiderDocument> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    /** Empty strings satisfy schema `required`; rider completes fields in profile UI. */
    const rider = new this.riderModel({
      userId: new Types.ObjectId(userId),
      status: 'active',
      phone: (defaults?.phone ?? '').trim(),
      address: '',
      idNumber: '',
    });
    return rider.save();
  }

  async register(data: RiderRegistrationPayload) {
    const email = (data.email ?? '').trim().toLowerCase();
    if (!email) throw ApiException.badRequest('Email is required.');
    if (!(data.phone ?? '').trim()) throw ApiException.badRequest('Phone is required.');
    if (!(data.address ?? '').trim()) throw ApiException.badRequest('Address is required.');
    if (!(data.idNumber ?? '').trim()) throw ApiException.badRequest('ID number is required.');
    if (!data.idCardFile?.buffer?.length) {
      throw ApiException.badRequest('ID card image is required. Upload a clear photo of your national ID.');
    }
    this.validateName(data.firstName ?? '', 'First name');
    this.validateName(data.lastName ?? '', 'Last name');
    this.validatePhone(data.phone ?? '');

    const sameEmailUsers = await this.usersService.findUsersByEmail(email);
    const existingRiderAccount = sameEmailUsers.find((u) => {
      const roles = (u as unknown as { roles?: string[] }).roles;
      return (Array.isArray(roles) && roles.includes('rider')) || u.role === 'rider';
    });
    if (existingRiderAccount) {
      throw ApiException.badRequest('A rider account already exists for this email.');
    }

    const isNewAccount = sameEmailUsers.length === 0;
    if (isNewAccount) {
      if (!(data.password ?? '').trim()) {
        throw ApiException.badRequest('Password is required.');
      }
      this.validatePassword(data.password!);
    }

    await this.verificationService.consumeSignupCode(email, 'rider', data.verificationCode);

    const firstName = (data.firstName ?? '').trim() || 'Rider';
    const lastName = (data.lastName ?? '').trim();
    const phoneTrim = (data.phone ?? '').trim();

    const requireApproval = this.configService.get<boolean>('auth.requireAdminApproval') ?? true;
    /** Same rule as customer/seller: pending only when admin approval is required. */
    const needsApproval = requireApproval;
    const userStatus = needsApproval ? 'pending' : 'active';

    let user;
    if (sameEmailUsers.length === 0) {
      const hashedPassword = await bcrypt.hash(data.password!, 10);
      user = await this.usersService.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone: phoneTrim,
        role: 'rider',
        roles: ['rider'],
        status: userStatus,
        authSource: 'local',
      });
    } else if (sameEmailUsers.length === 1) {
      const existingId = (sameEmailUsers[0] as { _id: { toString(): string } })._id.toString();
      const existingUser = await this.usersService.findById(existingId, true);
      if (!existingUser) throw ApiException.notFound('User not found.');
      user = await this.usersService.addRole(existingId, 'rider');
    } else {
      throw ApiException.conflict(
        'Multiple legacy accounts exist with this email. Contact support/admin to merge accounts before adding rider role.',
      );
    }
    const userId = (user as { _id: { toString(): string } })._id.toString();

    await this.usersService.updateById(userId, { firstName, lastName, phone: phoneTrim }).catch(() => undefined);

    let idCardDocumentUrl: string;
    try {
      idCardDocumentUrl = await this.uploadService.uploadImage(
        data.idCardFile!.buffer,
        data.idCardFile!.mimetype,
        data.idCardFile!.originalname,
      );
    } catch {
      throw ApiException.badRequest('Could not upload ID card image. Check upload configuration or try a smaller image.');
    }

    const existingRider = await this.riderModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    if (existingRider) throw ApiException.conflict('Rider profile already exists for this user.');

    const rider = new this.riderModel({
      userId: new Types.ObjectId(userId),
      status: userStatus,
      phone: phoneTrim,
      address: (data.address ?? '').trim(),
      idNumber: (data.idNumber ?? '').trim(),
      idCardDocumentUrl,
      personalNotes: data.personalNotes,
      courierCompanyName: data.courierCompanyName,
      courierCompanyBranch: data.courierCompanyBranch,
      courierEmployeeId: data.courierEmployeeId,
      vehicleType: data.vehicleType,
      courierCompanyDetails: data.courierCompanyDetails,
    });
    const saved = await rider.save();

    const displayName = [firstName, lastName].filter(Boolean).join(' ') || email;
    this.emailService.sendWelcomeEmail(email, displayName, 'rider').catch(() => {});

    const token = this.jwtService.sign({
      id: (user as { _id: { toString(): string } })._id.toString(),
      email,
      role: 'rider',
      roles: Array.from(
        new Set([
          ...(((user as unknown as { roles?: string[] }).roles ?? []) as string[]),
          ((user as unknown as { role?: string }).role ?? ''),
        ].filter(Boolean)),
      ),
      authSource: 'local',
    });

    return {
      rider: this.toProfile(saved, { firstName, lastName, email }),
      user: {
        id: (user as unknown as { _id: unknown })._id,
        name: `${firstName} ${lastName}`.trim(),
        email,
        role: 'rider',
        roles: Array.from(
          new Set([
            ...(((user as unknown as { roles?: string[] }).roles ?? []) as string[]),
            ((user as unknown as { role?: string }).role ?? ''),
          ].filter(Boolean)),
        ),
        status: userStatus,
      },
      token,
      message:
        userStatus === 'pending'
          ? 'Registration successful. Your account is pending admin approval. You can log in after an admin approves your account.'
          : undefined,
    };
  }

  async findByUserId(userId: string): Promise<RiderDocument | null> {
    return this.riderModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
  }

  async findById(id: string): Promise<RiderDocument | null> {
    return this.riderModel.findById(id).populate('userId', 'firstName lastName email').exec();
  }

  async getProfileByUserId(userId: string) {
    const rider = await this.riderModel.findOne({ userId: new Types.ObjectId(userId) }).populate('userId', 'firstName lastName email').exec();
    if (!rider) return null;
    return this.toProfile(rider as unknown as RiderDocument, undefined);
  }

  /**
   * Rider (or admin) updates profile from multipart fields; optional new ID card image replaces URL.
   */
  async updateMyProfileByUserId(
    userId: string,
    fields: {
      address?: string;
      phone?: string;
      idNumber?: string;
      personalNotes?: string;
      courierCompanyName?: string;
      courierCompanyBranch?: string;
      courierEmployeeId?: string;
      vehicleType?: string;
      courierCompanyDetails?: string;
    },
    idCardFile?: Express.Multer.File,
  ) {
    const existing = await this.findByUserId(userId);
    if (!existing) throw ApiException.notFound('Rider profile not found.');
    const riderId = (existing as { _id: { toString(): string } })._id.toString();
    const $set: Record<string, unknown> = {};
    if (fields.address !== undefined) {
      const a = fields.address.trim();
      if (!a) throw ApiException.badRequest('Address cannot be empty.');
      $set.address = a;
    }
    if (fields.phone !== undefined) {
      const p = fields.phone.trim();
      if (!p) throw ApiException.badRequest('Phone cannot be empty.');
      this.validatePhone(p);
      $set.phone = p;
    }
    if (fields.idNumber !== undefined) {
      const id = fields.idNumber.trim();
      if (!id) throw ApiException.badRequest('ID number cannot be empty.');
      $set.idNumber = id;
    }
    if (fields.personalNotes !== undefined) $set.personalNotes = fields.personalNotes?.trim() || '';
    if (fields.courierCompanyName !== undefined) $set.courierCompanyName = fields.courierCompanyName?.trim();
    if (fields.courierCompanyBranch !== undefined) $set.courierCompanyBranch = fields.courierCompanyBranch?.trim();
    if (fields.courierEmployeeId !== undefined) $set.courierEmployeeId = fields.courierEmployeeId?.trim();
    if (fields.vehicleType !== undefined) $set.vehicleType = fields.vehicleType?.trim();
    if (fields.courierCompanyDetails !== undefined) $set.courierCompanyDetails = fields.courierCompanyDetails?.trim();
    if (idCardFile?.buffer?.length) {
      try {
        $set.idCardDocumentUrl = await this.uploadService.uploadImage(
          idCardFile.buffer,
          idCardFile.mimetype,
          idCardFile.originalname,
        );
      } catch {
        throw ApiException.badRequest(
          'Could not upload ID card image. Check upload configuration or try a smaller image.',
        );
      }
    }
    if (Object.keys($set).length === 0) {
      return this.getProfileByUserId(userId);
    }
    await this.riderModel.findByIdAndUpdate(riderId, { $set }, { new: true }).exec();
    if ($set.phone) {
      await this.usersService.updateById(userId, { phone: String($set.phone) }).catch(() => undefined);
    }
    return this.getProfileByUserId(userId);
  }

  async updateById(id: string, data: Partial<RiderRegistrationPayload>): Promise<RiderDocument | null> {
    const set: Record<string, unknown> = {};
    if (data.phone !== undefined) set.phone = data.phone;
    if (data.address !== undefined) set.address = data.address;
    if (data.idNumber !== undefined) set.idNumber = data.idNumber;
    if ((data as { idCardDocumentUrl?: string }).idCardDocumentUrl !== undefined) {
      set.idCardDocumentUrl = (data as { idCardDocumentUrl?: string }).idCardDocumentUrl;
    }
    if (data.personalNotes !== undefined) set.personalNotes = data.personalNotes;
    if (data.courierCompanyName !== undefined) set.courierCompanyName = data.courierCompanyName;
    if (data.courierCompanyBranch !== undefined) set.courierCompanyBranch = data.courierCompanyBranch;
    if (data.courierEmployeeId !== undefined) set.courierEmployeeId = data.courierEmployeeId;
    if (data.vehicleType !== undefined) set.vehicleType = data.vehicleType;
    if (data.courierCompanyDetails !== undefined) set.courierCompanyDetails = data.courierCompanyDetails;
    return this.riderModel.findByIdAndUpdate(id, { $set: set }, { new: true }).populate('userId').exec();
  }

  /**
   * Legacy draft riders used sentinel strings so Mongoose `required` fields were non-empty.
   * Strip those from API payloads and hide rider `status` until the profile is actually complete
   * so new riders do not see fake CNIC / phone / address text or a misleading "active" badge.
   */
  private riderFieldsForApiResponse(r: RiderDocument | Record<string, unknown>): {
    phone: string;
    address: string;
    idNumber: string;
    idCardDocumentUrl?: string;
    includeStatus: boolean;
    status: string;
  } {
    const doc = r as RiderDocument;
    let phone = String(doc.phone ?? '').trim();
    let address = String(doc.address ?? '').trim();
    let idNumber = String(doc.idNumber ?? '').trim();
    const idCardDocumentUrl = String(doc.idCardDocumentUrl ?? '').trim();

    if (phone === '0000000000') phone = '';
    const legacyAddr = 'please update your address in profile settings.';
    if (address.toLowerCase() === legacyAddr) address = '';
    if (/^pending$/i.test(idNumber)) idNumber = '';

    const profileComplete = Boolean(phone && address && idNumber && idCardDocumentUrl);
    return {
      phone,
      address,
      idNumber,
      idCardDocumentUrl: idCardDocumentUrl || undefined,
      includeStatus: profileComplete,
      status: doc.status,
    };
  }

  private toProfile(rider: RiderDocument | Record<string, unknown>, user?: { firstName?: string; lastName?: string; email?: string }) {
    const r = rider as unknown as RiderDocument & { _id: { toString(): string }; userId?: { firstName?: string; lastName?: string; email?: string } };
    const name = user
      ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
      : r.userId && typeof r.userId === 'object'
        ? [r.userId.firstName, r.userId.lastName].filter(Boolean).join(' ') || (r.userId as { email?: string }).email
        : '';
    const fields = this.riderFieldsForApiResponse(r);
    return {
      id: r._id?.toString?.(),
      userId: (r as { userId?: unknown }).userId,
      ...(fields.includeStatus ? { status: fields.status } : {}),
      phone: fields.phone,
      address: fields.address,
      idNumber: fields.idNumber,
      idCardDocumentUrl: fields.idCardDocumentUrl,
      personalNotes: r.personalNotes,
      courierCompanyName: r.courierCompanyName,
      courierCompanyBranch: r.courierCompanyBranch,
      courierEmployeeId: r.courierEmployeeId,
      vehicleType: r.vehicleType,
      courierCompanyDetails: r.courierCompanyDetails,
      name,
      email: user?.email ?? (r.userId && typeof r.userId === 'object' ? (r.userId as { email?: string }).email : ''),
    };
  }
}
