import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  /** Admin only — enforced in controller. */
  @IsOptional()
  @IsIn(["active", "inactive", "suspended", "pending"])
  status?: "active" | "inactive" | "suspended" | "pending";

  /** Admin only — enforced in controller. */
  @IsOptional()
  @IsIn(["customer", "seller", "admin", "super-admin"])
  role?: "customer" | "seller" | "admin" | "super-admin";
}
