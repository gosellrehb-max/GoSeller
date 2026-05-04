import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ApiResponseHelper } from "../../common/helpers/api-response.helper";
import { WishlistService } from "./wishlist.service";

@Controller("wishlist")
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@CurrentUser() user: { id: string }) {
    const wishlist = await this.wishlistService.findByUserId(user.id);
    if (!wishlist) {
      const newWishlist = await this.wishlistService.findOrCreate(user.id);
      return ApiResponseHelper.success(
        { wishlist: newWishlist },
        "Wishlist retrieved successfully",
      );
    }
    return ApiResponseHelper.success(
      { wishlist },
      "Wishlist retrieved successfully",
    );
  }

  /**
   * POST /wishlist/sync
   * Body: { ids: string[] }
   * Batch-adds all guest wishlist IDs in a single round-trip instead of one POST per item.
   */
  @Post("sync")
  async syncItems(
    @CurrentUser() user: { id: string },
    @Body() body: { ids?: unknown },
  ) {
    const ids = (Array.isArray(body?.ids) ? body.ids : [])
      .map((v: unknown) => String(v).trim())
      .filter((s: string) => s.length > 0);
    const wishlist = await this.wishlistService.syncItems(user.id, ids);
    return ApiResponseHelper.success({ wishlist }, "Wishlist synced");
  }

  @Post("items/:productId")
  async addItem(
    @CurrentUser() user: { id: string },
    @Param("productId") productId: string,
  ) {
    const wishlist = await this.wishlistService.addItem(user.id, productId);
    return ApiResponseHelper.success({ wishlist }, "Item added to wishlist");
  }

  @Delete("items/:productId")
  async removeItem(
    @CurrentUser() user: { id: string },
    @Param("productId") productId: string,
  ) {
    const wishlist = await this.wishlistService.removeItem(user.id, productId);
    return ApiResponseHelper.success(
      { wishlist },
      "Item removed from wishlist",
    );
  }

  @Delete()
  async clearWishlist(@CurrentUser() user: { id: string }) {
    const wishlist = await this.wishlistService.clear(user.id);
    return ApiResponseHelper.success({ wishlist }, "Wishlist cleared");
  }
}
