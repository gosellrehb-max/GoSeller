import { IsNumber, IsString, IsArray, IsMongoId, Min, Max, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class CreateReviewDto {
  @IsMongoId()
  productId!: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @MinLength(10, { message: 'Comment must be at least 10 characters long' })
  @MaxLength(2000, { message: 'Comment must not exceed 2000 characters' })
  comment!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class GetReviewsQueryDto {
  @IsMongoId()
  productId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: 'latest' | 'rating' = 'latest';
}

export class UpdateReviewDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  comment?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}

export class ReviewEligibilityDto {
  canReview!: boolean;
  hasOrdered!: boolean;
  orderDelivered!: boolean;
  alreadyReviewed!: boolean;
}
