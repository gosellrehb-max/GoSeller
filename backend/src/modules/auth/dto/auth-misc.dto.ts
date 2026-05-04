import { IsString, IsNotEmpty, IsEmail, IsOptional, IsBoolean, MinLength, IsIn } from 'class-validator';

export class SendRegistrationCodeDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @IsIn(['customer', 'seller', 'rider', 'user'])
  role?: string;

  @IsBoolean()
  @IsOptional()
  isSeller?: boolean;
}

export class CheckRegistrationEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @IsIn(['customer', 'seller', 'rider', 'user'])
  role?: string;
}

export class SwitchRoleDto {
  @IsString()
  @IsOptional()
  @IsIn(['customer', 'seller', 'rider'])
  role?: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
