'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useReviewEligibility, useProductRatingStats } from '@/features/reviews/hooks/useReviews';
import { ReviewForm } from '@/features/reviews/components/ReviewForm';
import { ReviewList } from '@/features/reviews/components/ReviewList';
import { StarRating } from '@/features/reviews/components/StarRating';
import { AlertCircle, LogIn } from 'lucide-react';
import Link from 'next/link';

interface Props {
  productId: string;
}

export function ProductReviews({ productId }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const { data: eligibility, isLoading: eligibilityLoading } = useReviewEligibility(
    productId,
    isAuthenticated,
  );
  const { data: stats, isLoading: statsLoading } = useProductRatingStats(productId);

  if (!isAuthenticated) {
    return (
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <LogIn className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-medium text-blue-900">Sign in to review</h3>
        </div>
        <p className="text-sm text-blue-700 mb-4">
          You need to be logged in to view and write reviews.
        </p>
        <Link
          href="/login/customer"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      {statsLoading ? (
        <div className="rounded-lg bg-gray-50 p-6 border border-gray-200">
          <div className="flex items-center justify-center py-4">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-primary" />
          </div>
        </div>
      ) : stats ? (
        <div className="rounded-lg bg-gray-50 p-6 border border-gray-200">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {(stats.average ?? 0).toFixed(1)}
              </div>
              <div className="mb-2">
                <StarRating value={Math.round(stats.average ?? 0)} readonly showValue={false} />
              </div>
              <p className="text-sm text-gray-500">
                Based on {stats.count ?? 0} {(stats.count ?? 0) === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-gray-50 p-6 border border-gray-200">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-1">0.0</div>
              <div className="mb-2">
                <StarRating value={0} readonly showValue={false} />
              </div>
              <p className="text-sm text-gray-500">No reviews yet</p>
            </div>
          </div>
        </div>
      )}

      {/* Review Form */}
      {eligibilityLoading ? (
        <div className="text-center py-8">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-primary" />
        </div>
      ) : eligibility?.canReview ? (
        <div className="rounded-lg border border-gray-200 p-6 bg-white">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Share Your Experience</h3>
          <p className="text-sm text-gray-600 mb-6">Help other customers make informed decisions</p>
          <ReviewForm productId={productId} onSuccess={() => setReviewSubmitted(true)} />
          {reviewSubmitted && (
            <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Thank you! Your review has been submitted and is now visible to other customers.
            </div>
          )}
        </div>
      ) : null}

      {/* Reviews List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Customer Reviews
        </h3>
        <ReviewList productId={productId} currentUserId={user?.id} />
      </div>
    </div>
  );
}
