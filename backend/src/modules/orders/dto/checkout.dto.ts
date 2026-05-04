import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsIn,
  Min,
  ValidateNested,
  IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ORDER_STATUSES } from '../order.constants';

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsOptional()
  country?: string;
}

export class ShippingAddressDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}

export class PaymentDto {
  @IsIn(['cod', 'card', 'jazzcash', 'easypaisa'])
  method: 'cod' | 'card' | 'jazzcash' | 'easypaisa';

  @IsString()
  @IsOptional()
  reference?: string;
}

export class CheckoutDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ValidateNested()
  @Type(() => PaymentDto)
  @IsOptional()
  payment?: PaymentDto;
}

export class BuyNowDto {
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ValidateNested()
  @Type(() => PaymentDto)
  @IsOptional()
  payment?: PaymentDto;

  @IsString()
  @IsOptional()
  variantLabel?: string;
}

export class UpdateOrderStatusDto {
  @IsOptional()
  @IsIn([...ORDER_STATUSES])
  status?: string;

  @IsString()
  @IsOptional()
  assignedRiderId?: string | null;
}

export class CancelOrderDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
