import {
  Controller,
  Get,
  Put,
  Param,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { ApiException } from '../../common/exceptions/api.exception';
import { validatePlain } from '../../common/helpers/validate-plain';
import { parseAreaOfDistributionFromRequest } from '../seller/area-of-distribution.util';
import { SellerService } from '../seller/seller.service';
import { SellerRegistrationService, RegisterSellerBody } from './seller-registration.service';
import { SellerProfileUpdateDto } from './dto/seller-profile-update.dto';
import { hasAdminGrant } from '../../common/auth/request-user.roles';

type JwtUser = { id?: string; _id?: { toString(): string }; role?: string; roles?: string[] };

function parseBody(body: Record<string, unknown>): RegisterSellerBody {
  const str = (v: unknown) => (v === undefined || v === null ? undefined : String(v));
  const hasAreaKey = Object.prototype.hasOwnProperty.call(body, 'areaOfDistribution');
  return {
    firstName: str(body.firstName),
    lastName: str(body.lastName),
    email: str(body.email),
    phone: str(body.phone),
    password: str(body.password),
    businessName: str(body.businessName),
    businessType: str(body.businessType),
    businessLicense: str(body.businessLicense),
    areaOfDistribution: hasAreaKey ? parseAreaOfDistributionFromRequest(body.areaOfDistribution) : undefined,
    city: str(body.city),
    state: str(body.state),
    zipCode: str(body.zipCode),
    country: str(body.country),
    sellerCategory: str(body.sellerCategory),
    distributionArea: str(body.distributionArea),
    authorizedTerritories: str(body.authorizedTerritories),
    parentCompanyId: str(body.parentCompanyId),
    storeDescription: str(body.storeDescription),
    storePickupAddress: str(body.storePickupAddress),
    storeCategory: str(body.storeCategory),
    verificationCode: str(body.verificationCode),
  };
}

function groupFiles(files: Express.Multer.File[]): {
  storeLogo?: Express.Multer.File;
  storeBanner?: Express.Multer.File;
  businessDocuments: Express.Multer.File[];
} {
  const businessDocuments: Express.Multer.File[] = [];
  let storeLogo: Express.Multer.File | undefined;
  let storeBanner: Express.Multer.File | undefined;
  for (const f of files || []) {
    if (f.fieldname === 'storeLogo') storeLogo = f;
    else if (f.fieldname === 'storeBanner') storeBanner = f;
    else if (f.fieldname === 'businessDocuments') businessDocuments.push(f);
  }
  return { storeLogo, storeBanner, businessDocuments };
}

function ownerUserIdFromSellerDoc(userIdRef: unknown): string | undefined {
  if (userIdRef == null) return undefined;
  if (typeof userIdRef === 'object' && userIdRef !== null && '_id' in userIdRef) {
    const id = (userIdRef as { _id?: { toString(): string } })._id;
    return id != null ? id.toString() : undefined;
  }
  return typeof (userIdRef as { toString?: () => string }).toString === 'function'
    ? (userIdRef as { toString(): string }).toString()
    : undefined;
}

@Controller('seller-registration')
@UseGuards(JwtAuthGuard)
export class SellerRegistrationController {
  constructor(
    private readonly registrationService: SellerRegistrationService,
    private readonly sellerService: SellerService,
  ) {}

  private async assertSellerProfileAccess(user: JwtUser, sellerId: string): Promise<void> {
    const uid = user.id ?? user._id?.toString?.();
    if (!uid) throw ApiException.unauthorized('Invalid session.');
    const seller = await this.sellerService.findById(sellerId);
    if (!seller) throw ApiException.notFound('Seller not found.');
    if (hasAdminGrant(user)) return;
    const ownerId = ownerUserIdFromSellerDoc(seller.userId as unknown);
    if (!ownerId || ownerId !== uid) throw ApiException.forbidden();
  }

  @Get('profile/:sellerId')
  async getProfile(
    @Param('sellerId') sellerId: string,
    @CurrentUser() user: JwtUser,
  ) {
    await this.assertSellerProfileAccess(user, sellerId);
    const result = await this.registrationService.getProfile(sellerId);
    return ApiResponseHelper.success(result, 'Seller profile retrieved');
  }

  @Put('profile/:sellerId')
  @UseInterceptors(AnyFilesInterceptor())
  async updateProfile(
    @Param('sellerId') sellerId: string,
    @Req() req: { body: Record<string, unknown>; files?: Express.Multer.File[] },
    @CurrentUser() user: JwtUser,
  ) {
    await this.assertSellerProfileAccess(user, sellerId);
    const body = parseBody(req.body ?? {});
    validatePlain(SellerProfileUpdateDto, body);
    const files = groupFiles(req.files ?? []);
    const result = await this.registrationService.updateProfile(sellerId, body, files);
    return ApiResponseHelper.success(result, 'Seller profile updated');
  }

  @Get('stats/:sellerId')
  async getStats(@Param('sellerId') sellerId: string, @CurrentUser() user: JwtUser) {
    await this.assertSellerProfileAccess(user, sellerId);
    const result = await this.registrationService.getStats(sellerId);
    return ApiResponseHelper.success(result, 'Seller stats retrieved');
  }
}
