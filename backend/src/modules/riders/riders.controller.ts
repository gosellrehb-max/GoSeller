import { Controller, Get, Post, Put, Patch, Body, Param, Query, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { ApiException } from '../../common/exceptions/api.exception';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RidersService } from './riders.service';
import { OrdersService } from '../orders/orders.service';
import { validatePlain } from '../../common/helpers/validate-plain';
import {
  RiderEmailBodyDto,
  RiderRegisterMultipartDto,
  RiderUpdateMultipartDto,
} from './dto/rider-forms.dto';

@Controller('riders')
export class RidersController {
  constructor(
    private readonly ridersService: RidersService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('register/send-code')
  async sendRegistrationCode(@Body() dto: RiderEmailBodyDto) {
    const result = await this.ridersService.sendRegistrationCode(dto.email ?? '');
    return ApiResponseHelper.success(result, 'Verification code sent');
  }

  @Post('register/check-email')
  async checkRegistrationEmail(@Body() dto: RiderEmailBodyDto) {
    const result = await this.ridersService.checkRegistrationEmail(dto.email ?? '');
    return ApiResponseHelper.success(result, result.message);
  }

  @Post('register')
  @UseInterceptors(AnyFilesInterceptor())
  async register(@Req() req: { body: Record<string, unknown>; files?: Express.Multer.File[] }) {
    const body = req.body ?? {};
    validatePlain(RiderRegisterMultipartDto, body);
    const idCard = (req.files ?? []).find((f) => f.fieldname === 'idCard');
    const str = (k: string) => {
      const v = body[k];
      return v === undefined || v === null ? '' : String(v);
    };
    const result = await this.ridersService.register({
      firstName: str('firstName'),
      lastName: str('lastName'),
      email: str('email'),
      password: str('password'),
      verificationCode: str('verificationCode'),
      phone: str('phone'),
      address: str('address'),
      idNumber: str('idNumber'),
      idCardFile: idCard,
      personalNotes: str('personalNotes') || undefined,
      courierCompanyName: str('courierCompanyName') || undefined,
      courierCompanyBranch: str('courierCompanyBranch') || undefined,
      courierEmployeeId: str('courierEmployeeId') || undefined,
      vehicleType: str('vehicleType') || undefined,
      courierCompanyDetails: str('courierCompanyDetails') || undefined,
    });
    return ApiResponseHelper.success(result, 'Rider registration submitted successfully', 201);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rider', 'admin', 'super-admin')
  async getMyProfile(@CurrentUser() user: { id: string; role: string }) {
    const rider = await this.ridersService.getProfileByUserId(user.id);
    if (!rider) throw ApiException.notFound('Rider profile not found. Complete rider registration first.');
    return ApiResponseHelper.success({ rider }, 'Rider profile');
  }

  @Put('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rider', 'admin', 'super-admin')
  @UseInterceptors(AnyFilesInterceptor())
  async updateMyProfile(
    @CurrentUser() user: { id: string; role: string },
    @Req() req: { body: Record<string, unknown>; files?: Express.Multer.File[] },
  ) {
    const body = req.body ?? {};
    validatePlain(RiderUpdateMultipartDto, body);
    const idCard = (req.files ?? []).find((f) => f.fieldname === 'idCard');
    const opt = (k: string) => {
      const v = body[k];
      if (v === undefined || v === null) return undefined;
      return String(v);
    };
    const rider = await this.ridersService.updateMyProfileByUserId(
      user.id,
      {
        address: opt('address'),
        phone: opt('phone'),
        idNumber: opt('idNumber'),
        personalNotes: opt('personalNotes'),
        courierCompanyName: opt('courierCompanyName'),
        courierCompanyBranch: opt('courierCompanyBranch'),
        courierEmployeeId: opt('courierEmployeeId'),
        vehicleType: opt('vehicleType'),
        courierCompanyDetails: opt('courierCompanyDetails'),
      },
      idCard,
    );
    return ApiResponseHelper.success({ rider }, 'Rider profile updated');
  }

  /** List orders available for pickup (ready_for_delivery, not yet assigned) */
  @Get('orders/available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rider', 'admin', 'super-admin')
  async getAvailableOrders(
    @CurrentUser() _user: { id: string; role: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.ordersService.findAvailableForRider(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return ApiResponseHelper.success(
      {
        orders: result.orders,
        pagination: { current: result.page, pages: result.pages, total: result.total, limit: result.limit },
      },
      'Orders available for pickup',
    );
  }

  /** Rider picks an order (assigns self); order becomes picked and is no longer available to others */
  @Patch('orders/:orderId/pick')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('rider', 'admin', 'super-admin')
  async pickOrder(@Param('orderId') orderId: string, @CurrentUser() user: { id: string; role: string }) {
    const order = await this.ordersService.assignRider(orderId, user.id);
    if (!order) throw ApiException.notFound('Order not found');
    return ApiResponseHelper.success({ order }, 'Order picked successfully');
  }
}
