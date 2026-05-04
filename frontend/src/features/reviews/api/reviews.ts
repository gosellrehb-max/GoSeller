import { api } from '@/services/api';
import { Rating } from '../types/reviews';

export interface Review {
  _id: string;
  productId: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  orderId: string;
  rating: Rating;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewPayload {
  productId: string;
  rating: Rating;
  comment: string;
  images?: string[];
}

export interface GetReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ReviewEligibility {
  canReview: boolean;
  hasOrdered: boolean;
  orderDelivered: boolean;
  alreadyReviewed: boolean;
}

export interface RatingStats {
  average: number;
  count: number;
}

/**
 * Create a new review for a product
 */
export async function createReview(payload: CreateReviewPayload): Promise<Review> {
  const response = await api.post('/reviews', payload);
  return response.data?.data?.review || response.data?.review;
}

/**
 * Get all reviews for a product (with pagination)
 */
export async function getReviews(
  productId: string,
  page: number = 1,
  limit: number = 10,
  sortBy: 'latest' | 'rating' = 'latest',
): Promise<GetReviewsResponse> {
  const response = await api.get('/reviews', {
    params: { productId, page, limit, sortBy },
  });
  return response.data?.data || response.data;
}

/**
 * Check if current user can review a product
 */
export async function getReviewEligibility(productId: string): Promise<ReviewEligibility> {
  const response = await api.get(`/reviews/eligibility/${productId}`);
  return response.data?.data?.eligibility || response.data?.eligibility;
}

/**
 * Get a single review by ID
 */
export async function getReviewById(reviewId: string): Promise<Review> {
  const response = await api.get(`/reviews/${reviewId}`);
  return response.data?.data?.review || response.data?.review;
}

/**
 * Update a review
 */
export async function updateReview(
  reviewId: string,
  payload: Partial<CreateReviewPayload>,
): Promise<Review> {
  const response = await api.put(`/reviews/${reviewId}`, payload);
  return response.data?.data?.review || response.data?.review;
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string): Promise<void> {
  await api.delete(`/reviews/${reviewId}`);
}

/**
 * Get product rating statistics
 */
export async function getProductRatingStats(productId: string): Promise<RatingStats> {
  const response = await api.get(`/reviews/stats/${productId}`);
  return response.data?.data || response.data;
}
