import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma/prisma.service';
import { EncryptionService } from '../../../shared/encryption.service';
import { GeofencingService } from '../../../shared/geofencing.service';
import {
  AttendanceStatus,
  TicketType,
  TicketStatus,
  FundRequestStatus,
  Prisma,
} from '@prisma/client';

@Injectable()
export class HrAttendanceService {
  private readonly logger = new Logger(HrAttendanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly geofencing: GeofencingService,
  ) {}

  // --- ATTENDANCE & GEOFENCING ---

  async clockIn(employeeId: string, lat: number, lng: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    if (!employee.isActive)
      throw new ForbiddenException('Employee is not active');

    // Duplicate check: already clocked in today without clock-out
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingToday = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        clockIn: { gte: today },
        clockOut: null,
      },
    });
    if (existingToday) {
      throw new BadRequestException(
        'Already clocked in today, clock out first',
      );
    }

    // Check if on leave
    const activeLeave = await this.prisma.ticket.findFirst({
      where: {
        employeeId,
        type: 'LEAVE',
        status: 'APPROVED',
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });
    if (activeLeave) {
      throw new ForbiddenException('Employee is on approved leave');
    }

    // Geofence
    const config = await this.prisma.systemConfig.findMany({
      where: {
        key: {
          in: [
            'FACTORY_LAT',
            'FACTORY_LNG',
            'WORK_START_HOUR',
            'WORK_START_MINUTE',
          ],
        },
      },
    });

    const factoryLat = parseFloat(
      config.find((c) => c.key === 'FACTORY_LAT')?.value || '0',
    );
    const factoryLng = parseFloat(
      config.find((c) => c.key === 'FACTORY_LNG')?.value || '0',
    );

    const geo = this.geofencing.isWithinRadius(
      lat,
      lng,
      factoryLat,
      factoryLng,
      50,
    );

    // Determine status: if outside geofence, record as OUTSIDE_GEOFENCE instead of rejecting
    const status = geo.isWithin
      ? AttendanceStatus.ON_TIME
      : AttendanceStatus.OUTSIDE_GEOFENCE;

    // Lateness detection
    const workStartHour = parseInt(
      config.find((c) => c.key === 'WORK_START_HOUR')?.value || '8',
    );
    const workStartMinute = parseInt(
      config.find((c) => c.key === 'WORK_START_MINUTE')?.value || '0',
    );
    const now = new Date();
    const startThreshold = new Date(now);
    startThreshold.setHours(workStartHour, workStartMinute, 0, 0);

    const finalStatus =
      status === AttendanceStatus.OUTSIDE_GEOFENCE
        ? AttendanceStatus.OUTSIDE_GEOFENCE
        : now > startThreshold
          ? AttendanceStatus.LATE
          : AttendanceStatus.ON_TIME;

    return this.prisma.attendance.create({
      data: {
        employeeId,
        clockIn: now,
        lat,
        lng,
        distanceFromFactory: geo.distance,
        status: finalStatus,
      },
    });
  }

  async clockOut(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeAttendance = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        clockIn: { gte: today },
        clockOut: null,
      },
    });
    if (!activeAttendance) {
      throw new BadRequestException('No active clock-in found for today');
    }

    return this.prisma.attendance.update({
      where: { id: activeAttendance.id },
      data: { clockOut: new Date() },
    });
  }

  // --- EMPLOYEE ATTENDANCE STATS ---

  async getEmployeeAttendance(employeeId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const records = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = records.length;
    const onTime = records.filter((r) => r.status === 'ON_TIME').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const outside = records.filter(
      (r) => r.status === 'OUTSIDE_GEOFENCE',
    ).length;

    return {
      total,
      onTime,
      late,
      outside,
      disciplineRate: total > 0 ? Math.round((onTime / total) * 100) : 0,
      records,
    };
  }

  // --- ATTENDANCE OVERVIEW / LISTING ---

  async getAttendanceRecords(date?: string, employeeId?: string) {
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      clockIn: { gte: startOfDay, lte: endOfDay },
    };
    if (employeeId) where.employeeId = employeeId;

    return this.prisma.attendance.findMany({
      where,
      include: {
        employee: {
          include: {
            roles: { where: { isPrimary: true } },
          },
        },
      },
      orderBy: { clockIn: 'desc' },
    });
  }

  // --- TICKETS LIFECYCLE & REIMBURSEMENT AUTO-TRIGGER (BUS-RULE-075) ---

  async createTicket(dto: {
    employeeId: string;
    type: TicketType;
    reason: string;
    startDate: string;
    endDate?: string;
    amount?: string;
  }) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    return this.prisma.ticket.create({
      data: {
        employeeId: dto.employeeId,
        type: dto.type,
        reason: dto.reason,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        amount: dto.amount ? this.encryption.encrypt(dto.amount) : null,
        status: TicketStatus.PENDING,
      },
      include: { employee: true },
    });
  }

  async approveTicket(id: string, authorizedById: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (ticket.status !== TicketStatus.PENDING) {
      throw new BadRequestException('Ticket is not in PENDING status');
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.APPROVED,
        authorizedById,
      },
      include: { employee: true, approver: true },
    });

    // BUS-RULE-075: Reimburse approved -> auto-trigger Kas Bank Keluar (FundRequest)
    if (ticket.type === TicketType.REIMBURSE && ticket.amount) {
      const rawAmount = this.encryption.decrypt(ticket.amount);
      const amountVal = parseFloat(rawAmount || '0');

      const requesterId = ticket.employee.userId || authorizedById;
      if (requesterId) {
        await this.prisma.fundRequest.create({
          data: {
            requesterId,
            departmentId: 'HR',
            amount: new Prisma.Decimal(amountVal),
            reason: `Reimbursement auto-trigger: ${ticket.reason} (Ticket ${ticket.id})`,
            status: FundRequestStatus.WAITING_FINANCE_DISBURSEMENT,
            approvedById: authorizedById,
          },
        });
      }
    }

    return updatedTicket;
  }

  async rejectTicket(id: string, authorizedById: string, reason?: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.REJECTED,
        authorizedById,
      },
    });
  }

  async getTickets(query?: {
    employeeId?: string;
    status?: TicketStatus;
    type?: TicketType;
  }) {
    const where: any = {};
    if (query?.employeeId) where.employeeId = query.employeeId;
    if (query?.status) where.status = query.status;
    if (query?.type) where.type = query.type;

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: { employee: { include: { roles: true } }, approver: true },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map((t) => ({
      ...t,
      amount: t.amount ? this.encryption.decrypt(t.amount) : null,
    }));
  }
}
