import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import {
  CreateAuditDto,
  UpdateAuditChecklistDto,
  AddFindingDto,
} from './dto/create-audit.dto';

@Injectable()
export class AuditsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.internalAudit.findMany({
      orderBy: { auditDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const audit = await this.prisma.internalAudit.findUnique({
      where: { id },
    });
    if (!audit) throw new NotFoundException(`Internal audit ${id} not found`);
    return audit;
  }

  async create(dto: CreateAuditDto) {
    return this.prisma.internalAudit.create({
      data: {
        area: dto.area,
        auditDate: new Date(dto.auditDate),
        picId: dto.picId,
        parameterChecklist: (dto.parameterChecklist as any) ?? {},
        findings: dto.findings,
        remediationDeadline: dto.remediationDeadline
          ? new Date(dto.remediationDeadline)
          : null,
        status: dto.status ?? 'PENDING',
      },
    });
  }

  async updateChecklist(id: string, dto: UpdateAuditChecklistDto) {
    await this.findOne(id);
    return this.prisma.internalAudit.update({
      where: { id },
      data: { parameterChecklist: dto.parameterChecklist as any },
    });
  }

  async addFinding(id: string, dto: AddFindingDto) {
    const audit = await this.findOne(id);
    const stamp = `\n[${new Date().toISOString()}] ${dto.finding}`;
    const merged = (audit.findings ?? '') + stamp;
    return this.prisma.internalAudit.update({
      where: { id },
      data: {
        findings: merged,
        remediationDeadline: dto.remediationDeadline
          ? new Date(dto.remediationDeadline)
          : audit.remediationDeadline,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.internalAudit.update({
      where: { id },
      data: { status },
    });
  }
}
