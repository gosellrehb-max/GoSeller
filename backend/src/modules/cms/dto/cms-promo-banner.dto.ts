import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";

export const PROMO_TYPES = ["flash_banner", "event_mosaic", "category_image"] as const;

const MOSAIC_POSITIONS = [
  "left",
  "centerTop",
  "centerBottomLeft",
  "centerBottomRight",
  "right",
] as const;

const MEDIA_SIDES = ["left", "right"] as const;

export class EventMosaicTileDto {
  @IsIn(MOSAIC_POSITIONS)
  position: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  eyebrow?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  imageUrl: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  ctaLabel?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  ctaHref?: string;
}

/**
 * Discriminated CMS promo upsert body: `type` selects which fields apply.
 * Runtime `$set` payload is narrowed in `promoBannerPartialFromUpsertDto` so cross-type keys never persist.
 */
export class UpsertPromoBannerDto {
  @IsIn(PROMO_TYPES)
  type: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  /* ── flash_banner (+ optional on wire for other types; stripped server-side) ── */

  @IsString()
  @IsOptional()
  @MaxLength(200)
  sectionTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(400)
  sectionSubtitle?: string;

  @IsIn(MEDIA_SIDES)
  @IsOptional()
  mediaSide?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  eyebrow?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  headline?: string;

  @IsString()
  @IsOptional()
  @MaxLength(400)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  ctaLabel?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  ctaHref?: string;

  @IsNumber()
  @IsOptional()
  priceNow?: number | null;

  @IsNumber()
  @IsOptional()
  priceWas?: number | null;

  /* ── event_mosaic only ── */

  @ValidateIf((o: UpsertPromoBannerDto) => o.type === "event_mosaic")
  @IsString()
  @IsOptional()
  @MaxLength(120)
  eventHeadline?: string;

  @ValidateIf((o: UpsertPromoBannerDto) => o.type === "event_mosaic")
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsDateString()
  startsAt?: string | null;

  @ValidateIf((o: UpsertPromoBannerDto) => o.type === "event_mosaic")
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsDateString()
  endsAt?: string | null;

  @ValidateIf((o: UpsertPromoBannerDto) => o.type === "event_mosaic" && o.tiles != null)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventMosaicTileDto)
  tiles?: EventMosaicTileDto[];
}
