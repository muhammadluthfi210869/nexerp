import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CompanyInfo, DEFAULT_COMPANY } from '../templates/common.template';
import {
  renderQuotation,
  renderSalesOrder,
  renderInvoiceProduksi,
  renderKwitansi,
} from '../templates/commercial.template';
import {
  renderBatchRecord,
  renderScheduleMixing,
  renderSchedulePackaging,
} from '../templates/manufacturing.template';
import {
  renderDeliveryOrder,
  renderGoodsTransfer,
  renderPoWarehouseCopy,
  renderSuratJalan,
} from '../templates/warehouse.template';
import {
  renderGoodsRequest,
  renderStockOpname,
} from '../templates/landscape.template';
import {
  renderSalesSample,
  renderRequestCogs,
} from '../templates/rnd.template';
import {
  renderJournalEntry,
  renderGenericDocument,
} from '../templates/finance.template';

@Injectable()
export class PdfEngineService {
  private readonly logger = new Logger(PdfEngineService.name);

  async generatePdf(
    documentType: string,
    data: Record<string, any>,
    documentNumber: string,
  ): Promise<Buffer> {
    const isLandscape = this.isLandscapeDoc(documentType);
    const html = this.renderTemplate(documentType, data, documentNumber);
    return this.htmlToPdf(html, isLandscape);
  }

  private isLandscapeDoc(documentType: string): boolean {
    const landscapeTypes = [
      'GOODS_REQUIREMENT',
      'GOODS_REQUEST',
      'PERMINTAAN_BARANG',
      'STOCK_OPNAME',
    ];
    return landscapeTypes.includes(documentType);
  }

  public renderTemplate(
    documentType: string,
    data: Record<string, any>,
    documentNumber: string,
  ): string {
    const company: CompanyInfo = data.companyInfo || DEFAULT_COMPANY;
    const typeUpper = (documentType || '').toUpperCase();

    switch (typeUpper) {
      // 1. Commercial Documents
      case 'QUOTATION':
        return renderQuotation(data, documentNumber, company);
      case 'SALES_ORDER':
        return renderSalesOrder(data, documentNumber, company);
      case 'INVOICE_DP':
      case 'INVOICE_FINAL':
      case 'INVOICE_PRODUKSI':
      case 'INVOICE':
        return renderInvoiceProduksi(data, documentNumber, company);
      case 'KWITANSI':
      case 'RECEIPT_KWITANSI':
      case 'PAYMENT_RECEIPT':
        return renderKwitansi(data, documentNumber, company);

      // 2. Manufacturing Documents
      case 'BATCH_RECORD':
      case 'WORK_ORDER':
        return renderBatchRecord(data, documentNumber, company);
      case 'SCHEDULE_MIXING':
      case 'JADWAL_MIXING':
        return renderScheduleMixing(data, documentNumber, company);
      case 'SCHEDULE_PACKAGING':
      case 'JADWAL_PACKAGING':
        return renderSchedulePackaging(data, documentNumber, company);

      // 3. Warehouse & SCM Documents
      case 'DELIVERY_ORDER':
      case 'BUKTI_PENGIRIMAN':
        return renderDeliveryOrder(data, documentNumber, company);
      case 'SURAT_JALAN':
        return renderSuratJalan(data, documentNumber, company);
      case 'GOODS_TRANSFER':
      case 'TRANSFER_BARANG':
      case 'PINDAH_GUDANG':
        return renderGoodsTransfer(data, documentNumber, company);
      case 'PURCHASE_ORDER':
      case 'PO_WAREHOUSE':
      case 'PO_WAREHOUSE_COPY':
        return renderPoWarehouseCopy(data, documentNumber, company);
      case 'PURCHASE_REQUEST':
      case 'GOODS_REQUIREMENT':
      case 'GOODS_REQUEST':
      case 'PERMINTAAN_BARANG':
        return renderGoodsRequest(data, documentNumber, company);
      case 'STOCK_OPNAME':
        return renderStockOpname(data, documentNumber, company);

      // 4. R&D Documents
      case 'SALES_SAMPLE':
      case 'SAMPLE_FORM':
        return renderSalesSample(data, documentNumber, company);
      case 'REQUEST_COGS':
      case 'HPP_REQUEST':
        return renderRequestCogs(data, documentNumber, company);

      // 5. Accounting Documents
      case 'JOURNAL_ENTRY':
      case 'JURNAL_UMUM':
        return renderJournalEntry(data, documentNumber, company);

      default:
        return renderGenericDocument(data, documentNumber, documentType, company);
    }
  }

  private createDeterministicPdf(summary: string): Buffer {
    const safeSummary = summary.replace(/[()\\]/g, '');
    const content = `BT /F1 12 Tf 50 750 Td (${safeSummary}) Tj ET`;
    const streamLen = Buffer.byteLength(content, 'utf-8');
    const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${streamLen} >> stream
${content}
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000300 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
377
%%EOF`;
    return Buffer.from(pdf, 'utf-8');
  }

  private async htmlToPdf(html: string, landscape = false): Promise<Buffer> {
    if (process.env.FAST_PDF === '1') {
      return this.createDeterministicPdf('NEX ERP Deterministic Document Snapshot');
    }

    let pdfBuffer: Buffer;
    try {
      const htmlPdfNode = await import('html-pdf-node');
      const file = { content: html };
      const options = {
        format: 'A4',
        landscape,
        margin: { top: '8mm', right: '10mm', bottom: '8mm', left: '10mm' },
        printBackground: true,
      };
      pdfBuffer = await htmlPdfNode.default.generatePdf(file, options);
    } catch (error) {
      this.logger.error(`PDF render failed: ${error}`);
      throw new ServiceUnavailableException(
        'PDF renderer unavailable — dokumen tidak dapat dibuat. Hubungi administrator (cek Chromium di server).',
      );
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      this.logger.error('PDF renderer returned an empty buffer');
      throw new ServiceUnavailableException(
        'PDF renderer returned no document — dokumen tidak dapat dibuat.',
      );
    }
    return pdfBuffer;
  }
}
