import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { ApiException } from '../../common/exceptions/api.exception';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('parentId') parentId?: string,
  ) {
    const result = await this.categoriesService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
      parentId,
    );
    return ApiResponseHelper.success(
      {
        categories: result.categories,
        pagination: { current: result.page, pages: result.pages, total: result.total },
      },
      'Categories retrieved successfully',
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const category = await this.categoriesService.findById(id);
    if (!category) throw ApiException.notFound('Category not found');
    return ApiResponseHelper.success({ category }, 'Category retrieved successfully');
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  async create(@Body() dto: CreateCategoryDto) {
    const category = await this.categoriesService.create(dto as never);
    return ApiResponseHelper.created({ category }, 'Category created successfully');
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const category = await this.categoriesService.updateById(id, dto);
    if (!category) throw ApiException.notFound('Category not found');
    return ApiResponseHelper.success({ category }, 'Category updated successfully');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  async remove(@Param('id') id: string) {
    await this.categoriesService.deleteById(id);
    return ApiResponseHelper.success(null, 'Category deleted successfully');
  }
}
