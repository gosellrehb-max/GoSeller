import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { ApiException } from '../../common/exceptions/api.exception';
import { hasAdminGrant } from '../../common/auth/request-user.roles';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'super-admin')
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.createByAdmin({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: dto.role ?? 'customer',
      status: dto.status ?? 'pending',
    });
    const obj = user.toObject();
    delete (obj as Record<string, unknown>).password;
    return ApiResponseHelper.created({ user: obj }, 'User created successfully. Set status to active to approve.');
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'super-admin')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('userType') userType?: string,
    @Query('isActive') isActive?: string,
  ) {
    const result = await this.usersService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search,
      userType,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
    return ApiResponseHelper.success(
      {
        users: result.users,
        pagination: { current: result.page, pages: result.pages, total: result.total },
      },
      'Users retrieved successfully',
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() currentUser: { id: string; role: string }) {
    if (!hasAdminGrant(currentUser) && currentUser.id !== id) {
      throw ApiException.forbidden();
    }
    const user = await this.usersService.findById(id);
    if (!user) throw ApiException.notFound('User not found');
    const obj = user.toObject();
    delete (obj as Record<string, unknown>).password;
    return ApiResponseHelper.success({ user: obj }, 'User retrieved successfully');
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() currentUser: { id: string; role: string },
  ) {
    const isAdmin = hasAdminGrant(currentUser);
    if (!isAdmin && currentUser.id !== id) throw ApiException.forbidden();
    if (!isAdmin) {
      delete body.status;
      delete body.role;
    }
    const user = await this.usersService.updateById(id, body);
    return ApiResponseHelper.success({ user }, 'User updated successfully');
  }
}
