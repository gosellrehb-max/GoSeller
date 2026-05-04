import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class ForgotPasswordResetDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(4, { message: 'Verification code is required' })
  verificationCode: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must contain at least one uppercase letter and one number',
  })
  newPassword: string;
}
