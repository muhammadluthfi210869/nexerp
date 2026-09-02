import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

/**
 * Generic catalog CRUD for the kil.nexerp.id preview environment.
 *
 * GET /api/catalog/models                        — list exposed models
 * GET /api/catalog/:model[?skip&take&filter...]  — paginated list
 * GET /api/catalog/:model/:id                    — read one
 * POST /api/catalog/:model                       — create (write-gated)
 * PUT /api/catalog/:model/:id                    — update (write-gated)
 * DELETE /api/catalog/:model/:id                 — delete (write-gated)
 *
 * Write blacklist enforced untuk model sensitif (auth, audit logs,
 * compliance records). Read tetap dibuka supaya director bisa lihat data.
 */

// Model yang di-BLOCK dari writes (data integrity risk).
// Auth = password/role, audit = tampering risk, compliance = regulatory.
const WRITE_BLACKLIST = new Set<string>([
  'user',
  'session',
  'auditLog',
  'auditTrail',
  'internalAudit',
  'qcAudit',
  'changeRequest',
  'stateTransitionLog',
  'payment', // double-bookkeeping risk di preview
]);

@Controller('api/catalog')
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private prisma: PrismaService) {}

  /** Resolve a model name to its Prisma delegate. */
  private getDelegate(model: string) {
    if (!model || typeof model !== 'string') {
      throw new NotFoundException('Model name required');
    }
    // Prisma delegates are camelCase on the client.
    const pascal = model.charAt(0).toUpperCase() + model.slice(1);
    const candidates = [pascal, model];
    for (const candidate of candidates) {
      const delegate = (this.prisma as any)[candidate];
      if (delegate && typeof delegate.findMany === 'function') {
        return delegate;
      }
    }
    throw new NotFoundException(`Model '${model}' not exposed`);
  }

  /** Enumerate Prisma delegates available to the catalog. */
  @Get('models')
  listModels() {
    const keys = Object.keys(this.prisma).filter((k) => {
      if (k.startsWith('$') || k.startsWith('_')) return false;
      const v = (this.prisma as any)[k];
      return v && typeof v === 'object' && typeof v.findMany === 'function';
    });
    return keys.sort();
  }

  /** Paginated list with optional equality filters via query string. */
  @Get(':model')
  async list(@Param('model') model: string, @Query() query: Record<string, any>) {
    const delegate = this.getDelegate(model);
    const skip = Math.max(0, parseInt(String(query.skip ?? '0'), 10) || 0);
    const take = Math.min(200, Math.max(1, parseInt(String(query.take ?? '50'), 10) || 50));
    const where: Record<string, any> = {};
    for (const [k, v] of Object.entries(query)) {
      if (k === 'skip' || k === 'take') continue;
      if (typeof v !== 'string') continue;
      if (v === 'null') where[k] = null;
      else if (v === '!null') where[k] = { not: null };
      else where[k] = v;
    }
    const [data, total] = await Promise.all([
      delegate.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      delegate.count({ where }).catch(() => undefined),
    ]);
    return { data, pagination: { skip, take, total } };
  }

  @Get(':model/:id')
  async read(@Param('model') model: string, @Param('id') id: string) {
    const delegate = this.getDelegate(model);
    const record = await delegate.findUnique({ where: { id } });
    if (!record) throw new NotFoundException();
    return record;
  }

  private checkWriteAllowed(model: string) {
    const key = model.charAt(0).toLowerCase() + model.slice(1);
    if (WRITE_BLACKLIST.has(key) || WRITE_BLACKLIST.has(model.toLowerCase())) {
      throw new ForbiddenException(
        `Writes to '${model}' are disabled in preview (data integrity)`,
      );
    }
  }

  @Post(':model')
  async create(
    @Param('model') model: string,
    @Body() data: any,
  ) {
    this.checkWriteAllowed(model);
    const delegate = this.getDelegate(model);
    const created = await delegate.create({ data });
    return created;
  }

  @Put(':model/:id')
  async update(
    @Param('model') model: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    this.checkWriteAllowed(model);
    const delegate = this.getDelegate(model);
    return delegate.update({ where: { id }, data });
  }

  @Delete(':model/:id')
  async delete(@Param('model') model: string, @Param('id') id: string) {
    this.checkWriteAllowed(model);
    const delegate = this.getDelegate(model);
    return delegate.delete({ where: { id } });
  }
}
