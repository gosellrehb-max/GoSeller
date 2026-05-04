import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

export class CartAddItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  variantKey?: string;

  @IsString()
  @IsOptional()
  variantLabel?: string;
}

export class CartUpdateQuantityDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}
