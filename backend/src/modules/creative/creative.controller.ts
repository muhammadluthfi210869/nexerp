import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { CreativeService } from './creative.service';
import { ApprovalStatus } from '@prisma/client';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('creative')
export class CreativeController {
  constructor(private readonly creativeService: CreativeService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
  @Get('board')
  getBoard() {
    return this.creativeService.getBoard();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
  @Get('tasks')
  getAllTasks() {
    return this.creativeService.getAllTasks();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  @Get('available-sales-orders')
  getAvailableSalesOrders() {
    return this.creativeService.getAvailableSalesOrders();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
  @Post('task')
  createTask(
    @Body()
    dto: {
      leadId: string;
      brief: string;
      soId?: string;
      taskType?: string;
    },
  ) {
    return this.creativeService.createTask(
      dto.leadId,
      dto.brief,
      dto.soId,
      dto.taskType,
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
  @Patch('task/:id/version')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'artwork', maxCount: 1 },
        { name: 'mockup', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/creative_assets',
          filename: (req: any, file: any, cb: any) => {
            const randomName = Array(32)
              .fill(null)
              .map(() => Math.round(Math.random() * 16).toString(16))
              .join('');
            return cb(null, `${randomName}${extname(file.originalname)}`);
          },
        }),
        limits: {
          fileSize: 50 * 1024 * 1024,
        },
      },
    ),
  )
  uploadVersion(
    @Param('id') id: string,
    @UploadedFiles() files: { artwork?: any[]; mockup?: any[] },
    @Body() dto: { printSpecs?: string; uploadedBy?: string },
  ) {
    if (files.mockup && files.mockup[0].size > 5 * 1024 * 1024) {
      throw new BadRequestException('Mockup file too large (Max 5MB)');
    }

    const artworkUrl = files.artwork
      ? `/uploads/creative_assets/${files.artwork[0].filename}`
      : null;
    const mockupUrl = files.mockup
      ? `/uploads/creative_assets/${files.mockup[0].filename}`
      : null;

    return this.creativeService.uploadVersion({
      taskId: id,
      artworkUrl,
      mockupUrl,
      printSpecs: dto.printSpecs ? JSON.parse(dto.printSpecs) : undefined,
      uploadedBy: dto.uploadedBy,
    });
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
  @Patch('task/:id/submit')
  submitToApj(@Param('id') id: string) {
    return this.creativeService.submitToApj(id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.APJ)
  @Patch('task/:id/apj-review')
  apjReview(
    @Param('id') id: string,
    @Body()
    dto: {
      status: ApprovalStatus;
      notes: string;
      authorId: string;
      pin: string;
    },
    @Req() req: Request,
  ) {
    return this.creativeService.apjReview({
      taskId: id,
      status: dto.status,
      notes: dto.notes,
      authorId: dto.authorId,
      pin: dto.pin,
      ipAddress: req.ip ?? null,
    });
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  @Patch('task/:id/client-review')
  clientReview(
    @Param('id') id: string,
    @Body() dto: { status: ApprovalStatus; notes?: string },
  ) {
    return this.creativeService.clientReview(id, dto.status, dto.notes);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
  @Patch('task/:id/unlock')
  unlockTask(
    @Param('id') id: string,
    @Body() dto: { action: 'CHARGE' | 'WAIVE'; managerPin?: string },
  ) {
    return this.creativeService.unlockTask(id, dto.action, dto.managerPin);
  }
}
