import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { BankReconciliationsService } from './bank-reconciliations.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateBankReconciliationDto,
  FinalizeReconciliationDto,
} from './dto/bank-reconciliations.dto';

@ApiTags('finance/bank-reconciliations')
@ApiBearerAuth()
@Controller('finance/bank-reconciliations')
export class BankReconciliationsController {
  constructor(private service: BankReconciliationsService) {}

  @Get()
  @ApiOperation({ summary: 'List bank reconciliations (filter by account, status)' })
  findAll(
    @Query('bankAccountId') bankAccountId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({ bankAccountId, status: status as any });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get summary: last recon status + unreconciled count for an account' })
  summary(@Query('bankAccountId') bankAccountId: string) {
    if (!bankAccountId) throw new BadRequestException('bankAccountId required');
    return this.service.getSummary(bankAccountId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bank reconciliation by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Open new reconciliation session for a period' })
  create(@Req() req: any, @Body() dto: CreateBankReconciliationDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Post(':id/finalize')
  @ApiOperation({ summary: 'Finalize reconciliation — mark all in-period txns as reconciled' })
  finalize(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: FinalizeReconciliationDto,
  ) {
    const userId = req.user?.id;
    return this.service.finalize(userId, id, dto);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Re-open a finalized reconciliation (admin correction)' })
  reopen(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.reopen(userId, id);
  }
}
