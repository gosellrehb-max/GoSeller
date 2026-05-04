import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Wishlist, WishlistDocument } from "./schemas/wishlist.schema";

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>,
  ) {}

  async findOrCreate(userId: string): Promise<WishlistDocument> {
    let wishlist = await this.wishlistModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!wishlist) {
      wishlist = new this.wishlistModel({
        userId: new Types.ObjectId(userId),
        items: [],
      });
      await wishlist.save();
    }
    return wishlist;
  }

  async findByUserId(userId: string): Promise<WishlistDocument | null> {
    return this.wishlistModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate("items.product")
      .exec();
  }

  async addItem(userId: string, productId: string): Promise<WishlistDocument> {
    const wishlist = await this.findOrCreate(userId);
    const items = wishlist.items || [];
    const existing = items.find((item) => {
      const row = item as { product: Types.ObjectId };
      return row.product.toString() === productId;
    });
    if (!existing) {
      items.unshift({
        product: new Types.ObjectId(productId),
        addedAt: new Date(),
      } as never);
      wishlist.items = items;
      await wishlist.save();
    }
    return this.findByUserId(userId) as Promise<WishlistDocument>;
  }

  async removeItem(
    userId: string,
    productId: string,
  ): Promise<WishlistDocument> {
    const wishlist = await this.findOrCreate(userId);
    wishlist.items = (wishlist.items || []).filter((item) => {
      const row = item as { product: Types.ObjectId };
      return row.product.toString() !== productId;
    });
    await wishlist.save();
    return this.findByUserId(userId) as Promise<WishlistDocument>;
  }

  async clear(userId: string): Promise<WishlistDocument> {
    const wishlist = await this.findOrCreate(userId);
    wishlist.items = [];
    await wishlist.save();
    return this.findByUserId(userId) as Promise<WishlistDocument>;
  }

  /**
   * Batch-add multiple product IDs in a single DB write.
   * Used by the guest→server wishlist sync so N POST calls collapse to 1.
   * Invalid ObjectIds and already-present items are silently skipped.
   */
  async syncItems(userId: string, productIds: string[]): Promise<WishlistDocument> {
    if (!productIds.length) return this.findOrCreate(userId);

    const wishlist = await this.findOrCreate(userId);
    const existing = new Set(
      (wishlist.items || []).map((item) => {
        const row = item as { product: Types.ObjectId };
        return row.product.toString();
      }),
    );

    let changed = false;
    for (const rawId of productIds) {
      const id = String(rawId).trim();
      if (!Types.ObjectId.isValid(id) || existing.has(id)) continue;
      wishlist.items.unshift({ product: new Types.ObjectId(id), addedAt: new Date() } as never);
      existing.add(id);
      changed = true;
    }

    if (changed) await wishlist.save();
    return this.findByUserId(userId) as Promise<WishlistDocument>;
  }
}
