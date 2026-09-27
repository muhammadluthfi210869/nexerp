import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { AdvanceLeadDto } from './dto/advance-lead.dto';
import {
  WorkflowStatus,
  SampleStage,
  LostReason,
  SOStatus,
  StreamEventType,
  Division,
} from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ACTIVITY_EVENT } from '../activity-stream/events/activity.events';
import { IdGeneratorService } from '../system/id-generator.service';
import { LeadService } from './services/lead.service';
import { PipelineService } from './services/pipeline.service';
import { AnalyticsService } from './services/analytics.service';
import { RetentionService } from './services/retention.service';

@Injectable()
export class BussdevService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private idGenerator: IdGeneratorService,
    private leadService: LeadService,
    private pipelineService: PipelineService,
    private analyticsService: AnalyticsService,
    private retentionService: RetentionService,
  ) {}

  // --- DELEGATED TO SUB-SERVICES (BACKWARD COMPATIBILITY) ---

  async createLead(dto: CreateLeadDto) {
    return this.leadService.createLead(dto, {
      userId: 'SYSTEM',
      organizationId: 'SYSTEM',
      roles: ['SUPER_ADMIN'],
      correlationId: 'LEGACY_CALL',
    });
  }

  async advanceLeadStage(id: string, dto: AdvanceLeadDto) {
    return this.leadService.advanceLeadStage(id, dto);
  }

  async updateLeadStatus(
    id: string,
    status: WorkflowStatus,
    reason?: LostReason,
    _loggedBy?: string,
  ) {
    return this.leadService.updateLeadStatus(id, status, reason);
  }

  async getPageAnalytics(
    group: 'dashboard' | 'guest' | 'sample' | 'production' | 'ro' | 'lost',
  ) {
    return this.analyticsService.getPageAnalytics(group);
  }

  async getFunnelAnalytics(picId?: string) {
    return this.analyticsService.getFunnelAnalytics(picId);
  }

  async getGranularPipelineTable(picId?: string) {
    return this.analyticsService.getGranularPipelineTable(picId);
  }

  async getBDPerformance() {
    return this.analyticsService.getBDPerformance();
  }

  async getLostChurnTable() {
    return this.analyticsService.getLostChurnTable();
  }

  async getLeadsByGroup(
    group: 'guest' | 'sample' | 'production' | 'ro' | 'lost',
    _organizationId?: string,
  ) {
    return this.pipelineService.getLeadsByGroup(group);
  }

  async getLeads(_userId?: string) {
    return this.pipelineService.getLeads();
  }

  async getStaffs() {
    return this.pipelineService.getStaffs();
  }

  async getClientSamples() {
    return this.pipelineService.getClientSamples();
  }

  async shipSample(
    id: string,
    dto: { courierName: string; trackingNumber: string },
  ) {
    return this.pipelineService.shipSample(id, dto);
  }

  async submitSampleFeedback(
    id: string,
    dto: { rating: number; comment: string; status: 'APPROVED' | 'REVISION' },
  ) {
    return this.pipelineService.submitSampleFeedback(id, dto);
  }

  async logActivity(dto: {
    leadId: string;
    activityType: any;
    notes: string;
    productCategory?: any;
    estimatedMoq?: number;
    amount?: number;
    loggedBy?: string;
  }) {
    return this.leadService.logActivity(dto);
  }

  async convertGuestToLead(guestId: string) {
    return this.leadService.convertGuestToLead(guestId);
  }

  async emergencyOverride(leadId: string, note: string, loggedBy: string) {
    return this.leadService.emergencyOverride(leadId, note, loggedBy);
  }

  async getStuckLeads(_organizationId?: string) {
    return this.leadService.getStuckLeads();
  }

  async createTask(
    leadId: string,
    brief: string,
    soId?: string,
    taskType?: string,
  ) {
    return this.pipelineService.createTask(leadId, brief, soId, taskType);
  }

  async getActivityStream(leadId: string) {
    return this.leadService.getActivityStream(leadId);
  }

  async getLeadBalance(leadId: string) {
    return this.leadService.getLeadBalance(leadId);
  }

  async checkSalesOrderReadiness(leadId: string) {
    return this.pipelineService.checkSalesOrderReadiness(leadId);
  }

  async triggerRetentionCheck(leadId: string) {
    return this.retentionService.triggerRetentionCheck(leadId);
  }

  async getLeadById(id: string) {
    return this.leadService.getLeadByIdScoped(id, {
      userId: 'SYSTEM',
      organizationId: 'SYSTEM',
      roles: ['SUPER_ADMIN'],
      correlationId: 'LEGACY_CALL',
    });
  }

  async updateLead(id: string, dto: any) {
    return this.leadService.updateLeadScoped(id, dto, {
      userId: 'SYSTEM',
      organizationId: 'SYSTEM',
      roles: ['SUPER_ADMIN'],
      correlationId: 'LEGACY_CALL',
    });
  }

  async deleteLead(id: string) {
    return this.leadService.removeLead(id);
  }

  // --- SALES ORDER LIFECYCLE & GATES ---

  async updateSalesOrderStatus(
    soId: string,
    status: SOStatus,
    loggedBy: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.findUnique({
        where: { id: soId },
        include: { lead: true },
      });

      if (!so) throw new NotFoundException('Sales Order not found');

      // GATE: BOM Check for READY_TO_PRODUCE
      if (
        status === SOStatus.READY_TO_PRODUCE &&
        !so.lead.isEmergencyOverride
      ) {
        const sample = await tx.sampleRequest.findFirst({
          where: { leadId: so.leadId, stage: SampleStage.APPROVED },
          include: { billOfMaterials: { include: { material: true } } },
        });

        if (sample && sample.billOfMaterials.length > 0) {
          const shortageItems: string[] = [];
          for (const bom of sample.billOfMaterials) {
            const required = Number(so.quantity) * Number(bom.quantityPerUnit);
            const inventories = await tx.materialInventory.findMany({
              where: { materialId: bom.materialId },
            });
            const totalStock = inventories.reduce(
              (sum, inv) => sum + Number(inv.currentStock),
              0,
            );
            if (totalStock < required) {
              shortageItems.push(
                `${bom.material.name} (Butuh: ${required}, Ada: ${totalStock})`,
              );
            }
          }

          if (shortageItems.length > 0) {
            await tx.activityStream.create({
              data: {
                leadId: so.leadId,
                senderDivision: Division.SCM,
                eventType: StreamEventType.GATE_BLOCKED,
                notes: `BOM CHECK FAILED: Kekurangan material: ${shortageItems.join(', ')}`,
                loggedBy: 'SYSTEM_GATEKEEPER',
              },
            });
            throw new BadRequestException(
              `GATE_BLOCKED: Stok material belum lengkap: ${shortageItems.join(', ')}`,
            );
          }
        }
      }

      const updated = await tx.salesOrder.update({
        where: { id: soId },
        data: {
          status,
          stockStatus:
            status === SOStatus.READY_TO_PRODUCE ? 'READY' : 'PENDING_CHECK',
        },
      });

      await tx.activityStream.create({
        data: {
          leadId: so.leadId,
          senderDivision: Division.BD,
          eventType: StreamEventType.STATE_CHANGE,
          notes: `Status Sales Order berubah menjadi ${status}`,
          loggedBy: loggedBy || 'SYSTEM',
        },
      });

      return updated;
    });
  }

  // --- SAMPLE SALES CRUD ---

  async createSampleSales(dto: {
    customerId: string;
    productName: string;
    description?: string;
    qty: number;
    unitPrice: number;
    targetDeliveryDate?: string;
    notes?: string;
  }) {
    const customer = await this.prisma.salesLead.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new NotFoundException('Customer (Lead) not found');

    const sampleCode = await this.idGenerator.generateId('SMP');
    return this.prisma.sampleRequest.create({
      data: {
        sampleCode,
        leadId: dto.customerId,
        productName: dto.productName,
        targetFunction: dto.description || 'Sample Sales',
        textureReq: '-',
        colorReq: '-',
        aromaReq: '-',
        stage: SampleStage.QUEUE,
        targetHpp: dto.unitPrice,
        targetDeadline: dto.targetDeliveryDate
          ? new Date(dto.targetDeliveryDate)
          : undefined,
        currentExpectations: dto.notes,
      },
    });
  }

  // --- SAMPLE REQUEST CRUD ---

  async createSampleRequest(dto: {
    leadId: string;
    productName: string;
    targetFunction?: string;
    textureReq?: string;
    colorReq?: string;
    aromaReq?: string;
    targetHpp?: number;
  }) {
    const lead = await this.prisma.salesLead.findUnique({
      where: { id: dto.leadId },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const sampleCode = await this.idGenerator.generateId('SMP');
    return this.prisma.sampleRequest.create({
      data: {
        sampleCode,
        leadId: dto.leadId,
        productName: dto.productName,
        targetFunction: dto.targetFunction || 'General',
        textureReq: dto.textureReq || '-',
        colorReq: dto.colorReq || '-',
        aromaReq: dto.aromaReq || '-',
        stage: SampleStage.QUEUE,
        targetHpp: dto.targetHpp,
      },
    });
  }

  async updateSampleRequest(id: string, dto: any) {
    const sample = await this.prisma.sampleRequest.findUnique({
      where: { id },
    });
    if (!sample) throw new NotFoundException('Sample request not found');

    return this.prisma.sampleRequest.update({
      where: { id },
      data: {
        productName: dto.productName ?? sample.productName,
        targetFunction: dto.targetFunction ?? sample.targetFunction,
        textureReq: dto.textureReq ?? sample.textureReq,
        colorReq: dto.colorReq ?? sample.colorReq,
        aromaReq: dto.aromaReq ?? sample.aromaReq,
        stage: dto.stage ?? sample.stage,
        targetHpp: dto.targetHpp ?? sample.targetHpp,
        targetDeadline: dto.targetDeadline
          ? new Date(dto.targetDeadline)
          : sample.targetDeadline,
        currentExpectations:
          dto.currentExpectations ?? sample.currentExpectations,
      },
    });
  }

  async approveSample(dto: {
    sampleId: string;
    approvedBy: string;
    notes?: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const sample = await tx.sampleRequest.findUnique({
        where: { id: dto.sampleId },
        include: { lead: true },
      });
      if (!sample) throw new NotFoundException('Sample request not found');

      const updated = await tx.sampleRequest.update({
        where: { id: dto.sampleId },
        data: {
          stage: SampleStage.APPROVED,
          isApprovedByClient: true,
          clientRating: 5,
          clientComment: dto.notes || 'Approved by internal',
        },
      });

      await tx.salesLead.update({
        where: { id: sample.leadId },
        data: { status: WorkflowStatus.SAMPLE_APPROVED },
      });

      await tx.leadTimelineLog.create({
        data: {
          leadId: sample.leadId,
          action: 'SAMPLE_APPROVED_INTERNAL',
          notes: `Sample ${sample.sampleCode} approved by ${dto.approvedBy}. ${dto.notes || ''}`,
          loggedBy: dto.approvedBy,
        },
      });

      this.eventEmitter.emit(ACTIVITY_EVENT, {
        leadId: sample.leadId,
        senderDivision: Division.RND,
        eventType: StreamEventType.STATE_CHANGE,
        notes: `SAMPLE_APPROVED: Sampel ${sample.sampleCode} telah disetujui.`,
        loggedBy: dto.approvedBy,
      });

      return updated;
    });
  }

  // --- SALES ORDER CRUD ---

  async createSalesOrder(dto: {
    leadId: string;
    sampleId: string;
    totalAmount: number;
    quantity?: number;
    brandName?: string;
  }) {
    const lead = await this.prisma.salesLead.findUnique({
      where: { id: dto.leadId },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    const orderId = await this.idGenerator.generateId('SO');
    return this.prisma.salesOrder.create({
      data: {
        orderNumber: orderId,
        leadId: dto.leadId,
        sampleId: dto.sampleId,
        totalAmount: dto.totalAmount,
        quantity: dto.quantity || 1,
        brandName: dto.brandName || lead.brandName,
        status: 'PENDING_DP',
      },
    });
  }

  async getSalesOrders() {
    return this.prisma.salesOrder.findMany({
      include: {
        lead: {
          include: { pic: true },
        },
        sample: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
