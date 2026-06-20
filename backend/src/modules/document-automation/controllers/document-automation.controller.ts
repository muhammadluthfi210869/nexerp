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
} from '@nestjs/common';
import { Response } from 'express';
import { DocumentAutomationService } from '../services/document-automation.service';
import { PdfEngineService } from '../services/pdf-engine.service';
import { ApproveDraftDto, RejectDraftDto, UpdateDraftDto, FilterDraftsDto } from '../dto/draft.dto';

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
  async approveDraft(
    @Param('id') id: string,
    @Body() dto: ApproveDraftDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.docAutomationService.approveDraft(id, dto, userId);
  }

  @Post('drafts/:id/reject')
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
