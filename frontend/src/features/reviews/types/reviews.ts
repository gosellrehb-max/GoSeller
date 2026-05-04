export type Rating = 1 | 2 | 3 | 4 | 5;

export interface ReviewUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
}

export interface ReviewProduct {
  _id: string;
  title: string;
  images: string[];
}

export interface ReviewData {
  _id: string;
  productId: string;
  userId: ReviewUser;
  orderId: string;
  rating: Rating;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewsListData {
  reviews: ReviewData[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ReviewEligibilityData {
  canReview: boolean;
  hasOrdered: boolean;
  orderDelivered: boolean;
  alreadyReviewed: boolean;
}

export interface CreateReviewInput {
  productId: string;
  rating: Rating;
  comment: string;
  images?: string[];
}

export interface RatingStatsData {
  average: number;
  count: number;
}
