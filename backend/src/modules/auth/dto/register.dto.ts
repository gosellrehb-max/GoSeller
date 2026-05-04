import { IsEmail, IsString, MinLength, IsOptional, IsIn, IsBoolean, ValidateIf, Matches } from 'class-validator';

const SELLER_TYPES = ['Company', 'Dealer', 'Wholesaler', 'Trader', 'Shopkeeper'] as const;

export class RegisterDto {
  @IsString()
  @Matches(/^[A-Za-z][A-Za-z\s'-]*$/, { message: 'Name must contain letters only.' })
  name: string;

  @IsEmail()
  email: string;

  /** Required for a new account; omit or leave empty when adding a role to an existing email (verified by OTP). */
  @ValidateIf((o) => typeof o.password === 'string' && o.password.length > 0)
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one uppercase letter and one number',
  })
  password?: string;

  @IsString()
  @MinLength(4, { message: 'Verification code is required' })
  verificationCode: string;

  @IsOptional()
  @IsIn([
    'user',
    'customer',
    'seller',
    'rider',
    'sub-franchise',
    'master-franchise',
    'corporate-franchise',
    'admin',
    'super-admin',
  ])
  role?: string;

  /** If true, user is registering as seller and must provide sellerType and businessName */
  @IsOptional()
  @IsBoolean()
  isSeller?: boolean;

  @ValidateIf((o) => o.isSeller === true)
  @IsIn(SELLER_TYPES, { message: `sellerType must be one of: ${SELLER_TYPES.join(', ')}` })
  sellerType?: string;

  @ValidateIf((o) => o.isSeller === true)
  @IsString()
  @MinLength(1, { message: 'Business name is required when registering as seller' })
  businessName?: string;
}
