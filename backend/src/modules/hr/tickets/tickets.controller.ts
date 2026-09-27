import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { TicketsService } from './tickets.service';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

// `GET`/`POST hr/tickets` used to be declared here as well. HrController is
// registered first, so Express answered both from `hr/hr.controller.ts` and these
// could never run. They were removed rather than the live ones because the live
// ones are the correct implementation: `Ticket.amount` is stored encrypted and
// `hr.service.getTickets` decrypts it, while `TicketsService.create` would have
// written the amount as plaintext into a column every reader tries to decrypt.
//
// The routes below have no duplicate owner, and the tickets screen approves
// through `PATCH hr/tickets/:id`, which only this controller declares.
@ApiTags('hr/tickets')
@ApiBearerAuth()
@Controller('hr/tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly service: TicketsService) {}

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HR, UserRole.FINANCE)
  @ApiOperation({ summary: 'Get ticket by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Update/approve/reject a ticket' })
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Delete a ticket' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
