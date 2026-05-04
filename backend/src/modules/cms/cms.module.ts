import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { PromoBannerSlotPipe } from './pipes/promo-banner-slot.pipe';
import { CmsCarousel, CmsCarouselSchema } from './schemas/carousel.schema';
import { CmsPromoBanner, CmsPromoBannerSchema } from './schemas/promo-banner.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CmsCarousel.name, schema: CmsCarouselSchema },
      { name: CmsPromoBanner.name, schema: CmsPromoBannerSchema },
    ]),
  ],
  controllers: [CmsController],
  providers: [CmsService, PromoBannerSlotPipe],
  exports: [CmsService],
})
export class CmsModule {}
