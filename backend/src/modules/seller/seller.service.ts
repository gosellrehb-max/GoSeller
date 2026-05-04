import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { normalizeStoredAreasOfDistribution } from './area-of-distribution.util';
import { Seller, SellerDocument, SELLER_TYPES } from './schemas/seller.schema';
import { ApiException } from '../../common/exceptions/api.exception';

/** Returns ObjectId if str is a valid 24-char hex string; otherwise undefined. */
function toObjectIdSafe(str: string | undefined | null): Types.ObjectId | undefined {
  if (str == null || typeof str !== 'string') return undefined;
  const trimmed = str.trim();
  if (trimmed.length !== 24 || !/^[a-fA-F0-9]{24}$/.test(trimmed)) return undefined;
  return new Types.ObjectId(trimmed);
}

export type SellerProfilePayload = Partial<{
  email: string;
  businessName: string;
  type: string;
  phone: string;
  businessType: string;
  businessLicense: string;
  areaOfDistribution?: string[];
  city: string;
  state: string;
  zipCode: string;
  country: string;
  distributionArea: string;
  authorizedTerritories: string;
  parentCompanyId: string;
  storeDescription: string;
  storePickupAddress?: string;
  storeCategory: string;
  storeLogoUrl: string;
  storeBannerUrl: string;
  businessDocumentUrls: string[];
  capabilities: Record<string, boolean | string>;
  status: string;
  verified: boolean;
}>;

@Injectable()
export class SellerService {
  constructor(
    @InjectModel(Seller.name) private sellerModel: Model<SellerDocument>,
  ) {}

  async create(data: {
    userId: string;
    businessName: string;
    type?: string;
  } & SellerProfilePayload): Promise<SellerDocument> {
    const userIdObj = data.userId != null && data.userId !== '' ? new Types.ObjectId(data.userId) : undefined;
    if (!userIdObj) throw ApiException.badRequest('Valid userId is required.');
    const existing = await this.sellerModel.findOne({ userId: userIdObj }).exec();
    if (existing) throw ApiException.conflict('Seller profile already exists for this user.');
    const type = data.type && SELLER_TYPES.includes(data.type as never) ? data.type : 'Shopkeeper';
    const seller = new this.sellerModel({
      userId: userIdObj,
      email: data.email?.trim().toLowerCase() || undefined,
      businessName: data.businessName,
      type,
      phone: data.phone,
      businessType: data.businessType,
      businessLicense: data.businessLicense,
      areaOfDistribution: normalizeStoredAreasOfDistribution(data.areaOfDistribution),
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      country: data.country,
      distributionArea: data.distributionArea,
      authorizedTerritories: data.authorizedTerritories,
      parentCompanyId: toObjectIdSafe(data.parentCompanyId),
      storeDescription: data.storeDescription,
      storePickupAddress: data.storePickupAddress,
      storeCategory: data.storeCategory,
      storeLogoUrl: data.storeLogoUrl,
      storeBannerUrl: data.storeBannerUrl,
      businessDocumentUrls: data.businessDocumentUrls ?? [],
      capabilities: data.capabilities,
    });
    return seller.save();
  }

  async findAll(page = 1, limit = 20, filters?: { type?: string; status?: string; search?: string }) {
    const query: Record<string, unknown> = {};
    if (filters?.type) query.type = filters.type;
    if (filters?.status) query.status = filters.status;
    if (filters?.search) {
      query.businessName = { $regex: filters.search, $options: 'i' };
    }
    const [sellers, total] = await Promise.all([
      this.sellerModel
        .find(query)
        .populate('userId', 'firstName lastName email role')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean()
        .exec(),
      this.sellerModel.countDocuments(query).exec(),
    ]);
    return { sellers, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findById(id: string): Promise<SellerDocument | null> {
    return this.sellerModel.findById(id).populate('userId', 'firstName lastName email role').exec();
  }

  async findByUserId(userId: string): Promise<SellerDocument | null> {
    return this.sellerModel.findOne({ userId: new Types.ObjectId(userId) }).populate('userId').exec();
  }

  /** Return seller _ids whose type is in the given list (for product visibility filtering). */
  async findSellerIdsByTypes(types: string[]): Promise<Types.ObjectId[]> {
    if (!types?.length) return [];
    const sellers = await this.sellerModel.find({ type: { $in: types } }).select('_id').lean().exec();
    return sellers.map((s) => new Types.ObjectId((s as unknown as { _id: { toString(): string } })._id.toString()));
  }

  async updateById(id: string, data: Partial<{ businessName: string; type: string; status: string; verified: boolean }> & SellerProfilePayload): Promise<SellerDocument | null> {
    const set: Record<string, unknown> = { ...data };
    if (data.parentCompanyId !== undefined) {
      set.parentCompanyId = data.parentCompanyId ? new Types.ObjectId(data.parentCompanyId) : null;
    }
    for (const k of Object.keys(set)) {
      if (set[k] === undefined) delete set[k];
    }
    return this.sellerModel.findByIdAndUpdate(id, { $set: set }, { new: true }).populate('userId').exec();
  }

  /** Delete seller by id. Admin only. Does not delete the User account. */
  async deleteById(id: string): Promise<boolean> {
    const result = await this.sellerModel.findByIdAndDelete(id).exec();
    return !!result;
  }
}
