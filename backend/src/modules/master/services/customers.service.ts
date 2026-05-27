import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    const where = search
      ? {
          OR: [
            { clientName: { contains: search, mode: 'insensitive' as const } },
            { brandName: { contains: search, mode: 'insensitive' as const } },
            { contactInfo: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.salesLead.findMany({
      where,
      select: {
        id: true,
        clientName: true,
        brandName: true,
        contactInfo: true,
        email: true,
        city: true,
        province: true,
        status: true,
        pic: {
          select: { id: true, name: true },
        },
      },
      orderBy: { clientName: 'asc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.salesLead.findUnique({
      where: { id },
      include: {
        pic: true,
        salesOrders: { orderBy: { createdAt: 'desc' }, take: 5 },
        sampleRequests: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }
}
