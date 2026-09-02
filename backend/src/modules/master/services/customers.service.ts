import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from '../dto/customer.dto';

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

  async create(dto: CreateCustomerDto) {
    const {
      instansi,
      phone,
      address,
      alamatDetail,
      provinsi,
      kota,
      kecamatan,
      salesAssignee,
      creditLimit,
      taxId,
      ...rest
    } = dto;
    return this.prisma.salesLead.create({
      data: {
        clientName: dto.clientName,
        brandName: instansi || null,
        contactInfo: phone || '',
        email: dto.email || null,
        city: kota || null,
        province: provinsi || null,
        addressDetail: alamatDetail || null,
        status: (dto.status as any) || 'NEW_LEAD',
        source: 'DIRECT',
        productInterest: '',
        estimatedValue: creditLimit || 0,
        picId: salesAssignee || (await this.getDefaultPicId()),
      },
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.prisma.salesLead.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');

    const {
      instansi,
      phone,
      address,
      alamatDetail,
      provinsi,
      kota,
      kecamatan,
      salesAssignee,
      creditLimit,
      taxId,
      ...rest
    } = dto;
    return this.prisma.salesLead.update({
      where: { id },
      data: {
        ...(dto.clientName !== undefined && { clientName: dto.clientName }),
        ...(instansi !== undefined && { brandName: instansi }),
        ...(phone !== undefined && { contactInfo: phone }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(kota !== undefined && { city: kota }),
        ...(provinsi !== undefined && { province: provinsi }),
        ...(alamatDetail !== undefined && { addressDetail: alamatDetail }),
        ...(dto.status !== undefined && { status: dto.status as any }),
        ...(creditLimit !== undefined && { estimatedValue: creditLimit }),
        ...(dto.categoryId !== undefined && {
          categoryId: dto.categoryId || null,
        }),
        ...(salesAssignee !== undefined && { picId: salesAssignee }),
      },
    });
  }

  async remove(id: string) {
    const customer = await this.prisma.salesLead.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');
    return this.prisma.salesLead.update({
      where: { id },
      data: { status: 'LOST' as any },
    });
  }

  private async getDefaultPicId(): Promise<string> {
    const staff = await this.prisma.bussdevStaff.findFirst({
      orderBy: { name: 'asc' },
    });
    return staff?.id || '';
  }
}
