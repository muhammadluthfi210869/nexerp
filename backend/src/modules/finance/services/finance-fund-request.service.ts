import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { FundRequestStatus, Division, StreamEventType } from '@prisma/client';
import {
  CreateFundRequestDto,
  ApproveFundRequestDto,
  DisburseFundRequestDto,
  DirectorApproveFundRequestDto,
  RejectFundRequestDto,
} from '../dto/fund-request.dto';
import { ACTIVITY_EVENT } from '../../activity-stream/events/activity.events';

@Injectable()
export class FinanceFundRequestService {
  private readonly logger = new Logger(FinanceFundRequestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Create a new Fund Request (OPEX Protocol / Petty Cash).
   */
  async createFundRequest(requesterId: string, dto: CreateFundRequestDto) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { roles: true },
    });
    const isHead = requester?.roles?.some((r) =>
      ['HEAD_OPS', 'DIRECTOR', 'SUPER_ADMIN', 'FINANCE'].includes(r),
    );

    // Requirement 7.2:
    // If Staff -> must be approved by Head first (PENDING_APPROVAL_MGR)
    // If Head -> bypass Head approval, straight to Accounting/Dir (APPROVED_BY_MGR)
    const status = isHead
      ? FundRequestStatus.APPROVED_BY_MGR
      : FundRequestStatus.PENDING_APPROVAL_MGR;

    const created = await this.prisma.fundRequest.create({
      data: {
        requesterId,
        departmentId: dto.departmentId,
        amount: dto.amount,
        reason: dto.reason,
        attachmentUrls: dto.attachmentUrls || [],
        status,
      },
    });

    this.eventEmitter.emit('fund_request.created', {
      fundRequestId: created.id,
      requesterId,
      amount: Number(created.amount),
      departmentId: created.departmentId,
      reason: created.reason,
    });

    return created;
  }

  /**
   * Get all fund requests with optional filter for a specific user.
   */
  async getAllFundRequests(userId?: string) {
    const where: any = {};
    if (userId) {
      where.OR = [{ requesterId: userId }, { approvedById: userId }];
    }
    return this.prisma.fundRequest.findMany({
      where,
      include: { requester: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Alias for getAllFundRequests to satisfy canonical interface queries.
   */
  async getFundRequests(userId?: string) {
    return this.getAllFundRequests(userId);
  }

  /**
   * Get fund requests created by the specified user.
   */
  async getMyFundRequests(userId: string) {
    return this.prisma.fundRequest.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single fund request by ID with relations.
   */
  async getFundRequestById(id: string) {
    const req = await this.prisma.fundRequest.findUnique({
      where: { id },
      include: {
        requester: true,
        approver: true,
        disburser: true,
      },
    });
    if (!req) {
      throw new NotFoundException('Fund Request not found');
    }
    return req;
  }

  /**
   * Manager Approval for Fund Request.
   * Enforces Maker-Checker Segregation of Duties (SOD_VIOLATION).
   */
  async approveFundRequest(id: string, dto: ApproveFundRequestDto) {
    const req = await this.prisma.fundRequest.findUnique({ where: { id } });
    if (!req) {
      throw new NotFoundException('Fund Request not found');
    }

    if (req.status === FundRequestStatus.REJECTED || req.status === FundRequestStatus.PAID) {
      throw new ConflictException(
        `Cannot approve a fund request that is already ${req.status}`,
      );
    }

    if (req.requesterId === dto.approvedById) {
      throw new BadRequestException(
        'Maker-checker violation: requester cannot approve their own fund request. [SOD_VIOLATION]',
      );
    }

    const updated = await this.prisma.fundRequest.update({
      where: { id },
      data: {
        status: FundRequestStatus.APPROVED_BY_MGR,
        approvedById: dto.approvedById,
      },
    });

    this.eventEmitter.emit('fund_request.approved', {
      fundRequestId: id,
      approverId: dto.approvedById,
      level: 'MANAGER',
    });

    return updated;
  }

  /**
   * Director Approval for Fund Request.
   * Enforces Maker-Checker Segregation of Duties (SOD_VIOLATION).
   */
  async directorApproveFundRequest(
    id: string,
    dto: DirectorApproveFundRequestDto,
  ) {
    const req = await this.prisma.fundRequest.findUnique({ where: { id } });
    if (!req) {
      throw new NotFoundException('Fund Request not found');
    }

    if (req.status === FundRequestStatus.REJECTED || req.status === FundRequestStatus.PAID) {
      throw new ConflictException(
        `Cannot approve a fund request that is already ${req.status}`,
      );
    }

    if (req.requesterId === dto.approvedById) {
      throw new BadRequestException(
        'Maker-checker violation: requester cannot approve their own fund request. [SOD_VIOLATION]',
      );
    }

    const updated = await this.prisma.fundRequest.update({
      where: { id },
      data: {
        status: FundRequestStatus.APPROVED_BY_DIR,
        approvedById: dto.approvedById,
      },
    });

    this.eventEmitter.emit('fund_request.approved', {
      fundRequestId: id,
      approverId: dto.approvedById,
      level: 'DIRECTOR',
    });

    return updated;
  }

  /**
   * Reject a Fund Request with reason.
   */
  async rejectFundRequest(id: string, dto: RejectFundRequestDto) {
    const req = await this.prisma.fundRequest.findUnique({ where: { id } });
    if (!req) {
      throw new NotFoundException('Fund Request not found');
    }

    if (req.status === FundRequestStatus.PAID) {
      throw new ConflictException('Cannot reject a fund request that has already been disbursed.');
    }

    const updated = await this.prisma.fundRequest.update({
      where: { id },
      data: {
        status: FundRequestStatus.REJECTED,
        rejectReason: dto.reason,
      },
    });

    this.eventEmitter.emit('fund_request.rejected', {
      fundRequestId: id,
      reason: dto.reason,
    });

    return updated;
  }

  /**
   * Disburse Fund Request & post balanced double-entry accounting journal automatically.
   * Enforces Maker-Checker Segregation of Duties (SOD_VIOLATION).
   */
  async disburseFundRequest(id: string, dto: DisburseFundRequestDto) {
    return this.prisma.$transaction(async (tx) => {
      const req = await tx.fundRequest.findUnique({
        where: { id },
        include: { requester: true },
      });

      if (!req) {
        throw new NotFoundException('Fund Request not found');
      }

      if (req.status === FundRequestStatus.PAID) {
        throw new ConflictException('Fund Request is already disbursed and paid.');
      }

      if (req.requesterId === dto.disbursedById) {
        throw new BadRequestException(
          'Maker-checker violation: requester cannot disburse their own fund request. [SOD_VIOLATION]',
        );
      }

      // Validate Source Cash/Bank account
      const cashAcc = await tx.account.findUnique({
        where: { id: dto.accountId },
      });
      if (!cashAcc) {
        throw new BadRequestException('Source Bank/Cash account not found');
      }

      // Find expense account: use departmentId as account code prefix
      // e.g., department "MARKETING" maps to account code starting with "6" and name containing "MARKETING"
      const expenseAcc = await tx.account.findFirst({
        where: {
          code: { startsWith: '6' },
          OR: [
            { name: { contains: req.departmentId } },
            { code: { contains: req.departmentId } },
          ],
        },
      });

      // Fallback: if no specific expense account found, use general expense account
      if (!expenseAcc) {
        const generalExpense = await tx.account.findFirst({
          where: {
            code: { startsWith: '6' },
            OR: [
              { name: { contains: 'General', mode: 'insensitive' } },
              { name: { contains: 'Umum', mode: 'insensitive' } },
              { name: { contains: 'Operasional', mode: 'insensitive' } },
            ],
          },
        });

        if (generalExpense) {
          // Create journal with general expense + note
          const updated = await tx.fundRequest.update({
            where: { id },
            data: {
              status: FundRequestStatus.PAID,
              disbursedById: dto.disbursedById,
            },
          });

          await tx.journalEntry.create({
            data: {
              date: new Date(),
              reference: `FUND-DISB-${req.id.substring(0, 8)}`,
              description: `Disbursement for Fund Request: ${req.reason} [Dept: ${req.departmentId}] — No specific expense account found, used General`,
              lines: {
                create: [
                  {
                    accountId: generalExpense.id,
                    debit: req.amount,
                    credit: 0,
                  },
                  { accountId: cashAcc.id, debit: 0, credit: req.amount },
                ],
              },
            },
          });

          this.eventEmitter.emit('fund_request.disbursed', {
            fundRequestId: id,
            disbursedById: dto.disbursedById,
            amount: Number(req.amount),
          });

          return updated;
        }

        throw new BadRequestException(
          `Akun beban untuk departemen ${req.departmentId} tidak ditemukan. Buat akun beban dengan kode diawali '6' dan nama mengandung '${req.departmentId}'.`,
        );
      }

      // Create Journal
      await tx.journalEntry.create({
        data: {
          date: new Date(),
          reference: `FUND-DISB-${req.id.substring(0, 8)}`,
          description: `Disbursement for Fund Request: ${req.reason} [ID: ${req.id}]`,
          lines: {
            create: [
              { accountId: expenseAcc.id, debit: req.amount, credit: 0 },
              { accountId: cashAcc.id, debit: 0, credit: req.amount },
            ],
          },
        },
      });

      // Update Fund Request status
      const updated = await tx.fundRequest.update({
        where: { id },
        data: {
          status: FundRequestStatus.PAID,
          disbursedById: dto.disbursedById,
        },
      });

      this.eventEmitter.emit('fund_request.disbursed', {
        fundRequestId: id,
        disbursedById: dto.disbursedById,
        amount: Number(req.amount),
      });

      return updated;
    });
  }

  /**
   * Event handler for fund request creation notifications.
   */
  @OnEvent('fund_request.created')
  async onFundRequestCreated(payload: {
    fundRequestId: string;
    requesterId: string;
    amount: number;
    departmentId: string;
    reason?: string;
  }) {
    this.logger.log(
      `[FUND_REQUEST_EVENT] New Fund Request ${payload.fundRequestId} created by ${payload.requesterId} for Rp ${payload.amount.toLocaleString()} (Dept: ${payload.departmentId})`,
    );
  }
}
