import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { ApiException } from '../../common/exceptions/api.exception';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponseHelper } from '../../common/helpers/api-response.helper';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UploadService } from './upload.service';

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super-admin', 'seller', 'rider')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file?.buffer) {
      throw ApiException.badRequest('No file uploaded. Use field name "file".');
    }
    const url = await this.uploadService.uploadImage(
      file.buffer,
      file.mimetype,
      file.originalname,
    );
    return ApiResponseHelper.success(
      { url },
      'Image uploaded successfully',
    );
  }
}
