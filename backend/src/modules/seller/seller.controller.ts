import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SellerService } from './seller.service';
import { AuthService } from '../auth/auth.service';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { ApiException } from '../../common/exceptions/api.exception';
import {
  hasAdminGrant,
  hasAnyGrantedRole,
} from '../../common/auth/request-user.roles';
import { normalizeStoredAreasOfDistribution } from './area-of-distribution.util';
import { SELLER_TYPES } from './schemas/seller.schema';

function resolveAreasOfDistribution(seller: Record<string, unknown>): string[] {
  const fromPrimary = normalizeStoredAreasOfDistribution(seller.areaOfDistribution);
  if (fromPrimary.length) return fromPrimary;
  return normalizeStoredAreasOfDistribution(seller.businessAddress);
}

function toFrontendSellerProfile(seller: Record<string, unknown>, user?: { name?: string; email?: string } | null) {
  return {
    id: (seller._id as { toString(): string })?.toString?.(),
    name: user?.name ?? '',
    email: user?.email ?? '',
    businessName: seller.businessName,
    sellerCategory: seller.type,
    status: seller.status,
    phone: seller.phone ?? '',
    businessType: seller.businessType ?? '',
    businessLicense: seller.businessLicense ?? '',
    areaOfDistribution: resolveAreasOfDistribution(seller),
    city: seller.city ?? '',
    state: seller.state ?? '',
    zipCode: seller.zipCode ?? '',
    country: seller.country ?? '',
    distributionArea: seller.distributionArea ?? '',
    authorizedTerritories: seller.authorizedTerritories ?? '',
    storeDescription: seller.storeDescription ?? '',
    storePickupAddress: seller.storePickupAddress ?? '',
    storeCategory: seller.storeCategory ?? '',
    storeLogoUrl: seller.storeLogoUrl ?? '',
    storeBannerUrl: seller.storeBannerUrl ?? '',
    businessDocumentUrls: Array.isArray(seller.businessDocumentUrls) ? seller.businessDocumentUrls : [],
    verified: Boolean(seller.verified),
    capabilities: seller.capabilities ?? {},
  };
}

@Controller('seller')
export class SellerController {
  constructor(
    private readonly sellerService: SellerService,
    private readonly authService: AuthService,
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get('types')
  getSellerTypes() {
    return ApiResponseHelper.success({ types: SELLER_TYPES }, 'Seller types');
  }

  @Post('logout')
  logout() {
    return ApiResponseHelper.success({}, 'Logout successful');
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const result = await this.authService.login(body.email ?? '', body.password ?? '', 'seller');
    const user = result.user as { role?: string; id?: string; name?: string; email?: string };
    if (user.role !== 'seller' && user.role !== 'admin' && user.role !== 'super-admin') {
      throw ApiException.forbidden('Only seller accounts can use this login.');
    }
    const seller = await this.sellerService.findByUserId(String(user.id));
    if (!seller) throw ApiException.forbidden('Seller profile not found. Complete seller registration first.');
    const sellerObj = seller.toObject ? seller.toObject() : (seller as unknown as Record<string, unknown>);
    const profile = toFrontendSellerProfile(sellerObj as Record<string, unknown>, { name: user.name, email: user.email });
    return ApiResponseHelper.success({ token: result.token, seller: profile }, 'Login successful');
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.sellerService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      { type, status, search },
    );
    return ApiResponseHelper.success(
      {
        sellers: result.sellers,
        pagination: { current: result.page, pages: result.pages, total: result.total, limit: result.limit },
      },
      'Sellers retrieved successfully',
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@CurrentUser() user: { id: string; role: string }) {
    if (!hasAnyGrantedRole(user, ['seller', 'admin', 'super-admin'])) {
      throw ApiException.forbidden('Seller account required.');
    }
    const seller = await this.sellerService.findByUserId(user.id);
    if (!seller) throw ApiException.notFound('Seller profile not found. Complete seller registration first.');
    const obj = seller.toObject ? seller.toObject() : (seller as unknown as Record<string, unknown>);
    const populated = obj as { userId?: { firstName?: string; lastName?: string; email?: string } };
    const name = populated.userId ? [populated.userId.firstName, populated.userId.lastName].filter(Boolean).join(' ') || populated.userId.email : '';
    const profile = toFrontendSellerProfile(obj as Record<string, unknown>, { name, email: populated.userId?.email });
    return ApiResponseHelper.success({ seller: profile }, 'Seller profile');
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: { id: string; role: string }) {
    return this.getMyProfile(user);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  async getMyStats(@CurrentUser() user: { id: string; role: string }) {
    if (!hasAnyGrantedRole(user, ['seller', 'admin', 'super-admin'])) {
      throw ApiException.forbidden('Seller account required.');
    }
    const seller = await this.sellerService.findByUserId(user.id);
    if (!seller) throw ApiException.notFound('Seller profile not found.');
    const sellerId = (seller as { _id: { toString(): string } })._id.toString();
    const [productResult, orderCount] = await Promise.all([
      this.productsService.findSellerProducts(sellerId, 1, 1),
      this.ordersService.countBySellerUserId(user.id),
    ]);
    return ApiResponseHelper.success(
      { stats: { productCount: productResult.total, orderCount } },
      'Seller stats retrieved',
    );
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: { id: string; role: string },
    @Body() body: Partial<{ businessName: string; type: string; phone: string; storeDescription: string; storeCategory: string }>,
  ) {
    if (!hasAnyGrantedRole(user, ['seller', 'admin', 'super-admin'])) {
      throw ApiException.forbidden('Seller account required.');
    }
    const seller = await this.sellerService.findByUserId(user.id);
    if (!seller) throw ApiException.notFound('Seller profile not found.');
    const sellerId = (seller as { _id: { toString(): string } })._id.toString();
    const update: Record<string, unknown> = {};
    if (body.businessName !== undefined) update.businessName = body.businessName;
    if (body.type !== undefined && SELLER_TYPES.includes(body.type as never)) update.type = body.type;
    if (body.phone !== undefined) update.phone = body.phone;
    if (body.storeDescription !== undefined) update.storeDescription = body.storeDescription;
    if (body.storeCategory !== undefined) update.storeCategory = body.storeCategory;
    const updated = await this.sellerService.updateById(sellerId, update as never);
    if (!updated) throw ApiException.notFound('Seller not found');
    const obj = updated.toObject ? updated.toObject() : (updated as unknown as Record<string, unknown>);
    const populated = obj as { userId?: { firstName?: string; lastName?: string; email?: string } };
    const name = populated.userId ? [populated.userId.firstName, populated.userId.lastName].filter(Boolean).join(' ') || populated.userId.email : '';
    const profile = toFrontendSellerProfile(obj as Record<string, unknown>, { name, email: populated.userId?.email });
    return ApiResponseHelper.success({ seller: profile }, 'Seller profile updated');
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @CurrentUser() user?: { id: string; role: string }) {
    const seller = await this.sellerService.findById(id);
    if (!seller) throw ApiException.notFound('Seller not found');
    const uid = (seller as { userId?: { _id?: { toString(): string }; toString(): string } }).userId;
    const sellerUserId = (uid && typeof uid === 'object' && (uid as { _id?: unknown })._id
      ? (uid as { _id: { toString(): string } })._id.toString()
      : (uid as { toString(): string })?.toString?.()) ?? '';
    const isOwn = user?.id === sellerUserId;
    const isAdmin = hasAdminGrant(user);
    if (!isOwn && !isAdmin) throw ApiException.forbidden();
    return ApiResponseHelper.success({ seller }, 'Seller retrieved successfully');
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() body: { businessName: string; type?: string },
    @CurrentUser() user: { id: string; role: string },
  ) {
    if (!hasAnyGrantedRole(user, ['seller', 'admin', 'super-admin'])) {
      throw ApiException.forbidden('Seller account required.');
    }
    const seller = await this.sellerService.create({
      userId: user.id,
      businessName: body.businessName,
      type: body.type && SELLER_TYPES.includes(body.type as never) ? body.type : 'Shopkeeper',
    });
    return ApiResponseHelper.created({ seller }, 'Seller profile created');
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  async update(
    @Param('id') id: string,
    @Body() body: { businessName?: string; type?: string; status?: string; verified?: boolean },
  ) {
    const update: Record<string, unknown> = {};
    if (body.businessName !== undefined) update.businessName = body.businessName;
    if (body.type !== undefined) {
      if (!SELLER_TYPES.includes(body.type as never)) throw ApiException.badRequest(`Invalid type. Allowed: ${SELLER_TYPES.join(', ')}`);
      update.type = body.type;
    }
    if (body.status !== undefined) update.status = body.status;
    if (body.verified !== undefined) update.verified = body.verified;
    const seller = await this.sellerService.updateById(id, update as never);
    if (!seller) throw ApiException.notFound('Seller not found');
    return ApiResponseHelper.success({ seller }, 'Seller updated successfully');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  async delete(@Param('id') id: string) {
    const deleted = await this.sellerService.deleteById(id);
    if (!deleted) throw ApiException.notFound('Seller not found');
    return ApiResponseHelper.success({ deleted: true }, 'Seller deleted successfully');
  }
}
