import { Injectable } from "@nestjs/common";
import { SellerService } from "../seller/seller.service";
import { UploadService } from "../upload/upload.service";
import { ProductsService } from "../products/products.service";
import { OrdersService } from "../orders/orders.service";
import { ApiException } from "../../common/exceptions/api.exception";
import {
  AREA_OF_DISTRIBUTION_VALUES,
  SELLER_TYPES,
} from "../seller/schemas/seller.schema";

export type RegisterSellerBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  businessName?: string;
  businessType?: string;
  businessLicense?: string;
  /** When omitted on profile update, areas are not changed. */
  areaOfDistribution?: string[];
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  sellerCategory?: string;
  distributionArea?: string;
  authorizedTerritories?: string;
  parentCompanyId?: string;
  storeDescription?: string;
  /** Where riders collect orders — required on new registration (validated in register). */
  storePickupAddress?: string;
  storeCategory?: string;
  verificationCode?: string;
};

@Injectable()
export class SellerRegistrationService {
  constructor(
    private sellerService: SellerService,
    private uploadService: UploadService,
    private productsService: ProductsService,
    private ordersService: OrdersService,
  ) {}

  /** Pilot: one or both of Islamabad and Rawalpindi. */
  private validateAreaOfDistribution(
    areas: string[] | undefined,
    opts?: { required: boolean },
  ) {
    const required = opts?.required ?? true;
    const list = Array.isArray(areas)
      ? [...new Set(areas.map((a) => (a ?? "").trim()).filter(Boolean))]
      : [];
    if (list.length === 0) {
      if (required) {
        throw ApiException.badRequest(
          "Select at least one area of distribution (Islamabad and/or Rawalpindi).",
        );
      }
      return [];
    }
    for (const a of list) {
      if (
        !AREA_OF_DISTRIBUTION_VALUES.includes(
          a as (typeof AREA_OF_DISTRIBUTION_VALUES)[number],
        )
      ) {
        throw ApiException.badRequest(
          "Areas of distribution must be only Islamabad and/or Rawalpindi.",
        );
      }
    }
    return list;
  }

  async getProfile(sellerId: string) {
    const seller = await this.sellerService.findById(sellerId);
    if (!seller) throw ApiException.notFound("Seller not found.");
    const user = (
      seller as {
        userId?: {
          _id?: unknown;
          firstName?: string;
          lastName?: string;
          email?: string;
        };
      }
    ).userId;
    const name =
      user && typeof user === "object"
        ? [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          (user as { email?: string }).email
        : "";
    const email =
      user && typeof user === "object"
        ? (user as { email?: string }).email
        : "";
    return {
      seller: this.toFrontendSellerProfile(seller, {
        firstName: (user as { firstName?: string })?.firstName,
        lastName: (user as { lastName?: string })?.lastName,
        email,
      }),
    };
  }

  async updateProfile(
    sellerId: string,
    body: RegisterSellerBody & { name?: string },
    files: {
      storeLogo?: Express.Multer.File;
      storeBanner?: Express.Multer.File;
      businessDocuments?: Express.Multer.File[];
    },
  ) {
    const seller = await this.sellerService.findById(sellerId);
    if (!seller) throw ApiException.notFound("Seller not found.");

    let storeLogoUrl = (seller as { storeLogoUrl?: string }).storeLogoUrl;
    let storeBannerUrl = (seller as { storeBannerUrl?: string }).storeBannerUrl;
    let businessDocumentUrls =
      (seller as { businessDocumentUrls?: string[] }).businessDocumentUrls ??
      [];

    if (files.storeLogo) {
      storeLogoUrl = await this.uploadService.uploadImage(
        files.storeLogo.buffer,
        files.storeLogo.mimetype,
        files.storeLogo.originalname,
      );
    }
    if (files.storeBanner) {
      storeBannerUrl = await this.uploadService.uploadImage(
        files.storeBanner.buffer,
        files.storeBanner.mimetype,
        files.storeBanner.originalname,
      );
    }
    if (files.businessDocuments?.length) {
      for (const f of files.businessDocuments) {
        const url = await this.uploadService.uploadImage(
          f.buffer,
          f.mimetype,
          f.originalname,
        );
        businessDocumentUrls.push(url);
      }
    }

    const type =
      body.sellerCategory && SELLER_TYPES.includes(body.sellerCategory as never)
        ? body.sellerCategory
        : undefined;
    let areaPatch: { areaOfDistribution?: string[] } = {};
    if (body.areaOfDistribution !== undefined) {
      const list = this.validateAreaOfDistribution(body.areaOfDistribution, {
        required: true,
      });
      areaPatch = { areaOfDistribution: list };
    }
    const updated = await this.sellerService.updateById(sellerId, {
      businessName: body.businessName,
      type,
      phone: body.phone,
      businessType: body.businessType,
      businessLicense: body.businessLicense,
      ...areaPatch,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      country: body.country,
      distributionArea: body.distributionArea,
      authorizedTerritories: body.authorizedTerritories,
      parentCompanyId: body.parentCompanyId,
      storeDescription: body.storeDescription,
      storePickupAddress: body.storePickupAddress,
      storeCategory: body.storeCategory,
      storeLogoUrl,
      storeBannerUrl,
      businessDocumentUrls,
    });
    if (!updated) throw ApiException.notFound("Seller not found.");
    const user = (
      updated as {
        userId?: { firstName?: string; lastName?: string; email?: string };
      }
    ).userId;
    return { seller: this.toFrontendSellerProfile(updated, user) };
  }

  async getStats(sellerId: string) {
    const seller = await this.sellerService.findById(sellerId);
    if (!seller) throw ApiException.notFound("Seller not found.");
    const userId = (
      seller as {
        userId?: { _id?: { toString(): string }; toString?: () => string };
      }
    ).userId;
    const userIdStr =
      userId && typeof userId === "object" && (userId as { _id?: unknown })._id
        ? (userId as { _id: { toString(): string } })._id.toString()
        : ((userId as { toString?: () => string })?.toString?.() ?? "");
    const [productResult, orderCount] = await Promise.all([
      this.productsService.findSellerProducts(sellerId, 1, 1),
      this.ordersService.countBySellerUserId(userIdStr),
    ]);
    return {
      stats: {
        productCount: productResult.total,
        orderCount,
      },
    };
  }

  private toFrontendSellerProfile(
    seller: unknown,
    user?: { firstName?: string; lastName?: string; email?: string } | null,
  ) {
    const s = seller as {
      _id: { toString(): string };
      businessName: string;
      type: string;
      status: string;
      capabilities?: Record<string, unknown>;
    };
    const name = user
      ? [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.email ||
        ""
      : "";
    return {
      id: s._id.toString(),
      name,
      email: user?.email ?? "",
      businessName: s.businessName,
      sellerCategory: s.type,
      status: s.status,
      capabilities: s.capabilities ?? {},
    };
  }
}
