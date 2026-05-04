import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiException } from '../../common/exceptions/api.exception';
import { CmsCarousel, CmsCarouselDocument } from './schemas/carousel.schema';
import { CmsPromoBanner, CmsPromoBannerDocument } from './schemas/promo-banner.schema';

@Injectable()
export class CmsService {
  constructor(
    @InjectModel(CmsCarousel.name)
    private readonly cmsCarouselModel: Model<CmsCarouselDocument>,
    @InjectModel(CmsPromoBanner.name)
    private readonly cmsPromoBannerModel: Model<CmsPromoBannerDocument>,
  ) {}

  async getPublicCarousels() {
    return this.cmsCarouselModel
      .find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean()
      .exec();
  }

  async getAllCarouselsAdmin() {
    return this.cmsCarouselModel.find({}).sort({ order: 1, createdAt: 1 }).lean().exec();
  }

  async createCarousel(data: Partial<CmsCarousel>) {
    const doc = new this.cmsCarouselModel(data);
    return doc.save();
  }

  async updateCarousel(id: string, data: Partial<CmsCarousel>) {
    const updated = await this.cmsCarouselModel
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
    if (!updated) throw ApiException.notFound('Carousel item not found');
    return updated;
  }

  async deleteCarousel(id: string) {
    const deleted = await this.cmsCarouselModel.findByIdAndDelete(id).exec();
    if (!deleted) throw ApiException.notFound('Carousel item not found');
  }

  /* ── Promo Banners ──────────────────────────────────────────────────── */

  async getPublicPromoBanners() {
    return this.cmsPromoBannerModel
      .find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean()
      .exec();
  }

  async getAllPromoBannersAdmin() {
    return this.cmsPromoBannerModel
      .find({})
      .sort({ type: 1, sortOrder: 1, createdAt: 1 })
      .lean()
      .exec();
  }

  async upsertPromoBanner(slot: string, type: string, data: Partial<CmsPromoBanner>) {
    const doc = await this.cmsPromoBannerModel
      .findOneAndUpdate(
        { slot, type },
        { $set: { ...data, slot, type } },
        { new: true, upsert: true },
      )
      .exec();
    return doc;
  }

  async deletePromoBanner(id: string) {
    const deleted = await this.cmsPromoBannerModel.findByIdAndDelete(id).exec();
    if (!deleted) throw ApiException.notFound('Promo banner not found');
  }
}
