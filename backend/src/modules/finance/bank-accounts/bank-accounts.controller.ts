import { Controller, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { BankAccountsService } from './bank-accounts.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateBankAccountDto,
  UpdateBankAccountDto,
  ReconcileBankAccountDto,
} from './dto/bank-accounts.dto';

@ApiTags('finance/bank-accounts')
@ApiBearerAuth()
@Controller('finance/bank-accounts')
export class BankAccountsController {
  constructor(private service: BankAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active bank accounts' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bank account with recent transactions' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new bank account' })
  create(@Req() req: any, @Body() dto: CreateBankAccountDto) {
    const userId = req.user?.id;
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update bank account details' })
  update(@Param('id') id: string, @Body() dto: UpdateBankAccountDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/reconcile')
  @ApiOperation({ summary: 'Reconcile bank account to actual balance' })
  reconcile(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ReconcileBankAccountDto,
  ) {
    const userId = req.user?.id;
    return this.service.reconcile(userId, id, dto);
  }
}
