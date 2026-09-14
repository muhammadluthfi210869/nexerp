import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { ClientEscrowsService } from './client-escrows.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DepositEscrowDto, ReleaseEscrowDto } from './dto/client-escrows.dto';

@ApiTags('finance/client-escrows')
@ApiBearerAuth()
@Controller('finance/client-escrows')
export class ClientEscrowsController {
  constructor(private service: ClientEscrowsService) {}

  @Get()
  @ApiOperation({ summary: 'List all client escrows' })
  findAll(
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({ customerId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client escrow by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Deposit new customer escrow (advance payment held)' })
  deposit(@Req() req: any, @Body() dto: DepositEscrowDto) {
    const userId = req.user?.id;
    return this.service.deposit(userId, dto);
  }

  @Post(':id/release')
  @ApiOperation({ summary: 'Release escrow (RELEASE/RETURN/FORFEIT)' })
  release(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ReleaseEscrowDto,
  ) {
    const userId = req.user?.id;
    return this.service.release(userId, id, dto);
  }
}
