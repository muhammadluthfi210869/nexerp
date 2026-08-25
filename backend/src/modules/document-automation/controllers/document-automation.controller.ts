import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { DocumentAutomationService } from '../services/document-automation.service';
import { PdfEngineService } from '../services/pdf-engine.service';
import { ApproveDraftDto, RejectDraftDto, UpdateDraftDto, FilterDraftsDto } from '../dto/draft.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

// Pre-R4 hardening: document-automation had no authz on any endpoint.
// Drafts/:id/approve routes through createInvoiceFromDraft, which writes
// a real Invoice row. Anyone with network access could trigger invoice
// creation. Auth + role guard applied at controller level.
@ApiTags('document-automation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('document-automation')
export class DocumentAutomationController {
  constructor(
    private readonly docAutomationService: DocumentAutomationService,
    private readonly pdfService: PdfEngineService,
  ) {}

  @Get('drafts')
  async findAll(@Query() filters: FilterDraftsDto) {
    return this.docAutomationService.findAll(filters);
  }

  @Get('drafts/stats')
  async getStats() {
    return this.docAutomationService.getStats();
  }

  @Get('drafts/:id')
  async findOne(@Param('id') id: string) {
    return this.docAutomationService.findOne(id);
  }

  // R4-DOC-COMPLETENESS: HTML preview endpoint (bypasses PDF for evidence generation)
  @Get('drafts/:id/html')
  async downloadDraftHtml(@Param('id') id: string, @Res() res: Response) {
    const draft = await this.docAutomationService.findOne(id);
    const html = (this.pdfService as any).renderTemplatePublic
      ? (this.pdfService as any).renderTemplatePublic(draft.documentType, draft.payload as Record<string, any>, draft.draftNumber)
      : (this.pdfService as any).renderTemplate?.(draft.documentType, draft.payload as Record<string, any>, draft.draftNumber)
        || `<html><body><pre>${JSON.stringify(draft.payload, null, 2)}</pre></body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('drafts/:id/pdf')
  async downloadDraftPdf(@Param('id') id: string, @Res() res: Response) {
    const draft = await this.docAutomationService.findOne(id);
    const pdfBuffer = await this.pdfService.generatePdf(
      draft.documentType,
      draft.payload as Record<string, any>,
      draft.draftNumber,
    );

    const filename = `${draft.draftNumber}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(pdfBuffer);
  }

  @Patch('drafts/:id')
  async updateDraft(
    @Param('id') id: string,
    @Body() dto: UpdateDraftDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.docAutomationService.updateDraft(id, dto, userId);
  }

  @Post('drafts/:id/approve')
  // Pre-R4 micro-gate: consequential mutation that routes to createInvoiceFromDraft
  // (writes a real Invoice row). Require explicit role.
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.DIRECTOR,
    UserRole.HEAD_OPS,
    UserRole.COMMERCIAL,
    UserRole.FINANCE,
  )
  async approveDraft(
    @Param('id') id: string,
    @Body() dto: ApproveDraftDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.docAutomationService.approveDraft(id, dto, userId);
  }

  @Post('drafts/:id/reject')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.DIRECTOR,
    UserRole.HEAD_OPS,
    UserRole.COMMERCIAL,
    UserRole.FINANCE,
  )
  async rejectDraft(
    @Param('id') id: string,
    @Body() dto: RejectDraftDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.docAutomationService.rejectDraft(id, dto, userId);
  }

  @Post('process-auto-approvals')
  @HttpCode(HttpStatus.OK)
  async processAutoApprovals() {
    return this.docAutomationService.processAutoApprovals();
  }

  @Post('generate/quotation/:leadId')
  async generateQuotation(@Param('leadId') leadId: string) {
    return this.docAutomationService.generateQuotationDraft(leadId);
  }

  @Post('generate/dp-invoice/:salesOrderId')
  async generateDpInvoice(@Param('salesOrderId') salesOrderId: string) {
    return this.docAutomationService.generateDpInvoiceDraft(salesOrderId);
  }

  @Post('generate/final-invoice/:workOrderId')
  async generateFinalInvoice(@Param('workOrderId') workOrderId: string) {
    return this.docAutomationService.generateFinalInvoiceDraft(workOrderId);
  }

  @Post('generate/goods-requirement/:salesOrderId')
  async generateGoodsRequirement(@Param('salesOrderId') salesOrderId: string) {
    return this.docAutomationService.generateGoodsRequirementDraft(salesOrderId);
  }

  @Post('generate/delivery-order/:workOrderId')
  async generateDeliveryOrder(@Param('workOrderId') workOrderId: string) {
    return this.docAutomationService.generateDeliveryOrderDraft(workOrderId);
  }

  @Post('generate/surat-jalan/:deliveryOrderId')
  async generateSuratJalan(@Param('deliveryOrderId') deliveryOrderId: string) {
    return this.docAutomationService.generateSuratJalanDraft(deliveryOrderId);
  }

  // R4-DOC-COMPLETENESS: new generation routes for PO, GR, SO, Batch Record
  @Post('generate/purchase-order/:poId')
  async generatePurchaseOrder(@Param('poId') poId: string) {
    return this.docAutomationService.generatePurchaseOrderDraft(poId);
  }

  @Post('generate/goods-receipt/:inboundId')
  async generateGoodsReceipt(@Param('inboundId') inboundId: string) {
    return this.docAutomationService.generateGoodsReceiptDraft(inboundId);
  }

  @Post('generate/sales-order/:soId')
  async generateSalesOrder(@Param('soId') soId: string) {
    return this.docAutomationService.generateSalesOrderDraft(soId);
  }

  @Post('generate/batch-record/:workOrderId')
  async generateBatchRecord(@Param('workOrderId') workOrderId: string) {
    return this.docAutomationService.generateBatchRecordDraft(workOrderId);
  }

  // R4-DOC-COMPLETENESS: QC + Fund Request renderers (Path C, smallest)
  @Post('generate/qc-report/:qcAuditId')
  async generateQcReport(@Param('qcAuditId') qcAuditId: string) {
    return this.docAutomationService.generateQcReportDraft(qcAuditId);
  }

  @Post('generate/fund-request/:fundRequestId')
  async generateFundRequest(@Param('fundRequestId') fundRequestId: string) {
    return this.docAutomationService.generateFundRequestDraft(fundRequestId);
  }

  @Post('pdf')
  @HttpCode(HttpStatus.OK)
  async generatePdfDirect(
    @Body() body: { documentType: string; data: Record<string, any>; documentNumber: string },
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.pdfService.generatePdf(
      body.documentType,
      body.data,
      body.documentNumber,
    );
    const filename = `${body.documentNumber}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(pdfBuffer);
  }
}
