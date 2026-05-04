import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @IsOptional()
  @IsIn(['customer', 'seller'])
  role?: 'customer' | 'seller';

  /** Defaults to pending so admin can approve. */
  @IsOptional()
  @IsIn(['pending', 'active'])
  status?: 'pending' | 'active';
}
