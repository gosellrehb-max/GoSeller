import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from "class-validator";

export class RiderEmailBodyDto {
  @IsEmail()
  email: string;
}

/** Multipart body fields for POST /riders/register (files validated separately). */
export class RiderRegisterMultipartDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  lastName: string;

  @IsEmail()
  email: string;

  /** Required when creating a new user; omit when adding rider role to an existing account (validated in service). */
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== '')
  @IsString()
  @MinLength(8)
  password?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  verificationCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  idNumber: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  personalNotes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  courierCompanyName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  courierCompanyBranch?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  courierEmployeeId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  vehicleType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  courierCompanyDetails?: string;
}

/** Multipart body fields for PUT /riders/me (files validated separately). */
export class RiderUpdateMultipartDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  idNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  personalNotes?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  courierCompanyName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  courierCompanyBranch?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  courierEmployeeId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  vehicleType?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  courierCompanyDetails?: string;
}
