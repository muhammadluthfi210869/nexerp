import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileStorageService } from './storage/file-storage.service';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly storageService: FileStorageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Query('module') module: string,
    @Query('subFolder') subFolder: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!module || !subFolder) {
      throw new BadRequestException(
        'Module and subFolder queries are required',
      );
    }

    const url = await this.storageService.saveFile(module, subFolder, {
      buffer: file.buffer,
      originalname: file.originalname,
    });

    return { url };
  }
}
