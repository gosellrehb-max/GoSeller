import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { ProductsService } from './products.service';
import { SellerService } from '../seller/seller.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtOptionalAuthGuard } from '../../common/guards/jwt-optional-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { ApiException } from '../../common/exceptions/api.exception';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import {
  hasActiveRole,
  hasAdminGrant,
  hasAnyGrantedRole,
} from '../../common/auth/request-user.roles';

const ADMIN_PRODUCT_FIELDS = [
  'isFeatured',
  'featuredPriority',
  'featuredUntil',
  'trendingScore',
  'trendingUpdatedAt',
  'ordersLast24h',
  'viewsLast24h',
  'cartAddsLast24h',
  'wishlistLast24h',
] as const;

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly sellerService: SellerService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @UseGuards(JwtOptionalAuthGuard)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
    @Query('featured') featured?: string,
    /** ids[]=<objectId>&ids[]=<objectId> — used by recently-viewed and cart-merge batch fetches */
    @Query('ids') rawIds?: string | string[],
    @CurrentUser() user?: { id: string; role: string } | null,
  ) {
    const hideForSeller = this.configService.get<boolean>('products.hideCatalogForSellers');
    if (hideForSeller && user?.role === 'seller') {
      const parsedLimit = limit ? parseInt(limit, 10) : 20;
      const lim = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 20;
      return ApiResponseHelper.success(
        {
          products: [],
          pagination: { current: 1, pages: 0, total: 0, limit: lim },
        },
        'Products retrieved successfully',
      );
    }

    const query: Record<string, unknown> = {};
    const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

    // Batch-by-ID filter — normalise to array, strip invalid ObjectIds.
    if (rawIds) {
      const idArr = (Array.isArray(rawIds) ? rawIds : [rawIds])
        .map((s) => String(s).trim())
        .filter((s) => Types.ObjectId.isValid(s));
      if (idArr.length > 0) {
        query._id = { $in: idArr.map((s) => new Types.ObjectId(s)) };
      }
    }

    if (featured === 'true' || featured === '1') {
      query.isFeatured = true;
    }
    if (category) query.category = category;
    if (status) {
      query.status = status;
    } else if (!isAdmin) {
      query.status = 'approved';
      query.isActive = true;
    }
    const parsedPage = page ? parseInt(page, 10) : 1;
    const normalizedPage = Number.isFinite(parsedPage) ? Math.max(parsedPage, 1) : 1;
    // When the caller supplies specific IDs, default the limit to cover all of them.
    const idCount = query._id ? (query._id as { $in: unknown[] }).$in.length : 0;
    const defaultLimit = idCount > 0 ? Math.min(idCount, 100) : 20;
    const parsedLimit = limit ? parseInt(limit, 10) : defaultLimit;
    const normalizedLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : defaultLimit;
    const result = await this.productsService.findAll(
      query,
      normalizedPage,
      normalizedLimit,
      {
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
        search: search || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      },
    );
    return ApiResponseHelper.success(
      {
        products: result.products,
        pagination: { current: result.page, pages: result.pages, total: result.total, limit: result.limit },
      },
      'Products retrieved successfully',
    );
  }

  /**
   * GET /products/home-shelves
   * Returns featured, discounts, trending, and newArrivals in one batched response.
   * Must be declared before @Get(':id') so Express does not treat "home-shelves" as an id param.
   */
  @Get('home-shelves')
  @UseGuards(JwtOptionalAuthGuard)
  async getHomeShelves(@CurrentUser() user?: { id: string; role: string } | null) {
    const hideForSeller = this.configService.get<boolean>('products.hideCatalogForSellers');
    if (hideForSeller && user?.role === 'seller') {
      return ApiResponseHelper.success(
        { featured: [], discounts: [], trending: [], newArrivals: [] },
        'Home shelves retrieved',
      );
    }
    const data = await this.productsService.getHomeShelves();
    return ApiResponseHelper.success(data, 'Home shelves retrieved');
  }

  @Get('seller/:sellerId/manage')
  async sellerManage(
    @Param('sellerId') sellerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.productsService.findSellerProducts(
      sellerId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      { status, category, search },
    );
    return ApiResponseHelper.success(
      {
        products: result.products,
        pagination: { current: result.page, pages: result.pages, total: result.total, limit: result.limit },
      },
      'Seller products retrieved successfully',
    );
  }

  /** List products by seller (frontend GET /products/seller/:sellerId). */
  @Get('seller/:sellerId')
  async listBySeller(
    @Param('sellerId') sellerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.productsService.findSellerProducts(
      sellerId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      { status, category, search },
    );
    return ApiResponseHelper.success(
      {
        products: result.products,
        pagination: { current: result.page, pages: result.pages, total: result.total, limit: result.limit },
      },
      'Products retrieved successfully',
    );
  }

  /** Authenticated seller product list (no client sellerId dependency). */
  @Get('seller-self')
  @UseGuards(JwtAuthGuard)
  async listMySellerProducts(
    @CurrentUser() user: { id: string; role: string; roles?: string[] },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    if (
      !hasAnyGrantedRole(user, ['seller', 'admin', 'super-admin'])
    ) {
      throw ApiException.forbidden('Seller access required');
    }
    const seller = await this.sellerService.findByUserId(user.id);
    if (!seller) {
      throw ApiException.notFound('Seller profile not found');
    }
    const sellerId = (seller as { _id: { toString(): string } })._id.toString();
    const result = await this.productsService.findSellerProducts(
      sellerId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      { status, category, search },
    );
    return ApiResponseHelper.success(
      {
        products: result.products,
        pagination: { current: result.page, pages: result.pages, total: result.total, limit: result.limit },
      },
      'Seller products retrieved successfully',
    );
  }

  @Get('check-sku')
  async checkSku(@Query('sku') sku?: string) {
    const value = String(sku ?? '').trim();
    if (!value) {
      return ApiResponseHelper.success({ available: true, sku: '' }, 'SKU is optional');
    }
    const available = await this.productsService.isSkuAvailable(value);
    return ApiResponseHelper.success({ available, sku: value }, available ? 'SKU is available' : 'SKU is already in use');
  }

  @Post(':id/view')
  @UseGuards(JwtOptionalAuthGuard)
  async recordView(
    @Param('id') id: string,
    @CurrentUser() user?: { id: string; role: string } | null,
  ) {
    if (
      hasActiveRole(user, 'seller') ||
      hasActiveRole(user, 'admin') ||
      hasActiveRole(user, 'super-admin')
    ) {
      return ApiResponseHelper.success({ counted: false }, 'Product view ignored');
    }

    const counted = await this.productsService.incrementViews(id);
    return ApiResponseHelper.success({ counted }, 'Product view recorded');
  }

  @Get(':id')
  @UseGuards(JwtOptionalAuthGuard)
  async findOne(@Param('id') id: string, @CurrentUser() user?: { id: string; role: string } | null) {
    const product = await this.productsService.findById(id);
    if (!product) throw ApiException.notFound('Product not found');

    const isAdmin = hasAdminGrant(user);
    const hideForSeller = this.configService.get<boolean>('products.hideCatalogForSellers');

    /** Owning seller may load their listing for edit (pending/inactive); bypass catalog + B2B rules. */
    let isOwningSeller = false;
    if (user && hasActiveRole(user, 'seller')) {
      const seller = await this.sellerService.findByUserId(user.id);
      if (seller) {
        const ownerSellerId = (seller as { _id: { toString(): string } })._id.toString();
        const p = product as { sellerId?: { _id?: unknown; toString?: () => string } | unknown };
        const sid = p.sellerId;
        const productSellerId =
          sid && typeof sid === 'object' && sid !== null && '_id' in sid
            ? String((sid as { _id: { toString(): string } })._id)
            : sid != null && typeof (sid as { toString?: () => string }).toString === 'function'
              ? (sid as { toString(): string }).toString()
              : String(sid);
        isOwningSeller = productSellerId === ownerSellerId;
      }
    }

    if (hideForSeller && hasActiveRole(user, 'seller') && !isOwningSeller) {
      throw ApiException.notFound('Product not found.');
    }

    if (isOwningSeller && hasActiveRole(user, 'seller')) {
      return ApiResponseHelper.success({ product }, 'Product retrieved successfully');
    }

    if (!isAdmin && (product.status !== 'approved' || !product.isActive)) {
      if (product.status !== 'approved') {
        throw ApiException.notFound('This product is not approved yet and is not available.');
      }
      throw ApiException.notFound('This product is not available.');
    }

    return ApiResponseHelper.success({ product }, 'Product retrieved successfully');
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateProductDto, @CurrentUser() user?: { id: string; role: string; roles?: string[] }) {
    const payload: Record<string, unknown> = { ...dto };
    const isAdmin = hasAdminGrant(user);
    const isSeller = hasAnyGrantedRole(user, ['seller']);
    if (!isAdmin) {
      ADMIN_PRODUCT_FIELDS.forEach((field) => delete payload[field]);
    }
    if ((isSeller || isAdmin) && user?.id) {
      const seller = await this.sellerService.findByUserId(user.id);
      if (seller) {
        payload.sellerId = (seller as { _id: { toString(): string } })._id.toString();
      }
    }
    if (!payload.sellerId) throw ApiException.badRequest('Seller profile required to create products. Register as seller first.');
    const product = await this.productsService.create(payload as never);
    return ApiResponseHelper.created({ product }, 'Product created successfully');
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: { id: string; role: string; roles?: string[] },
  ) {
    const isAdmin = hasAdminGrant(user);
    const payload: Record<string, unknown> = { ...dto };
    if (!isAdmin) {
      ADMIN_PRODUCT_FIELDS.forEach((field) => delete payload[field]);
    }
    if (!isAdmin) {
      const existing = await this.productsService.findById(id);
      if (!existing) throw ApiException.notFound('Product not found');
      const seller = await this.sellerService.findByUserId(user.id);
      const ownerSellerId = seller
        ? (seller as { _id: { toString(): string } })._id.toString()
        : null;
      const p = existing as { sellerId?: { _id?: unknown; toString?(): string } | unknown };
      const sid = p.sellerId;
      const productSellerId =
        sid && typeof sid === 'object' && sid !== null && '_id' in sid
          ? String((sid as { _id: { toString(): string } })._id)
          : sid != null && typeof (sid as { toString?(): string }).toString === 'function'
            ? (sid as { toString(): string }).toString()
            : String(sid);
      if (!ownerSellerId || productSellerId !== ownerSellerId) {
        throw ApiException.forbidden('You can only update your own products.');
      }
    }
    const product = await this.productsService.updateById(id, payload as never);
    if (!product) throw ApiException.notFound('Product not found');
    return ApiResponseHelper.success({ product }, 'Product updated successfully');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: { id: string; role: string; roles?: string[] }) {
    const isAdmin = hasAdminGrant(user);
    if (!isAdmin) {
      const existing = await this.productsService.findById(id);
      if (!existing) throw ApiException.notFound('Product not found');
      const seller = await this.sellerService.findByUserId(user.id);
      const ownerSellerId = seller
        ? (seller as { _id: { toString(): string } })._id.toString()
        : null;
      const p = existing as { sellerId?: { _id?: unknown; toString?(): string } | unknown };
      const sid = p.sellerId;
      const productSellerId =
        sid && typeof sid === 'object' && sid !== null && '_id' in sid
          ? String((sid as { _id: { toString(): string } })._id)
          : sid != null && typeof (sid as { toString?(): string }).toString === 'function'
            ? (sid as { toString(): string }).toString()
            : String(sid);
      if (!ownerSellerId || productSellerId !== ownerSellerId) {
        throw ApiException.forbidden('You can only delete your own products.');
      }
    }
    await this.productsService.deleteById(id);
    return ApiResponseHelper.success(null, 'Product deleted successfully');
  }
}
