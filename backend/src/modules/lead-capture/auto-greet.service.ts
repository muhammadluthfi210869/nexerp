import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';

@Injectable()
export class AutoGreetService {
  private readonly logger = new Logger(AutoGreetService.name);

  constructor(private prisma: PrismaService) {}

  async sendAutoGreeting(leadId: string, busdevName: string): Promise<void> {
    const lead = await this.prisma.leadCapture.findUnique({ where: { id: leadId } });
    if (!lead) return;

    const message = `Halo! Saya ${busdevName} dari Dreamlab. Boleh tau nama Anda?`;

    await this.prisma.leadMessage.create({
      data: {
        leadId,
        direction: 'OUTBOUND',
        body: message,
      },
    });

    this.logger.log(`[AUTO-GREET] Sent to ${lead.phone}: ${message}`);
  }
}
