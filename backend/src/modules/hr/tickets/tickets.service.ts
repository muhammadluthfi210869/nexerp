import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: string, type?: string) {
    return this.prisma.ticket.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(type ? { type: type as any } : {}),
      },
      include: { employee: true, approver: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { employee: true, approver: true },
    });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  async create(dto: CreateTicketDto) {
    const data: any = {
      employeeId: dto.employeeId,
      type: dto.type,
      reason: dto.reason,
      startDate: new Date(dto.startDate),
    };
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    if (dto.amount !== undefined) data.amount = String(dto.amount);
    if (dto.attachmentPath) data.attachmentPath = dto.attachmentPath;

    return this.prisma.ticket.create({
      data,
      include: { employee: true },
    });
  }

  async update(id: string, dto: UpdateTicketDto) {
    await this.findOne(id);
    return this.prisma.ticket.update({
      where: { id },
      data: dto,
      include: { employee: true, approver: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.ticket.delete({ where: { id } });
  }
}
