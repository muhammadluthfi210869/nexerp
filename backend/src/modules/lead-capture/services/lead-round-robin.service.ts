import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';

@Injectable()
export class LeadRoundRobinService {
  private readonly logger = new Logger(LeadRoundRobinService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getNextRoundRobinAgent() {
    const result = await this.prisma.$transaction(async (tx) => {
      const agents = await tx.roundRobinAgent.findMany({
        where: { isActive: true },
        orderBy: { orderIndex: 'asc' },
      });

      if (agents.length === 0) {
        throw new NotFoundException('No active round robin agents');
      }

      await tx.roundRobinState.upsert({
        where: { id: 'singleton' },
        create: { id: 'singleton', currentIndex: 0 },
        update: {},
      });

      const rows = await tx.$queryRawUnsafe<Array<{ currentIndex: number }>>(
        `UPDATE round_robin_state
            SET "currentIndex" = ("currentIndex" + 1) % $1,
                "updatedAt"    = NOW()
          WHERE id = 'singleton'
        RETURNING "currentIndex"`,
        agents.length,
      );

      const newIndex = Number(rows[0]?.currentIndex ?? 0);
      const prevIndex = (newIndex - 1 + agents.length) % agents.length;
      const agent = agents[prevIndex];

      await tx.roundRobinAgent.update({
        where: { id: agent.id },
        data: { totalLeads: { increment: 1 } },
      });

      return {
        id: agent.id,
        name: agent.name,
        phoneNumber: agent.phoneNumber,
        orderIndex: agent.orderIndex,
      };
    });

    this.logger.log(
      `🔄 Round Robin: ${result.name} (${result.phoneNumber}) — lead #${result.orderIndex + 1}`,
    );

    return result;
  }

  async getRoundRobinStatus() {
    const agents = await this.prisma.roundRobinAgent.findMany({
      orderBy: { orderIndex: 'asc' },
    });
    const state = await this.prisma.roundRobinState.findUnique({
      where: { id: 'singleton' },
    });

    return {
      agents,
      currentIndex: state?.currentIndex ?? 0,
      total: agents.reduce((sum, a) => sum + a.totalLeads, 0),
    };
  }

  async upsertRoundRobinAgent(data: {
    id?: string;
    name: string;
    phoneNumber: string;
    orderIndex: number;
    isActive?: boolean;
  }) {
    if (data.id) {
      return this.prisma.roundRobinAgent.update({
        where: { id: data.id },
        data,
      });
    }
    return this.prisma.roundRobinAgent.create({ data });
  }

  async deleteRoundRobinAgent(id: string) {
    return this.prisma.roundRobinAgent.delete({ where: { id } });
  }
}
