import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Req,
  UseGuards,
  Query,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommunicationService } from './communication.service';
import { CreateThreadDto, UpdateThreadDto } from './dto/create-thread.dto';
import { CreateReplyDto, AddMentionDto } from './dto/reply.dto';
import { ThreadStatus } from '@prisma/client';
import { BusinessRuleViolationException } from '../../common/exceptions/api-exception';

interface AuthedRequest {
  user: { userId: string };
}

@Controller('communications')
@UseGuards(JwtAuthGuard)
export class CommunicationController {
  constructor(private readonly service: CommunicationService) {}

  // ---- THREADS ----

  @Post('threads')
  async createThread(@Req() req: AuthedRequest, @Body() dto: CreateThreadDto) {
    return this.service.createThread({
      ...dto,
      createdById: req.user.userId,
    });
  }

  @Get('threads')
  async listThreads(
    @Req() req: AuthedRequest,
    @Query('contextType') contextType?: string,
    @Query('contextId') contextId?: string,
    @Query('status') status?: ThreadStatus,
    @Query('mine') mine?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    // ?mine=1 → listThreadsForUser (involved threads).
    // else → listThreadsByContext (requires contextType + contextId).
    if (mine === '1') {
      return this.service.listThreadsForUser(req.user.userId, {
        contextType,
        contextId,
        status,
        limit: limit ? parseInt(limit, 10) : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      });
    }
    if (!contextType || !contextId) {
      throw new BusinessRuleViolationException(
        'CONTEXT_REQUIRED',
        'contextType dan contextId wajib diisi (atau gunakan mine=1)',
      );
    }
    return this.service.listThreadsByContext(contextType, contextId, status);
  }

  @Get('threads/:id')
  async getThread(@Param('id') id: string) {
    return this.service.getThread(id);
  }

  @Patch('threads/:id')
  async updateThread(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateThreadDto,
  ) {
    return this.service.updateThread(id, dto, req.user.userId);
  }

  // ---- REPLIES ----

  @Post('threads/:id/replies')
  async replyToThread(
    @Req() req: AuthedRequest,
    @Param('id') threadId: string,
    @Body() dto: CreateReplyDto,
  ) {
    return this.service.replyToThread({
      threadId,
      authorId: req.user.userId,
      body: dto.body,
      parentReplyId: dto.parentReplyId,
      mentionIds: dto.mentionIds,
    });
  }

  @Post('replies/:id/mentions')
  async addMention(
    @Req() req: AuthedRequest,
    @Param('id') replyId: string,
    @Body() dto: AddMentionDto,
  ) {
    return this.service.addMention(replyId, dto.mentionedUserId, req.user.userId);
  }

  // ---- ATTACHMENTS ----

  @Post('threads/:id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      // Memory storage — FileStorageService writes the buffer to disk.
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  async attachToThread(
    @Req() req: AuthedRequest,
    @Param('id') threadId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('File wajib diupload (field: file)');
    return this.service.attachFile({
      threadId,
      uploadedById: req.user.userId,
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });
  }

  @Post('replies/:id/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async attachToReply(
    @Req() req: AuthedRequest,
    @Param('id') replyId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!file) throw new BadRequestException('File wajib diupload (field: file)');
    return this.service.attachFile({
      replyId,
      uploadedById: req.user.userId,
      file: {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
    });
  }
}
