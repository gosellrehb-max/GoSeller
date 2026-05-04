'use client';

import React, { useState } from 'react';
import { ReviewItem } from './ReviewItem';
import { useProductReviews, useDeleteReview } from '../hooks/useReviews';
import { Loader2 } from 'lucide-react';

interface ReviewListProps {
  productId: string;
  currentUserId?: string;
}

export function ReviewList({ productId, currentUserId }: ReviewListProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<'latest' | 'rating'>('latest');
  const LIMIT = 10;

  const { data, isLoading, error } = useProductReviews(productId, page, LIMIT, sortBy, !!productId);
  const { mutate: deleteReview, isPending: isDeleting } = useDeleteReview();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        Failed to load reviews. Please try again.
      </div>
    );
  }

  if (!data || !data.reviews || data.reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No Customer reviews yet.</p>
      </div>
    );
  }

  const reviewsData = data!;

  return (
    <div className="space-y-6">
      {/* Sort Options */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <span className="text-sm text-gray-600">
          {reviewsData.total} {reviewsData.total === 1 ? 'review' : 'reviews'}
        </span>
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as 'latest' | 'rating');
            setPage(1);
          }}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="latest">Latest</option>
          <option value="rating">Highest Rating</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-0">
        {reviewsData.reviews.map((review) => (
          <ReviewItem
            key={review._id}
            review={review}
            onDelete={deleteReview}
            isDeleting={isDeleting}
            canDelete={currentUserId === (typeof review.userId === 'string' ? review.userId : review.userId?._id)}
          />
        ))}
      </div>

      {/* Pagination */}
      {reviewsData.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6 border-t border-gray-200">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: reviewsData.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                  page === p
                    ? 'bg-primary text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(reviewsData.pages, p + 1))}
            disabled={page === reviewsData.pages}
            className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
