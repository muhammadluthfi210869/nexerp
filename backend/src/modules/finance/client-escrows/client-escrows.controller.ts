import { Controller, Get, Param } from '@nestjs/common';
import { ClientEscrowsService } from './client-escrows.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('finance')
@Controller('finance/client-escrows')
export class ClientEscrowsController {
  constructor(private service: ClientEscrowsService) {}

  @Get()
  @ApiOperation({ summary: 'List all client-escrows' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client-escrows by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
