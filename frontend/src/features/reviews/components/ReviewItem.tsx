'use client';

import React from 'react';
import { ReviewData } from '../types/reviews';
import { StarRating } from './StarRating';
import { CheckCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ReviewItemProps {
  review: ReviewData;
  onDelete?: (reviewId: string) => void;
  isDeleting?: boolean;
  canDelete?: boolean;
}

export function ReviewItem({
  review,
  onDelete,
  isDeleting = false,
  canDelete = false,
}: ReviewItemProps) {
  return (
    <div className="border-b border-gray-200 py-6 last:border-b-0">
      {/* Header: User info and rating */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900">
              {review.userId.firstName} {review.userId.lastName}
            </span>
            {review.isVerifiedPurchase && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-600/20">
                <CheckCircle className="w-3 h-3" />
                Verified Purchase
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
          </p>
        </div>

        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete?.(review._id)}
            disabled={isDeleting}
            className="text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
            aria-label="Delete review"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Rating */}
      <div className="mb-3">
        <StarRating value={review.rating} readonly showValue={false} />
      </div>

      {/* Comment */}
      <p className="text-sm text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">
        {review.comment}
      </p>

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mt-3 flex-wrap">
          {review.images.map((image, index) => (
            <div key={index} className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
