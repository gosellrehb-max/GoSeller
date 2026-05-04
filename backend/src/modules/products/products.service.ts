import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Product, ProductDocument } from "./schemas/product.schema";
import { ProductMetric, ProductMetricDocument } from "./schemas/product-metric.schema";
import { Order, OrderDocument } from "../orders/schemas/order.schema";
import { Cart, CartDocument } from "../cart/schemas/cart.schema";
import { Wishlist, WishlistDocument } from "../wishlist/schemas/wishlist.schema";
import { SellerService } from "../seller/seller.service";
import { ApiException } from "../../common/exceptions/api.exception";
import { ProductsSearchCacheService } from "./products-search-cache.service";

@Injectable()
export class ProductsService {
  private trendingRefreshPromise: Promise<void> | null = null;

  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(ProductMetric.name)
    private productMetricModel: Model<ProductMetricDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>,
    @Inject(forwardRef(() => SellerService))
    private sellerService: SellerService,
    private configService: ConfigService,
    private productsSearchCache: ProductsSearchCacheService,
  ) {}

  private readonly searchCachePrefix = "products:findAll:";

  private normalizeForCacheKey(value: unknown): unknown {
    if (Array.isArray(value))
      return value.map((v) => this.normalizeForCacheKey(v));
    if (value instanceof Types.ObjectId) return value.toString();
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      return Object.keys(obj)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
          acc[key] = this.normalizeForCacheKey(obj[key]);
          return acc;
        }, {});
    }
    return value;
  }

  private buildFindAllCacheKey(
    query: Record<string, unknown>,
    page: number,
    limit: number,
    options?: {
      sortBy?: string;
      sortOrder?: string;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
    },
  ): string {
    const payload = {
      query: this.normalizeForCacheKey(query),
      page,
      limit,
      options: this.normalizeForCacheKey(options ?? {}),
    };
    return `${this.searchCachePrefix}${JSON.stringify(payload)}`;
  }

  private async invalidateProductSearchCache() {
    await this.productsSearchCache.invalidateByPrefix(this.searchCachePrefix);
  }

  private toSlug(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  private async generateUniqueSlug(
    title: string,
    preferred?: string,
  ): Promise<string> {
    const base =
      this.toSlug(preferred?.trim() || title) || `product-${Date.now()}`;
    let slug = base;
    let suffix = 1;
    while (await this.productModel.exists({ slug })) {
      suffix += 1;
      slug = `${base}-${suffix}`;
    }
    return slug;
  }

  async create(data: Partial<Product>): Promise<ProductDocument> {
    const title = String((data as { title?: string }).title ?? "").trim();
    if (!title) {
      throw ApiException.badRequest("Product title is required");
    }
    const slug = await this.generateUniqueSlug(
      title,
      (data as { slug?: string }).slug,
    );
    const disableApproval = this.configService.get<boolean>(
      "products.disableAdminApproval",
    );
    const images = Array.isArray(data.images) ? data.images.slice(0, 5) : [];
    const merged: Record<string, unknown> = { ...data, slug, images };
    if (disableApproval) {
      merged.status = "approved";
    }
    const product = new this.productModel(merged);
    const saved = await product.save();
    await this.invalidateProductSearchCache();
    return saved;
  }

  async findAll(
    query: Record<string, unknown> = {},
    page = 1,
    limit = 20,
    options?: {
      sortBy?: string;
      sortOrder?: string;
      search?: string;
      minPrice?: number;
      maxPrice?: number;
    },
  ) {
    const q = { ...query };
    const search = options?.search?.trim();
    if (search) {
      (q as Record<string, unknown>).$text = { $search: search };
    }
    const minPrice = Number.isFinite(options?.minPrice)
      ? Number(options?.minPrice)
      : undefined;
    const maxPrice = Number.isFinite(options?.maxPrice)
      ? Number(options?.maxPrice)
      : undefined;
    if (minPrice != null || maxPrice != null) {
      const priceFilter: Record<string, number> = {};
      if (minPrice != null) priceFilter.$gte = minPrice;
      if (maxPrice != null) priceFilter.$lte = maxPrice;
      (q as Record<string, unknown>).price = priceFilter;
    }
    const sortKey =
      options?.sortBy === "trendingScore"
        ? "trendingScore"
        : options?.sortBy === "featuredPriority"
          ? "featuredPriority"
          : options?.sortBy === "views"
            ? "views"
            : options?.sortBy === "price"
              ? "price"
              : "createdAt";
    const sortDir = options?.sortOrder === "asc" ? 1 : -1;
    const sort: Record<string, 1 | -1 | { $meta: "textScore" }> = search
      ? { score: { $meta: "textScore" }, [sortKey]: sortDir }
      : { [sortKey]: sortDir };
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
    const cacheKey = this.buildFindAllCacheKey(q, safePage, safeLimit, options);
    const cached = await this.productsSearchCache.get<{
      products: unknown[];
      total: number;
      page: number;
      limit: number;
      pages: number;
    }>(cacheKey);
    if (cached) {
      return cached;
    }
    const findQuery = this.productModel
      .find(q)
      .populate("sellerId", "businessName type")
      .sort(sort)
      .limit(safeLimit)
      .skip((safePage - 1) * safeLimit);
    if (search) {
      findQuery.select({ score: { $meta: "textScore" } });
    }
    const [products, total] = await Promise.all([
      findQuery.lean().exec(),
      this.productModel.countDocuments(q).exec(),
    ]);
    const result = {
      products,
      total,
      page: safePage,
      limit: safeLimit,
      pages: Math.ceil(total / safeLimit),
    };
    await this.productsSearchCache.set(cacheKey, result);
    return result;
  }

  /**
   * Batch-fetches all four home-page shelves in a single service call.
   * Four Mongoose queries run in parallel — one network round-trip from the browser.
   * The discount shelf uses server-side filtering so we only transfer ~16 items
   * instead of the previous 48-item over-fetch that was then filtered client-side.
   */
  async getHomeShelves(): Promise<{
    featured: unknown[];
    discounts: unknown[];
    trending: unknown[];
    newArrivals: unknown[];
  }> {
    await this.refreshTrendingScoresIfStale();

    const base: Record<string, unknown> = { status: 'approved', isActive: true };
    const createdDesc = { sortBy: 'createdAt', sortOrder: 'desc' } as const;
    const now = new Date();

    // Mirrors productHasDiscount() on the frontend — server-side.
    // originalPrice can be either a compare-price (> price) or a discount % (1–100).
    const discountQuery: Record<string, unknown> = {
      ...base,
      $or: [
        { discountPercent: { $gt: 0 } },
        { discount: { $gt: 0 } },
        { $expr: { $gt: ['$originalPrice', '$price'] } },
        { originalPrice: { $gt: 0, $lte: 100 } },
      ],
    };

    const [featured, discounts, trending, newArrivals] = await Promise.all([
      this.findAll(
        {
          ...base,
          isFeatured: true,
          $or: [{ featuredUntil: { $exists: false } }, { featuredUntil: null }, { featuredUntil: { $gte: now } }],
        },
        1,
        16,
        { sortBy: 'featuredPriority', sortOrder: 'desc' },
      ),
      this.findAll(discountQuery,               1, 16, createdDesc),
      this.findAll(base,                        1, 16, { sortBy: 'trendingScore', sortOrder: 'desc' }),
      this.findAll(base,                        1, 16, createdDesc),
    ]);

    return {
      featured:   featured.products,
      discounts:  discounts.products,
      trending:   trending.products,
      newArrivals: newArrivals.products,
    };
  }

  private rowsToCountMap(rows: Array<{ _id: Types.ObjectId; count: number }>): Map<string, number> {
    return new Map(rows.map((row) => [String(row._id), Number(row.count) || 0]));
  }

  private async countOrdersLast24h(since: Date): Promise<Map<string, number>> {
    const rows = await this.orderModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      {
        $match: {
          createdAt: { $gte: since },
          status: { $nin: ['cancelled', 'refunded', 'partially_refunded'] },
        },
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          count: { $sum: { $ifNull: ['$items.quantity', 1] } },
        },
      },
    ]).exec();
    return this.rowsToCountMap(rows);
  }

  private async countViewsLast24h(since: Date): Promise<Map<string, number>> {
    const rows = await this.productMetricModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $match: { type: 'view', createdAt: { $gte: since } } },
      { $group: { _id: '$product', count: { $sum: 1 } } },
    ]).exec();
    return this.rowsToCountMap(rows);
  }

  private async countCartAddsLast24h(since: Date): Promise<Map<string, number>> {
    const rows = await this.cartModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $unwind: '$items' },
      { $match: { 'items.addedAt': { $gte: since } } },
      {
        $group: {
          _id: '$items.product',
          count: { $sum: { $ifNull: ['$items.quantity', 1] } },
        },
      },
    ]).exec();
    return this.rowsToCountMap(rows);
  }

  private async countWishlistsLast24h(since: Date): Promise<Map<string, number>> {
    const rows = await this.wishlistModel.aggregate<{ _id: Types.ObjectId; count: number }>([
      { $unwind: '$items' },
      { $match: { 'items.addedAt': { $gte: since } } },
      { $group: { _id: '$items.product', count: { $sum: 1 } } },
    ]).exec();
    return this.rowsToCountMap(rows);
  }

  private async refreshTrendingScores(): Promise<void> {
    const now = new Date();
    const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const [orders, views, cartAdds, wishlists] = await Promise.all([
      this.countOrdersLast24h(since),
      this.countViewsLast24h(since),
      this.countCartAddsLast24h(since),
      this.countWishlistsLast24h(since),
    ]);

    const productIds = new Set<string>([
      ...orders.keys(),
      ...views.keys(),
      ...cartAdds.keys(),
      ...wishlists.keys(),
    ]);

    const operations = Array.from(productIds).map((id) => {
      const ordersLast24h = orders.get(id) ?? 0;
      const viewsLast24h = views.get(id) ?? 0;
      const cartAddsLast24h = cartAdds.get(id) ?? 0;
      const wishlistLast24h = wishlists.get(id) ?? 0;
      const trendingScore =
        ordersLast24h * 5 +
        viewsLast24h +
        cartAddsLast24h * 3 +
        wishlistLast24h * 2;

      return {
        updateOne: {
          filter: { _id: new Types.ObjectId(id), status: 'approved', isActive: true },
          update: {
            $set: {
              trendingScore,
              trendingUpdatedAt: now,
              ordersLast24h,
              viewsLast24h,
              cartAddsLast24h,
              wishlistLast24h,
            },
          },
        },
      };
    });

    if (operations.length > 0) {
      await this.productModel.bulkWrite(operations);
    }

    await this.productModel.updateMany(
      {
        status: 'approved',
        isActive: true,
        ...(productIds.size > 0
          ? { _id: { $nin: Array.from(productIds).map((id) => new Types.ObjectId(id)) } }
          : {}),
      },
      {
        $set: {
          trendingScore: 0,
          trendingUpdatedAt: now,
          ordersLast24h: 0,
          viewsLast24h: 0,
          cartAddsLast24h: 0,
          wishlistLast24h: 0,
        },
      },
    ).exec();

    await this.invalidateProductSearchCache();
  }

  async refreshTrendingScoresIfStale(): Promise<void> {
    const staleBefore = new Date(Date.now() - 60 * 60 * 1000);
    const stale = await this.productModel.exists({
      status: 'approved',
      isActive: true,
      $or: [
        { trendingUpdatedAt: { $exists: false } },
        { trendingUpdatedAt: null },
        { trendingUpdatedAt: { $lt: staleBefore } },
      ],
    });

    if (!stale) return;
    if (!this.trendingRefreshPromise) {
      this.trendingRefreshPromise = this.refreshTrendingScores().finally(() => {
        this.trendingRefreshPromise = null;
      });
    }
    await this.trendingRefreshPromise;
  }

  async findById(id: string): Promise<ProductDocument | null> {
    return this.productModel.findById(id).populate("sellerId").lean().exec();
  }

  /** Atomically increment the view counter for a public, active product. Never throws. */
  async incrementViews(id: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) return false;
      const result = await this.productModel
        .updateOne(
          { _id: id, status: "approved", isActive: true },
          { $inc: { views: 1 } },
        )
        .exec();
      const counted = result.modifiedCount > 0;
      if (counted) {
        await this.productMetricModel.create({
          product: new Types.ObjectId(id),
          type: 'view',
        });
      }
      return counted;
    } catch {
      // Non-critical — do not surface view-count errors to callers
      return false;
    }
  }

  async isSkuAvailable(rawSku: string): Promise<boolean> {
    const sku = String(rawSku ?? "").trim();
    if (!sku) return true;
    const exists = await this.productModel.exists({ sku });
    return !exists;
  }

  async updateById(
    id: string,
    data: Partial<Product>,
  ): Promise<ProductDocument | null> {
    const update: Partial<Product> & { slug?: string } = { ...data };
    if (
      data.title !== undefined ||
      (data as { slug?: string }).slug !== undefined
    ) {
      const current = await this.productModel
        .findById(id)
        .select("title")
        .lean()
        .exec();
      if (!current) throw ApiException.notFound("Product not found");
      const titleForSlug = String(
        data.title ?? (current as { title?: string }).title ?? "",
      ).trim();
      update.slug = await this.generateUniqueSlug(
        titleForSlug,
        (data as { slug?: string }).slug,
      );
    }
    if (Array.isArray(data.images)) {
      update.images = data.images.slice(0, 5);
    }
    const updated = await this.productModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .exec();
    await this.invalidateProductSearchCache();
    return updated;
  }

  async deleteById(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) throw ApiException.notFound("Product not found");
    await this.invalidateProductSearchCache();
  }

  /**
   * Atomically reduce stock when an order is placed (prevents oversell under concurrency).
   * Also increments `sales` by the same amount.
   */
  async decrementStockIfAvailable(
    productId: string,
    quantity: number,
  ): Promise<boolean> {
    const q = Math.floor(Number(quantity));
    if (!Types.ObjectId.isValid(productId) || !Number.isFinite(q) || q < 1) {
      return false;
    }
    const updated = await this.productModel
      .findOneAndUpdate(
        { _id: productId, stock: { $gte: q } },
        { $inc: { stock: -q, sales: q } },
        { new: true },
      )
      .exec();
    return !!updated;
  }

  /** Restore stock after a failed order save (rollback). Adjusts sales back. */
  async incrementStock(productId: string, quantity: number): Promise<void> {
    const q = Math.floor(Number(quantity));
    if (!Types.ObjectId.isValid(productId) || !Number.isFinite(q) || q < 1) {
      return;
    }
    await this.productModel
      .updateOne(
        { _id: productId },
        {
          $inc: { stock: q, sales: -q },
        },
      )
      .exec();
  }

  async findSellerProducts(
    sellerId: string,
    page = 1,
    limit = 20,
    filters: { status?: string; category?: string; search?: string } = {},
  ) {
    const query: Record<string, unknown> = { sellerId };
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { description: { $regex: filters.search, $options: "i" } },
      ];
    }
    return this.findAll(query, page, limit);
  }
}
