import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';

@Injectable()
export class AutoGreetService {
  private readonly logger = new Logger(AutoGreetService.name);

  constructor(private prisma: PrismaService) {}

  async sendAutoGreeting(leadId: string, busdevName: string): Promise<void> {
    // Nonaktif secara default (permintaan Direktur & Head Marketing agar tidak ada sambutan otomatis/AI)
    if (process.env.AUTO_GREET_ENABLED !== 'true') {
      this.logger.log(
        `[AUTO-GREET] Auto-greeting dinonaktifkan (lead ${leadId})`,
      );
      return;
    }

    const lead = await this.prisma.leadCapture.findUnique({
      where: { id: leadId },
    });
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
