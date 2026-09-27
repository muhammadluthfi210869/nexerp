import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FilesService, PresignUploadDto, ConfirmUploadDto } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface AuthedRequest {
  user: { userId: string };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('files/presign')
  async presignUpload(@Req() req: any, @Body() dto: any) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub || 'system';
    const data = await this.filesService.presignUpload(dto, userId);
    return { ...data, data };
  }

  @Post('files/:id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmUpload(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const userId = req.user?.id || req.user?.userId || req.user?.sub || 'system';
    const data = await this.filesService.confirmUpload(id, dto, userId);
    return { ...data, data };
  }

  @Get('templates')
  async listTemplates() {
    const data = await this.filesService.listTemplates();
    return { data };
  }

  @Get('email-templates')
  async listEmailTemplates() {
    const data = await this.filesService.listEmailTemplates();
    return { data };
  }

  @Get('sms-templates')
  async listSmsTemplates() {
    const data = await this.filesService.listSmsTemplates();
    return { data };
  }

  @Get('document-templates')
  async listDocumentTemplates() {
    const data = await this.filesService.listDocumentTemplates();
    return { data };
  }
}
