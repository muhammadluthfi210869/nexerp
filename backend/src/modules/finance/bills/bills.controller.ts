import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { Controller, Get, Post, Param, Body, Req, UseGuards } from '@nestjs/common';
import { BillsService } from './bills.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CancelBillDto } from './dto/create-bill.dto';

// The collection itself (`GET`/`POST finance/bills`) is owned by
// `finance/finance.controller.ts`: it is registered first, so Express answered
// every list/create from there and these two handlers could never run. They were
// removed rather than the live ones because the frontend posts
// `{vendorId, billRef, issueDate, dueDate, amount}` — the live DTO, not
// `CreateBillDto` — and the live list already flattens `billNumber`/`vendorName`
// for the bills screen. The per-bill routes below have no duplicate owner and
// stay here, where they serve the `Bill` entity itself.
@ApiTags('finance/bills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.FINANCE,
  UserRole.DIRECTOR,
  UserRole.HEAD_OPS,
)
@Controller('finance/bills')
export class BillsController {
  constructor(private service: BillsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get bill by ID with line items and allocations' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/post')
  @ApiOperation({
    summary: 'Post bill — mark as ready for payment, create journal',
  })
  post(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    return this.service.post(userId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a bill (only if not yet paid)' })
  cancel(@Req() req: any, @Param('id') id: string, @Body() dto: CancelBillDto) {
    const userId = req.user?.id;
    return this.service.cancel(userId, id, dto.reason);
  }
}
