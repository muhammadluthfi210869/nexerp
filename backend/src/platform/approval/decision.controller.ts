import {
  Controller,
  Post,
  Param,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApprovalDecision } from '@prisma/client';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';

@Controller('decision')
export class DecisionController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Post(':id/resolve')
  @UseGuards(JwtAuthGuard)
  async resolveDecision(
    @Param('id') id: string,
    @Body() body: { action: 'APPROVE' | 'REJECT' | 'DEFER'; rationale?: string; expectedVersion?: number },
    @Request() req: any,
  ) {
    const actorId = req?.user?.id || req?.user?.sub || 'SYSTEM';
    const decision =
      body.action === 'APPROVE'
        ? ApprovalDecision.APPROVED
        : ApprovalDecision.REJECTED;

    return this.approvalService.decide(
      id,
      actorId,
      decision,
      body.expectedVersion,
    );
  }
}
