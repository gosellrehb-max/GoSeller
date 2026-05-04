import { Injectable, PipeTransform } from '@nestjs/common';
import { ApiException } from '../../../common/exceptions/api.exception';

/** Validates `:slot` on `PUT cms/promo-banners/:slot` (matches Mongoose trim/maxlength rules). */
@Injectable()
export class PromoBannerSlotPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    const slot = decodeURIComponent(value ?? '').trim();
    if (!slot || slot.length > 100) {
      throw ApiException.badRequest('Promo slot is required (max 100 characters)');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(slot)) {
      throw ApiException.badRequest('Promo slot may only contain letters, digits, hyphen, and underscore');
    }
    return slot;
  }
}
