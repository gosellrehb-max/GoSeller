import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CmsService } from './cms.service';
import { CreateCmsCarouselDto, UpdateCmsCarouselDto } from './dto/cms-carousel.dto';
import { UpsertPromoBannerDto } from './dto/cms-promo-banner.dto';
import { assertPromoSlotMatchesType, promoBannerPartialFromUpsertDto } from './cms-promo-banner.mapper';
import { PromoBannerSlotPipe } from './pipes/promo-banner-slot.pipe';

@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get('carousels')
  async getCarousels() {
    const carousels = await this.cmsService.getPublicCarousels();
    return ApiResponseHelper.success({ carousels }, 'CMS carousels retrieved successfully');
  }

  @Get('carousels/admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  async getCarouselsAdmin() {
    const carousels = await this.cmsService.getAllCarouselsAdmin();
    return ApiResponseHelper.success({ carousels }, 'CMS carousels retrieved successfully');
  }

  @Post('carousels')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  async createCarousel(
    @Body()
    body: {
      title: string;
      imageUrl: string;
      link: string;
      isActive?: boolean;
      order?: number;
    },
  ) {
    const carousel = await this.cmsService.createCarousel(body);
    return ApiResponseHelper.created({ carousel }, 'CMS carousel created successfully');
  }

  @Put('carousels/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  async updateCarousel(
    @Param('id') id: string,
    @Body() body: UpdateCmsCarouselDto,
  ) {
    const carousel = await this.cmsService.updateCarousel(id, body);
    return ApiResponseHelper.success({ carousel }, 'CMS carousel updated successfully');
  }

  @Delete('carousels/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  async deleteCarousel(@Param('id') id: string) {
    await this.cmsService.deleteCarousel(id);
    return ApiResponseHelper.success(null, 'CMS carousel deleted successfully');
  }

  /* ── Promo Banners ──────────────────────────────────────────────────── */

  @Get('promo-banners')
  async getPromoBanners() {
    const banners = await this.cmsService.getPublicPromoBanners();
    return ApiResponseHelper.success({ banners }, 'Promo banners retrieved');
  }

  @Get('promo-banners/admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  async getPromoBannersAdmin() {
    const banners = await this.cmsService.getAllPromoBannersAdmin();
    return ApiResponseHelper.success({ banners }, 'Promo banners retrieved');
  }

  @Put('promo-banners/:slot')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  async upsertPromoBanner(
    @Param('slot', PromoBannerSlotPipe) slot: string,
    @Body() body: UpsertPromoBannerDto,
  ) {
    assertPromoSlotMatchesType(slot, body.type);
    const payload = promoBannerPartialFromUpsertDto(body);
    const banner = await this.cmsService.upsertPromoBanner(slot, body.type, payload);
    return ApiResponseHelper.success({ banner }, 'Promo banner saved');
  }

  @Delete('promo-banners/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  async deletePromoBanner(@Param('id') id: string) {
    await this.cmsService.deletePromoBanner(id);
    return ApiResponseHelper.success(null, 'Promo banner deleted');
  }
}
