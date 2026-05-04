import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";
import { AREA_OF_DISTRIBUTION_VALUES } from "../../seller/schemas/seller.schema";

/** Validates parsed multipart profile updates (after {@link parseAreaOfDistributionFromRequest}). */
export class SellerProfileUpdateDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== '')
  @IsString()
  @MinLength(8)
  password?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  businessName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  businessType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  businessLicense?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @IsIn([...AREA_OF_DISTRIBUTION_VALUES], { each: true })
  areaOfDistribution?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(120)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  state?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  zipCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  sellerCategory?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  distributionArea?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  authorizedTerritories?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  parentCompanyId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  storeDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  storePickupAddress?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  storeCategory?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  verificationCode?: string;
}
