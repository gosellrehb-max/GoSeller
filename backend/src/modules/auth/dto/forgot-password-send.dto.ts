import { IsEmail } from 'class-validator';

export class ForgotPasswordSendDto {
  @IsEmail()
  email: string;
}
