import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;

  /** When set, authenticates only that role (customer / seller / rider). Recommended when the same email has multiple accounts. */
  @IsOptional()
  @IsString()
  @IsIn([
    'customer',
    'seller',
    'rider',
    'sub-franchise',
    'master-franchise',
    'corporate-franchise',
    'admin',
    'super-admin',
    'user',
  ])
  role?: string;
}
