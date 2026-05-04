import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import {
  ORDER_ITEM_STATUSES,
  ORDER_PAYMENT_METHODS,
  ORDER_PAYMENT_STATUSES,
  ORDER_STATUSES,
} from "../order.constants";
import { ShippingAddressDto } from "./checkout.dto";

export class AdminOrderItemDto {
  @IsMongoId()
  product: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  totalPrice: number;

  @IsMongoId()
  seller: string;

  @IsOptional()
  @IsIn([...ORDER_ITEM_STATUSES])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  variantLabel?: string;
}

export class AdminPaymentDto {
  @IsIn([...ORDER_PAYMENT_METHODS])
  method: string;

  @IsOptional()
  @IsIn([...ORDER_PAYMENT_STATUSES])
  status?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  transactionId?: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  @MaxLength(8)
  currency?: string;
}

/** Admin-only POST /orders — fields aligned with {@link Order} / {@link OrderItem} schemas. */
export class AdminCreateOrderDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  orderNumber?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdminOrderItemDto)
  items?: AdminOrderItemDto[];

  @IsOptional()
  @IsIn([...ORDER_STATUSES])
  status?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== "")
  @IsMongoId()
  assignedRiderId?: string | null;

  @IsOptional()
  @IsIn(["customer", "seller"])
  cancelledBy?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  cancellationReason?: string;

  @IsOptional()
  @IsMongoId()
  subFranchiseId?: string;

  @IsOptional()
  @IsMongoId()
  masterFranchiseId?: string;

  @IsOptional()
  @IsMongoId()
  corporateFranchiseId?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalAmount?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  shippingCost?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress?: ShippingAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminPaymentDto)
  payment?: AdminPaymentDto;
}
