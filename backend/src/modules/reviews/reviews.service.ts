import { Injectable } from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { CreateReviewDto, GetReviewsQueryDto, UpdateReviewDto, ReviewEligibilityDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  /**
   * Verify user can review: must have a completed (non-cancelled) order for the product.
   * We check both the order-level status and per-item status so either path qualifies.
   */
  async verifyReviewEligibility(
    userId: string,
    productId: string,
  ): Promise<ReviewEligibilityDto> {
    const userObjId = new Types.ObjectId(userId);
    const productObjId = new Types.ObjectId(productId);

    // Check if user already reviewed this product
    const existingReview = await this.reviewModel.findOne({
      userId: userObjId,
      productId: productObjId,
      isActive: true,
    });
    const alreadyReviewed = !!existingReview;

    // Check if user has ever ordered this product (order not cancelled/refunded)
    const purchasedOrder = await this.orderModel.findOne({
      customer: userObjId,
      items: { $elemMatch: { product: productObjId } },
      status: { $nin: ['cancelled', 'refunded'] },
    });

    const hasOrdered = !!purchasedOrder;

    // Delivered = order-level delivered OR any matching item is delivered
    const deliveredOrder = hasOrdered
      ? await this.orderModel.findOne({
          customer: userObjId,
          $or: [
            {
              status: 'delivered',
              items: { $elemMatch: { product: productObjId } },
            },
            {
              items: {
                $elemMatch: { product: productObjId, status: 'delivered' },
              },
            },
          ],
        })
      : null;

    const orderDelivered = !!deliveredOrder;
    const canReview = hasOrdered && !alreadyReviewed;

    return {
      canReview,
      hasOrdered,
      orderDelivered,
      alreadyReviewed,
    };
  }

  /**
   * Create review with verification
   */
  async createReview(
    userId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewDocument> {
    const userObjId = new Types.ObjectId(userId);
    const productObjId = new Types.ObjectId(createReviewDto.productId);

    // Verify eligibility
    const eligibility = await this.verifyReviewEligibility(userId, createReviewDto.productId);

    if (!eligibility.canReview) {
      throw ApiException.forbidden('You are not eligible to review this product.');
    }

    // Verify product exists
    const product = await this.productModel.findById(productObjId);
    if (!product) {
      throw ApiException.notFound('Product not found');
    }

    // Check if there's a soft-deleted review to avoid duplicate key error
    const inactiveReview = await this.reviewModel.findOne({
      userId: userObjId,
      productId: productObjId,
      isActive: false,
    });
    if (inactiveReview) {
      await this.reviewModel.deleteOne({ _id: inactiveReview._id });
    }

    // Create review
    const review = new this.reviewModel({
      productId: productObjId,
      userId: userObjId,
      orderId: (await this.getOrderId(userObjId, productObjId)) || undefined,
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
      images: createReviewDto.images || [],
      isVerifiedPurchase: !!(await this.getOrderId(userObjId, productObjId)),
      isActive: true,
    });

    const savedReview = await review.save();

    // Update product rating
    await this.updateProductRating(productObjId);

    return savedReview;
  }

  /**
   * Get paginated reviews for a product
   */
  async getReviews(
    productId: string,
    query: GetReviewsQueryDto,
  ): Promise<{ reviews: ReviewDocument[]; total: number; page: number; limit: number; pages: number }> {
    const productObjId = new Types.ObjectId(productId);
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    // Build sort
    let sort: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sortBy === 'rating') {
      sort = { rating: -1, createdAt: -1 };
    }

    // Find reviews
    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find({ productId: productObjId, isActive: true })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('userId', 'firstName lastName email avatar')
        .exec(),
      this.reviewModel.countDocuments({ productId: productObjId, isActive: true }),
    ]);

    const pages = Math.ceil(total / limit);

    return {
      reviews,
      total,
      page,
      limit,
      pages,
    };
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId: string): Promise<ReviewDocument> {
    const review = await this.reviewModel
      .findById(reviewId)
      .populate('userId', 'firstName lastName email avatar')
      .populate('productId', 'title images')
      .exec();

    if (!review) {
      throw ApiException.notFound('Review not found');
    }

    return review;
  }

  /**
   * Update review
   */
  async updateReview(
    reviewId: string,
    userId: string,
    updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(reviewId);

    if (!review) {
      throw ApiException.notFound('Review not found');
    }

    // Verify ownership
    if (review.userId.toString() !== userId) {
      throw ApiException.forbidden('You can only edit your own reviews');
    }

    // Update fields
    if (updateReviewDto.rating !== undefined) {
      review.rating = updateReviewDto.rating;
    }
    if (updateReviewDto.comment !== undefined) {
      review.comment = updateReviewDto.comment;
    }
    if (updateReviewDto.images !== undefined) {
      review.images = updateReviewDto.images;
    }

    const updated = await review.save();

    // Recalculate product rating
    await this.updateProductRating(review.productId);

    return updated;
  }

  /**
   * Delete review (soft delete)
   */
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await this.reviewModel.findById(reviewId);

    if (!review) {
      throw ApiException.notFound('Review not found');
    }

    // Verify ownership or admin
    if (review.userId.toString() !== userId) {
      throw ApiException.forbidden('You can only delete your own reviews');
    }

    // Hard delete instead of soft delete to avoid unique index conflict
    await this.reviewModel.deleteOne({ _id: reviewId });

    // Recalculate product rating
    await this.updateProductRating(review.productId);
  }

  /**
   * Recalculate and update product rating
   */
  async updateProductRating(productId: Types.ObjectId | string): Promise<void> {
    const productObjId = typeof productId === 'string' ? new Types.ObjectId(productId) : productId;

    const stats = await this.reviewModel.aggregate([
      {
        $match: { productId: productObjId, isActive: true },
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const { averageRating = 0, reviewCount = 0 } = stats[0] || {};

    await this.productModel.findByIdAndUpdate(
      productObjId,
      {
        rating: {
          average: Math.round(averageRating * 100) / 100,
          count: reviewCount,
        },
      },
      { new: true },
    );
  }

  private async getOrderId(userId: Types.ObjectId, productId: Types.ObjectId): Promise<Types.ObjectId | null> {
    const order = await this.orderModel.findOne(
      {
        customer: userId,
        $or: [
          {
            status: 'delivered',
            items: { $elemMatch: { product: productId } },
          },
          {
            items: { $elemMatch: { product: productId, status: 'delivered' } },
          },
        ],
      },
      { _id: 1 },
    );

    return order?._id as Types.ObjectId | null;
  }

  /**
   * Get average rating and review count for a product
   */
  async getProductRatingStats(productId: string): Promise<{ average: number; count: number }> {
    const product = await this.productModel.findById(productId, 'rating');

    return {
      average: product?.rating?.average || 0,
      count: product?.rating?.count || 0,
    };
  }
}
