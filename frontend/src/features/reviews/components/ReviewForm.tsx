'use client';

import React, { useState } from 'react';
import { StarRating } from './StarRating';
import { useCreateReview } from '../hooks/useReviews';
import { Rating } from '../types/reviews';
import { Loader2, AlertCircle } from 'lucide-react';

interface ReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState<Rating>(5);
  const [comment, setComment] = useState('');
  const { mutate: createReview, isPending, error } = useCreateReview();

  const isValid = comment.length >= 10 && comment.length <= 2000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) return;

    createReview(
      {
        productId,
        rating,
        comment,
      },
      {
        onSuccess: () => {
          setRating(5);
          setComment('');
          onSuccess?.();
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-600/20">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error instanceof Error ? error.message : 'Failed to submit review'}
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Rating
        </label>
        <StarRating value={rating} onChange={(r) => setRating(r as Rating)} />
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-2">
          Your Review
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product (minimum 10 characters)"
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
        />
        <div className="mt-1 flex justify-between">
          <span className="text-xs text-gray-500">
            {comment.length} / 2000 characters
          </span>
          {comment.length < 10 && comment.length > 0 && (
            <span className="text-xs text-red-600">
              Minimum 10 characters required
            </span>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!isValid || isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}
