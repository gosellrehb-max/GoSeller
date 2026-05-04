'use client';

import React from 'react';
import { FaRegStar, FaStar, FaStarHalfAlt } from 'react-icons/fa';

type ProductStarRatingProps = {
  /** 0–5; supports half stars (e.g. 4.5) */
  value: number;
  /** Optional label e.g. review count */
  sublabel?: string;
  className?: string;
  starClassName?: string;
};

/**
 * Filled / half / empty stars for product pages (marketplace-style).
 */
export function ProductStarRating({
  value,
  sublabel,
  className = '',
  starClassName = 'h-5 w-5',
}: ProductStarRatingProps) {
  const safe = Math.min(5, Math.max(0, value));
  const cells: React.ReactNode[] = [];
  for (let i = 1; i <= 5; i++) {
    if (safe >= i) {
      cells.push(
        <FaStar key={i} className={`${starClassName} text-amber-400`} aria-hidden />,
      );
    } else if (safe >= i - 0.5) {
      cells.push(
        <FaStarHalfAlt key={i} className={`${starClassName} text-amber-400`} aria-hidden />,
      );
    } else {
      cells.push(
        <FaRegStar key={i} className={`${starClassName} text-gray-300`} aria-hidden />,
      );
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="flex items-center gap-0.5" role="img" aria-label={`${safe} out of 5 stars`}>
        {cells}
      </span>
      <span className="font-medium text-gray-700 tabular-nums">({safe.toFixed(1)})</span>
      {sublabel ? (
        <>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600 underline underline-offset-2 group-hover:text-primary">{sublabel}</span>
        </>
      ) : null}
    </div>
  );
}
