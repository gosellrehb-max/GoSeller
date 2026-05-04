'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createReview,
  getReviews,
  getReviewEligibility,
  deleteReview,
  updateReview,
  getProductRatingStats,
} from '../api/reviews';
import {
  ReviewsListData,
  ReviewEligibilityData,
  CreateReviewInput,
  RatingStatsData,
} from '../types/reviews';

const REVIEWS_QUERY_KEYS = {
  all: ['reviews'] as const,
  byProduct: (productId: string) => [...REVIEWS_QUERY_KEYS.all, 'byProduct', productId] as const,
  list: (productId: string, page: number, limit: number, sortBy: string) =>
    [...REVIEWS_QUERY_KEYS.byProduct(productId), 'list', page, limit, sortBy] as const,
  eligibility: (productId: string) => [...REVIEWS_QUERY_KEYS.all, 'eligibility', productId] as const,
  stats: (productId: string) => [...REVIEWS_QUERY_KEYS.all, 'stats', productId] as const,
};

/**
 * Fetch reviews for a product with pagination
 */
export function useProductReviews(
  productId: string,
  page: number = 1,
  limit: number = 10,
  sortBy: 'latest' | 'rating' = 'latest',
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: REVIEWS_QUERY_KEYS.list(productId, page, limit, sortBy),
    queryFn: () => getReviews(productId, page, limit, sortBy),
    enabled: enabled && !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create a new review mutation
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReviewInput) => createReview(payload),
    onSuccess: (data, payload) => {
      // Invalidate reviews list for this product
      queryClient.invalidateQueries({
        queryKey: REVIEWS_QUERY_KEYS.byProduct(payload.productId),
      });

      // Invalidate rating stats
      queryClient.invalidateQueries({
        queryKey: REVIEWS_QUERY_KEYS.stats(payload.productId),
      });

      // Invalidate eligibility
      queryClient.invalidateQueries({
        queryKey: REVIEWS_QUERY_KEYS.eligibility(payload.productId),
      });
    },
  });
}

/**
 * Check if user can review a product
 */
export function useReviewEligibility(productId: string, enabled: boolean = true) {
  return useQuery<ReviewEligibilityData>({
    queryKey: REVIEWS_QUERY_KEYS.eligibility(productId),
    queryFn: () => getReviewEligibility(productId),
    enabled: enabled && !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Delete a review mutation
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => deleteReview(reviewId),
    onSuccess: (_, reviewId) => {
      // Invalidate all reviews queries
      queryClient.invalidateQueries({
        queryKey: REVIEWS_QUERY_KEYS.all,
      });
    },
  });
}

/**
 * Update a review mutation
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId: string; payload: Partial<CreateReviewInput> }) =>
      updateReview(reviewId, payload),
    onSuccess: (_, { payload }) => {
      if (payload.productId) {
        // Invalidate reviews list for this product
        queryClient.invalidateQueries({
          queryKey: REVIEWS_QUERY_KEYS.byProduct(payload.productId),
        });
      }
    },
  });
}

/**
 * Get product rating statistics
 */
export function useProductRatingStats(productId: string, enabled: boolean = true) {
  return useQuery<RatingStatsData>({
    queryKey: REVIEWS_QUERY_KEYS.stats(productId),
    queryFn: () => getProductRatingStats(productId),
    enabled: enabled && !!productId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
