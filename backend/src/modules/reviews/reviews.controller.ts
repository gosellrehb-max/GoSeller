import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, GetReviewsQueryDto, UpdateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  /**
   * Create a new review
   * POST /reviews
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createReviewDto: CreateReviewDto, @Req() req: any) {
    const userId = req.user?.id;
    const review = await this.reviewsService.createReview(userId, createReviewDto);
    return ApiResponseHelper.created(
      { review },
      'Review created successfully',
    );
  }

  /**
   * Get all reviews for a product (paginated)
   * GET /reviews?productId=xxx&page=1&limit=10&sortBy=latest
   */
  @Get()
  async getReviews(@Query() query: GetReviewsQueryDto) {
    const data = await this.reviewsService.getReviews(query.productId, query);
    return ApiResponseHelper.success(data, 'Reviews retrieved successfully');
  }

  /**
   * Check if current user can review a product
   * GET /reviews/eligibility/:productId
   */
  @UseGuards(JwtAuthGuard)
  @Get('eligibility/:productId')
  async checkEligibility(@Param('productId') productId: string, @Req() req: any) {
    const userId = req.user?.id;
    const eligibility = await this.reviewsService.verifyReviewEligibility(
      userId,
      productId,
    );
    return ApiResponseHelper.success(
      { eligibility },
      'Eligibility checked successfully',
    );
  }

  /**
   * Get product rating statistics
   * GET /reviews/stats/:productId
   * MUST be declared before GET /reviews/:id to avoid :id swallowing "stats"
   */
  @Get('stats/:productId')
  async getStats(@Param('productId') productId: string) {
    const stats = await this.reviewsService.getProductRatingStats(productId);
    return ApiResponseHelper.success(stats, 'Rating statistics retrieved successfully');
  }

  /**
   * Get a single review by ID
   * GET /reviews/:id
   */
  @Get(':id')
  async getReviewById(@Param('id') id: string) {
    const review = await this.reviewsService.getReviewById(id);
    return ApiResponseHelper.success({ review }, 'Review retrieved successfully');
  }

  /**
   * Update a review
   * PUT /reviews/:id
   */
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const review = await this.reviewsService.updateReview(id, userId, updateReviewDto);
    return ApiResponseHelper.success(
      { review },
      'Review updated successfully',
    );
  }

  /**
   * Delete a review
   * DELETE /reviews/:id
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    await this.reviewsService.deleteReview(id, userId);
    return;
  }
}
