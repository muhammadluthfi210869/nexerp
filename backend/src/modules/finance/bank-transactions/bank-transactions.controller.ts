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
import { BankTransactionsService } from './bank-transactions.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateBankTransactionDto,
  ReconcileBankTransactionDto,
} from './dto/bank-transactions.dto';

@ApiTags('finance/bank-transactions')
@ApiBearerAuth()
@Controller('finance/bank-transactions')
export class BankTransactionsController {
  constructor(private service: BankTransactionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List bank transactions (filter by account, date range, type, reconciled status)',
  })
  findAll(
    @Query('bankAccountId') bankAccountId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('transactionType') transactionType?: string,
    @Query('reconciled') reconciled?: string,
  ) {
    return this.service.findAll({
      bankAccountId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      transactionType: transactionType as any,
      reconciled:
        reconciled === undefined ? undefined : reconciled === 'true' || reconciled === '1',
    });
  }

  @Get('running-balance')
  @ApiOperation({ summary: 'Get running balance for a bank account over a date range' })
  runningBalance(
    @Query('bankAccountId') bankAccountId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    if (!bankAccountId) throw new BadRequestException('bankAccountId required');
    return this.service.getRunningBalance(
      bankAccountId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bank transaction by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Record manual bank transaction (fees/interest/adjustment)' })
  create(@Req() req: any, @Body() dto: CreateBankTransactionDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Post(':id/reconcile')
  @ApiOperation({ summary: 'Mark transaction as reconciled against bank statement' })
  reconcile(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ReconcileBankTransactionDto,
  ) {
    const userId = req.user?.id;
    return this.service.reconcile(userId, id, dto);
  }

  @Post(':id/unreconcile')
  @ApiOperation({ summary: 'Unreconcile transaction (admin correction)' })
  unreconcile(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.unreconcile(userId, id);
  }
}
