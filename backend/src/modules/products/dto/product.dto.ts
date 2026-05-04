import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsIn,
  Min,
  MaxLength,
  ValidateNested,
  ArrayMinSize,
  ValidateIf,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

const PRODUCT_CATEGORIES = [
  'Grocery', 'Electronics', 'Fashion', 'Home', 'Beauty',
  'Sports', 'Books', 'Automotive', 'Health', 'Other',
] as const;

export class SpecificationDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() value: string;
}

export class VariantDto {
  @IsString() @IsNotEmpty() name: string;
  @IsArray() @IsString({ each: true }) options: string[];
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  detailedTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  shortDescription?: string;

  @IsIn(PRODUCT_CATEGORIES)
  category: string;

  @IsString()
  @IsOptional()
  subcategory?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  images: string[];

  @IsNumber()
  @Min(0)
  stock: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecificationDto)
  @IsOptional()
  specifications?: SpecificationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  @IsOptional()
  variants?: VariantDto[];

  /** Rider pickup address for this product. */
  @IsString()
  @IsOptional()
  orderPickupLocation?: string;

  /** JSON-encoded tiered pricing config (Company sellers). */
  @IsString()
  @IsOptional()
  tieredPricing?: string;

  /** JSON-encoded inventory metadata (Company sellers). */
  @IsString()
  @IsOptional()
  inventory?: string;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  detailedTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  shortDescription?: string;

  @IsIn(PRODUCT_CATEGORIES)
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  subcategory?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  originalPrice?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecificationDto)
  @IsOptional()
  specifications?: SpecificationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  @IsOptional()
  variants?: VariantDto[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /** Rider pickup address for this product. */
  @IsString()
  @IsOptional()
  orderPickupLocation?: string;

  /** JSON-encoded tiered pricing config (Company sellers). */
  @IsString()
  @IsOptional()
  tieredPricing?: string;

  /** JSON-encoded inventory metadata (Company sellers). */
  @IsString()
  @IsOptional()
  inventory?: string;

  /** Admin / CMS featured placement (stripped for non-admin in controller). */
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  featuredPriority?: number;

  /** ISO date string; null clears scheduling (stripped for non-admin when unchanged flow uses body echo). */
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsDateString()
  featuredUntil?: string | null;
}
