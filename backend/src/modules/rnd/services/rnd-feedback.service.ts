import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

export interface RndActorContext {
  userId?: string;
  organizationId?: string;
  roles?: string[];
  enforce?: boolean;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class RndFeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveTenant(actor: RndActorContext | undefined): string {
    const orgId = actor?.organizationId;
    if (typeof orgId === 'string' && UUID_RE.test(orgId)) return orgId;
    throw new BadRequestException({
      code: 'TENANT_UNRESOLVED',
      message: 'Tenant wajib diisi dari konteks server.',
    });
  }

  private scopeWhere(actor: RndActorContext | undefined): Record<string, any> {
    const orgId = actor?.organizationId;
    if (typeof orgId === 'string' && UUID_RE.test(orgId)) {
      return { lead: { organizationId: orgId } };
    }
    if (actor?.enforce) this.resolveTenant(actor);
    return {};
  }

  private assertTenantResolved(actor: RndActorContext | undefined): void {
    if (actor?.enforce) this.resolveTenant(actor);
  }

  private scopeWhereAt(
    actor: RndActorContext | undefined,
    root: 'sampleRequest' | 'formula',
  ): Record<string, any> {
    const lead = this.scopeWhere(actor);
    if (Object.keys(lead).length === 0) return {};
    return root === 'sampleRequest'
      ? { sampleRequest: lead }
      : { formula: { sampleRequest: lead } };
  }

  private refuseCrossTenant(): never {
    throw new ForbiddenException({
      code: 'TENANT_ISOLATION_VIOLATION',
      message: 'Tenant isolation violation',
    });
  }

  private async assertParentSampleVisible(
    sampleId: string,
    actor: RndActorContext | undefined,
  ): Promise<void> {
    const scope = this.scopeWhere(actor);
    if (Object.keys(scope).length === 0) return;
    const own = await this.prisma.sampleRequest.findFirst({
      where: { id: sampleId, ...scope },
      select: { id: true },
    });
    if (!own) this.refuseCrossTenant();
  }

  async getFeedback(sampleId: string, actor?: RndActorContext) {
    this.assertTenantResolved(actor);
    await this.assertParentSampleVisible(sampleId, actor);
    return this.prisma.sampleFeedback.findMany({
      where: { sampleRequestId: sampleId, ...this.scopeWhereAt(actor, 'sampleRequest') },
      orderBy: { createdAt: 'desc' },
    });
  }
}
