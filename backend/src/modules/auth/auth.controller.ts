import { Controller, Post, Get, Body, UseGuards, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordSendDto } from './dto/forgot-password-send.dto';
import { ForgotPasswordResetDto } from './dto/forgot-password-reset.dto';
import { SendRegistrationCodeDto, CheckRegistrationEmailDto, SwitchRoleDto, ChangePasswordDto } from './dto/auth-misc.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/send-code')
  async sendRegistrationCode(@Body() dto: SendRegistrationCodeDto) {
    const result = await this.authService.sendRegistrationCode(dto);
    return ApiResponseHelper.success(result, 'Verification code sent');
  }

  @Post('register/check-email')
  async checkRegistrationEmail(@Body() dto: CheckRegistrationEmailDto) {
    const role = dto.role ?? 'customer';
    const result = await this.authService.checkRegistrationEmail(dto.email, role);
    return ApiResponseHelper.success(result, result.message);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: dto.role || 'user',
      isSeller: dto.isSeller,
      sellerType: dto.sellerType,
      businessName: dto.businessName,
      verificationCode: dto.verificationCode,
    });
    return ApiResponseHelper.success(result, 'User registered successfully', 201);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const result = await this.authService.login(dto.email, dto.password, dto.role);
    return ApiResponseHelper.success(result, 'Login successful');
  }

  @Post('forgot-password/send-code')
  async sendForgotPasswordCode(@Body() dto: ForgotPasswordSendDto) {
    const result = await this.authService.sendForgotPasswordCode(dto.email);
    return ApiResponseHelper.success(result, result.message);
  }

  @Post('forgot-password/reset')
  async resetPasswordWithCode(@Body() dto: ForgotPasswordResetDto) {
    const result = await this.authService.resetPasswordWithCode(
      dto.email,
      dto.verificationCode,
      dto.newPassword,
    );
    return ApiResponseHelper.success(result, result.message);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { id: string }) {
    const result = await this.authService.getProfile(user.id);
    return ApiResponseHelper.success(result, 'User profile retrieved');
  }

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() dto: ChangePasswordDto,
  ) {
    const result = await this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
    return ApiResponseHelper.success(result, result.message);
  }

  /** Re-issue a JWT with a different role for already-authenticated users (multi-role accounts). */
  @Post('switch-role')
  @UseGuards(JwtAuthGuard)
  async switchRole(
    @CurrentUser() user: { id: string },
    @Body() dto: SwitchRoleDto,
  ) {
    const result = await this.authService.switchRole(user.id, String(dto?.role ?? ''));
    return ApiResponseHelper.success(result, 'Role switched');
  }

  @Post('logout')
  logout() {
    return ApiResponseHelper.success({}, 'Logout successful');
  }
}
