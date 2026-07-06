import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { CreativeService } from './creative.service';
import { UserRole } from '@prisma/client';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateTaskDto } from './dto/create-task.dto';
import { ApjReviewDto } from './dto/apj-review.dto';
import { ClientReviewDto } from './dto/client-review.dto';
import { UploadVersionDto } from './dto/upload-version.dto';
import { UnlockTaskDto } from './dto/unlock-task.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('creative')
export class CreativeController {
  constructor(private readonly creativeService: CreativeService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
  @Get('board')
  getBoard(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<any> {
    return this.creativeService.getBoard(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
  @Get('tasks')
  getAllTasks(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<any> {
    return this.creativeService.getAllTasks(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  @Get('available-sales-orders')
  getAvailableSalesOrders() {
    return this.creativeService.getAvailableSalesOrders();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
  @Post('task')
  createTask(@Body() dto: CreateTaskDto, @Req() req: any) {
    return this.creativeService.createTask({
      leadId: dto.leadId,
      brief: dto.brief,
      soId: dto.soId,
      taskType: dto.taskType,
      createdBy: req.user?.id,
    });
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
        fileFilter: (req: any, file: any, cb: any) => {
          const allowedMimes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/svg+xml',
            'application/postscript',
            'application/illustrator',
            'image/tiff',
            'application/vnd.corel-draw',
          ];
          const allowedExts = [
            '.pdf',
            '.ai',
            '.cdr',
            '.jpg',
            '.jpeg',
            '.png',
            '.svg',
            '.tif',
            '.tiff',
          ];
          const ext = extname(file.originalname).toLowerCase();
          if (
            !allowedMimes.includes(file.mimetype) &&
            !allowedExts.includes(ext)
          ) {
            return cb(
              new BadRequestException(`File type ${file.mimetype} not allowed`),
              false,
            );
          }
          cb(null, true);
        },
      },
    ),
  )
  uploadVersion(
    @Param('id') id: string,
    @UploadedFiles() files: { artwork?: any[]; mockup?: any[] },
    @Body() dto: UploadVersionDto,
    @Req() req: any,
  ) {
    let printSpecs: any = undefined;
    if (dto.printSpecs) {
      try {
        printSpecs = JSON.parse(dto.printSpecs);
      } catch {
        throw new BadRequestException('Invalid JSON in printSpecs');
      }
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
      printSpecs,
      uploadedBy: req.user?.id,
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
    @Body() dto: ApjReviewDto,
    @Req() req: any,
  ) {
    return this.creativeService.apjReview({
      taskId: id,
      status: dto.status,
      notes: dto.notes,
      authorId: req.user?.id,
      pin: dto.pin,
      ipAddress: req.ip ?? null,
    });
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.COMMERCIAL)
  @Patch('task/:id/client-review')
  clientReview(@Param('id') id: string, @Body() dto: ClientReviewDto) {
    return this.creativeService.clientReview(id, dto.status, dto.notes);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.DIRECTOR)
  @Patch('task/:id/unlock')
  unlockTask(
    @Param('id') id: string,
    @Body() dto: UnlockTaskDto,
    @Req() req: any,
  ) {
    return this.creativeService.unlockTask({
      taskId: id,
      action: dto.action,
      managerPin: dto.managerPin,
      userId: req.user?.id,
    });
  }
}
