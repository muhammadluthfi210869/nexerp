import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

function getUserId(req: any): string {
  return req.user?.id || req.user?.userId || req.user?.sub || 'system';
}

@Controller('entities')
@UseGuards(JwtAuthGuard)
export class EntityCommunicationController {
  constructor(private readonly service: CommunicationService) {}

  // ---- NOTES ----

  @Get(':type/:id/notes')
  async listNotes(@Param('type') type: string, @Param('id') id: string) {
    return this.service.listNotes(type, id);
  }

  @Post(':type/:id/notes')
  async createNote(
    @Req() req: any,
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: { body: string; visibility?: string },
  ) {
    return this.service.createNote(
      type,
      id,
      getUserId(req),
      body.body,
      body.visibility,
    );
  }

  @Put(':type/:id/notes/:noteId')
  async updateNotePut(
    @Req() req: any,
    @Param('type') _type: string,
    @Param('id') _id: string,
    @Param('noteId') noteId: string,
    @Body() body: { body: string },
  ) {
    return this.service.updateNote(noteId, getUserId(req), body.body);
  }

  @Patch(':type/:id/notes/:noteId')
  async updateNote(
    @Req() req: any,
    @Param('type') _type: string,
    @Param('id') _id: string,
    @Param('noteId') noteId: string,
    @Body() body: { body: string },
  ) {
    return this.service.updateNote(noteId, getUserId(req), body.body);
  }

  @Delete(':type/:id/notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNote(
    @Req() req: any,
    @Param('type') _type: string,
    @Param('id') _id: string,
    @Param('noteId') noteId: string,
  ) {
    await this.service.deleteNote(noteId, getUserId(req));
  }

  // ---- TRANSITIONS ----

  @Get(':type/:id/transitions')
  async listTransitions(@Param('type') type: string, @Param('id') id: string) {
    return this.service.listStatusTransitions(type, id);
  }

  // ---- COMMENTS ----

  @Get(':type/:id/comments')
  async listComments(@Param('type') type: string, @Param('id') id: string) {
    return this.service.listComments(type, id);
  }

  @Post(':type/:id/comments')
  async createComment(
    @Req() req: any,
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: { body: string; related_entity_type?: string; related_entity_id?: string },
  ) {
    return this.service.createComment(
      type,
      id,
      getUserId(req),
      body.body,
      body.related_entity_type,
      body.related_entity_id,
    );
  }

  // ---- ATTACHMENTS ----

  @Get(':type/:id/attachments')
  async listAttachments(@Param('type') type: string, @Param('id') id: string) {
    return this.service.listEntityAttachments(type, id);
  }

  @Post(':type/:id/attachments')
  async attachFileToEntity(
    @Req() req: any,
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.service.attachFileToEntity(
      type,
      id,
      body,
      getUserId(req),
    );
  }

  // ---- TAGS ----

  @Get(':type/:id/tags')
  async listTags(@Param('type') type: string, @Param('id') id: string) {
    return this.service.listTags(type, id);
  }

  @Post(':type/:id/tags')
  async createTag(
    @Req() req: any,
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.service.createTag(type, id, body, getUserId(req));
  }
}
