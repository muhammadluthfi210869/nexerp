import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { CreateTaxRateDto, UpdateTaxRateDto } from '../dto/tax-rate.dto';

@Injectable()
export class TaxRatesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.taxRate.findMany({
      where: { isActive: true },
      orderBy: { rate: 'desc' },
    });
  }

  async findOne(id: string) {
    const taxRate = await this.prisma.taxRate.findUnique({ where: { id } });
    if (!taxRate) throw new NotFoundException('Tax rate not found');
    return taxRate;
  }

  async create(dto: CreateTaxRateDto) {
    return this.prisma.taxRate.create({
      data: {
        name: dto.name,
        rate: dto.rate,
        description: dto.description ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateTaxRateDto) {
    return this.prisma.taxRate.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    // ponytail: soft-delete (preserve FK references from SO/PO/Invoice items).
    return this.prisma.taxRate.update({
      where: { id },
      data: { isActive: false },
    });
  }
}