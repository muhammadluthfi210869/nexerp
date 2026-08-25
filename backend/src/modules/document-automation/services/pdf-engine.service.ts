import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfEngineService {
  private readonly logger = new Logger(PdfEngineService.name);

  // ──────────────────────────────────────────────
  // Centralized formatters — never leak raw Date.toString / GMT strings.
  // ──────────────────────────────────────────────
  private formatDate(input: any): string {
    if (input == null || input === '' || input === '-') return '-';
    const d = this.toDate(input);
    if (!d) return '-';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }

  private formatDateTime(input: any): string {
    if (input == null || input === '' || input === '-') return '-';
    const d = this.toDate(input);
    if (!d) return '-';
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${this.formatDate(d)} • ${hh}:${mi} WIB`;
  }

  private toDate(input: any): Date | null {
    if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
    if (typeof input === 'string' || typeof input === 'number') {
      const parsed = new Date(input);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  }

  private formatMoney(n: number): string {
    if (!isFinite(n) || n === 0) return 'Rp 0';
    return `Rp ${Math.round(n).toLocaleString('id-ID')}`;
  }

  private nz(value: any, fallback: string = '-'): string {
    if (value == null) return fallback;
    const s = String(value).trim();
    return s === '' ? fallback : s;
  }

  async generatePdf(
    documentType: string,
    data: Record<string, any>,
    documentNumber: string,
  ): Promise<Buffer> {
    const html = this.renderTemplate(documentType, data, documentNumber);
    return this.htmlToPdf(html);
  }

  // Public alias for evidence generation (HTML preview without PDF conversion)
  renderTemplatePublic(
    documentType: string,
    data: Record<string, any>,
    documentNumber: string,
  ): string {
    return this.renderTemplate(documentType, data, documentNumber);
  }

  private renderTemplate(
    documentType: string,
    data: Record<string, any>,
    documentNumber: string,
  ): string {
    const logoPath = path.join(__dirname, '..', '..', '..', '..', 'assets', 'branding', 'dreamlab-logo.webp');
    let logoDataUri = '';
    try {
      const logoBuf = fs.readFileSync(logoPath);
      logoDataUri = 'data:image/webp;base64,' + logoBuf.toString('base64');
    } catch (e) {
      this.logger.warn(`Dreamlab logo not found at ${logoPath}; documents will render without it.`);
    }
    const companyInfo = {
      name: 'PT KARYA IMPIAN LABORATORIS',
      brand: 'DREAMLAB',
      address: process.env.COMPANY_ADDRESS || '',
      city: process.env.COMPANY_CITY || '',
      phone: process.env.COMPANY_PHONE || '',
      email: process.env.COMPANY_EMAIL || '',
      npwp: process.env.COMPANY_NPWP || '',
      logoDataUri,
    };

    // Ponytail: render contact line only when phone OR email is set; never print
    // a "Telp: - | Email: -" placeholder when both are absent.
    const contactLine = (() => {
      const p = this.nz(companyInfo.phone);
      const e = this.nz(companyInfo.email);
      if (!p && !e) return '';
      if (p && e) return `<p>Telp: ${p} | Email: ${e}</p>`;
      if (p) return `<p>Telp: ${p}</p>`;
      return `<p>Email: ${e}</p>`;
    })();

    const baseStyle = `
      <style>
        @page { size: A4; margin: 14mm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 14px; gap: 16px; }
        .brand-logo { max-height: 22mm; width: auto; display: block; }
        .company-info { flex: 1; }
        .company-info h1 { margin: 0 0 2px 0; font-size: 18px; color: #2563eb; line-height: 1.2; }
        .company-info p { margin: 1px 0; font-size: 10px; color: #555; }
        .doc-title { text-align: right; min-width: 180px; }
        .doc-title h2 { margin: 0; font-size: 19px; color: #1a1a1a; text-transform: uppercase; line-height: 1.2; }
        .doc-title .doc-subtitle { font-size: 11px; color: #555; margin-top: 2px; }
        .doc-title .doc-number { font-size: 12px; color: #2563eb; font-weight: bold; margin-top: 2px; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 11px; gap: 12px; }
        .meta-box { background: #f8fafc; padding: 8px 12px; border-radius: 4px; border: 1px solid #e2e8f0; flex: 1; }
        .meta-box p { margin: 2px 0; }
        .meta-box strong { color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
        th { background: #2563eb; color: white; padding: 6px 8px; text-align: left; font-weight: 600; font-size: 10px; }
        td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
        tr:nth-child(even) { background: #f8fafc; }
        .total-row { font-weight: bold; background: #eff6ff !important; }
        .total-row td { border-top: 2px solid #2563eb; }
        .footer { margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 9px; color: #666; }
        .signature { display: flex; justify-content: space-between; margin-top: 28px; gap: 20px; }
        .signature-box { width: 30%; text-align: center; font-size: 10px; }
        .signature-line { border-top: 1px solid #1a1a1a; margin-top: 36px; padding-top: 4px; }
        .notes { background: #fffbeb; border: 1px solid #fbbf24; border-radius: 4px; padding: 8px 12px; margin: 10px 0; font-size: 10px; }
        .section-h { font-size: 12px; margin: 14px 0 4px; color: #1a1a1a; font-weight: 600; }
      </style>
    `;

    const payload = data as Record<string, any>;
    const items = payload.items || [];

    const templateMap: Record<string, () => string> = {
      QUOTATION: () => this.quotationTemplate(companyInfo, contactLine, documentNumber, payload, items, baseStyle),
      INVOICE_DP: () => (payload.kind === 'FUND_REQUEST'
        ? this.fundRequestTemplate(companyInfo, contactLine, documentNumber, payload, baseStyle)
        : this.invoiceTemplate(companyInfo, contactLine, documentNumber, payload, items, baseStyle, 'DOWN PAYMENT (DP)')),
      INVOICE_FINAL: () => this.invoiceTemplate(companyInfo, contactLine, documentNumber, payload, items, baseStyle, 'FINAL PAYMENT'),
      DELIVERY_ORDER: () => this.deliveryOrderTemplate(companyInfo, contactLine, documentNumber, payload, baseStyle),
      SURAT_JALAN: () => this.suratJalanTemplate(companyInfo, contactLine, documentNumber, payload, baseStyle),
      PURCHASE_REQUEST: () => this.purchaseRequestTemplate(companyInfo, contactLine, documentNumber, payload, items, baseStyle),
      GOODS_REQUIREMENT: () => this.goodsRequirementTemplate(companyInfo, contactLine, documentNumber, payload, items, baseStyle),
      JOURNAL_ENTRY: () => this.journalTemplate(companyInfo, contactLine, documentNumber, payload, baseStyle),
      // DocumentType.PURCHASE_ORDER dispatched by payload.kind
      PURCHASE_ORDER: () => (payload.kind === 'GOODS_RECEIPT'
        ? this.goodsReceiptTemplate(companyInfo, contactLine, documentNumber, payload, baseStyle)
        : this.purchaseOrderTemplate(companyInfo, contactLine, documentNumber, payload, items, baseStyle)),
      SALES_ORDER: () => this.salesOrderTemplate(companyInfo, contactLine, documentNumber, payload, items, baseStyle),
      WORK_ORDER: () => (payload.kind === 'BATCH_RECORD'
        ? this.batchRecordTemplate(companyInfo, contactLine, documentNumber, payload, baseStyle)
        : payload.kind === 'QC_REPORT'
          ? this.qcReportTemplate(companyInfo, contactLine, documentNumber, payload, baseStyle)
          : this.goodsRequirementTemplate(companyInfo, contactLine, documentNumber, payload, items, baseStyle)),
    };

    const renderer = templateMap[documentType];
    if (!renderer) {
      return this.genericTemplate(companyInfo, contactLine, documentNumber, payload, baseStyle);
    }
    return renderer();
  }

  // ── Purchase Order ──────────────────────────────────────────────────────
  private purchaseOrderTemplate(
    companyInfo: any,
    contactLine: string,
    docNumber: string,
    payload: Record<string, any>,
    items: any[],
    baseStyle: string,
  ): string {
    const rows = items.map((it: any, idx: number) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${this.nz(it.materialName || it.productName || it.name)}</td>
        <td style="text-align:center">${this.nz(it.quantity || it.qty, '0')}</td>
        <td>${this.nz(it.uom, 'PCS')}</td>
        <td style="text-align:right">${this.formatMoney(Number(it.unitPrice || 0))}</td>
        <td style="text-align:right">${this.formatMoney(Number(it.subtotal || (Number(it.quantity || 0) * Number(it.unitPrice || 0))))}</td>
      </tr>`).join('');
    const subtotal = items.reduce((s: number, it: any) => s + Number(it.subtotal || (Number(it.quantity || 0) * Number(it.unitPrice || 0))), 0);
    const taxPercent = Number(payload.taxPercent || 0);
    const tax = subtotal * (taxPercent / 100);
    const total = subtotal + tax;
    const hasSupplierAddress = !!(payload.supplierAddress && payload.supplierAddress !== '-');
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
  <div class="header">
    <div class="company-info">
      <img class="brand-logo" src="${companyInfo.logoDataUri}" alt="${companyInfo.brand}"/>
      <h1>${companyInfo.name}</h1>
      <p>${this.nz(companyInfo.address)}</p>
      ${contactLine}
      ${companyInfo.npwp ? `<p>NPWP: ${companyInfo.npwp}</p>` : ''}
    </div>
    <div class="doc-title">
      <h2>PURCHASE ORDER</h2>
      <div class="doc-subtitle">Pesanan Pembelian</div>
      <div class="doc-number">${docNumber}</div>
    </div>
  </div>
  <div class="meta">
    <div class="meta-box">
      <p><strong>Supplier:</strong> ${this.nz(payload.supplierName)}</p>
      ${hasSupplierAddress ? `<p><strong>Alamat:</strong> ${payload.supplierAddress}</p>` : ''}
    </div>
    <div class="meta-box" style="text-align:right">
      <p><strong>Tanggal PO:</strong> ${this.formatDate(payload.orderDate)}</p>
      <p><strong>Estimasi Tiba:</strong> ${this.formatDate(payload.estArrival)}</p>
      <p><strong>Ref. PR:</strong> ${this.nz(payload.referencePr)}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>No</th><th>Material</th><th style="text-align:center">Qty</th><th>UOM</th><th style="text-align:right">Harga Satuan</th><th style="text-align:right">Subtotal</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#666">Tidak ada item</td></tr>'}
    <tr><td colspan="5" style="text-align:right"><strong>Subtotal</strong></td><td style="text-align:right">${this.formatMoney(subtotal)}</td></tr>
    ${taxPercent > 0 ? `<tr><td colspan="5" style="text-align:right"><strong>PPN ${taxPercent}%</strong></td><td style="text-align:right">${this.formatMoney(tax)}</td></tr>` : ''}
    <tr class="total-row"><td colspan="5" style="text-align:right"><strong>TOTAL</strong></td><td style="text-align:right"><strong>${this.formatMoney(total)}</strong></td></tr>
    </tbody>
  </table>
  ${payload.notes ? `<div class="notes"><strong>Catatan:</strong> ${payload.notes}</div>` : ''}
  <div class="signature">
    <div class="signature-box"><div>Dibuat oleh</div><div class="signature-line">${this.nz(payload.creator)}</div></div>
    <div class="signature-box"><div>Disetujui oleh</div><div class="signature-line">${this.nz(payload.approver)}</div></div>
  </div>
</body></html>`;
  }

  // ── Goods Receipt / Surat Penerimaan Barang ────────────────────────────
  private goodsReceiptTemplate(
    companyInfo: any,
    contactLine: string,
    docNumber: string,
    payload: Record<string, any>,
    baseStyle: string,
  ): string {
    const rows = (payload.items || []).map((it: any, idx: number) => {
      const qty = Number(it.qtyActual ?? it.quantityReceived ?? it.quantity ?? 0);
      return `
      <tr>
        <td>${idx + 1}</td>
        <td>${this.nz(it.materialName || it.name)}</td>
        <td style="text-align:center">${qty.toLocaleString('id-ID')}</td>
        <td>${this.nz(it.uom, 'PCS')}</td>
        <td>${this.nz(it.lotNumber)}</td>
        <td>${this.formatDate(it.expDate)}</td>
        <td>${this.nz(it.qcStatus, 'PENDING')}</td>
      </tr>`;
    }).join('');
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
  <div class="header">
    <div class="company-info">
      <img class="brand-logo" src="${companyInfo.logoDataUri}" alt="${companyInfo.brand}"/>
      <h1>${companyInfo.name}</h1>
      <p>${this.nz(companyInfo.address)}</p>
      ${contactLine}
    </div>
    <div class="doc-title">
      <h2>GOODS RECEIPT</h2>
      <div class="doc-subtitle">Surat Penerimaan Barang</div>
      <div class="doc-number">${docNumber}</div>
    </div>
  </div>
  <div class="meta">
    <div class="meta-box">
      <p><strong>Supplier:</strong> ${this.nz(payload.supplierName)}</p>
      <p><strong>Ref. Supplier:</strong> ${this.nz(payload.supplierReference)}</p>
    </div>
    <div class="meta-box" style="text-align:right">
      <p><strong>Tanggal Terima:</strong> ${this.formatDateTime(payload.receivedAt)}</p>
      <p><strong>Ref. PO:</strong> ${this.nz(payload.referencePo)}</p>
      <p><strong>Status:</strong> ${this.nz(payload.status, 'APPROVED')}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>No</th><th>Material</th><th style="text-align:center">Qty Diterima</th><th>UOM</th><th>Lot</th><th>Exp Date</th><th>QC Status</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#666">Tidak ada item</td></tr>'}</tbody>
  </table>
  ${payload.notes ? `<div class="notes"><strong>Catatan:</strong> ${payload.notes}</div>` : ''}
  <div class="signature">
    <div class="signature-box"><div>Diterima oleh</div><div class="signature-line">${this.nz(payload.receiver)}</div></div>
    <div class="signature-box"><div>Diperiksa oleh</div><div class="signature-line">${this.nz(payload.inspector)}</div></div>
  </div>
</body></html>`;
  }

  // ── Sales Order ────────────────────────────────────────────────────────
  private salesOrderTemplate(
    companyInfo: any,
    contactLine: string,
    docNumber: string,
    payload: Record<string, any>,
    items: any[],
    baseStyle: string,
  ): string {
    const rows = items.map((it: any, idx: number) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${this.nz(it.productName || it.name)}</td>
        <td style="text-align:center">${this.nz(it.quantity || it.qty, '0')}</td>
        <td>${this.nz(it.uom || it.unit, 'PCS')}</td>
        <td style="text-align:right">${this.formatMoney(Number(it.unitPrice || 0))}</td>
        <td style="text-align:right">${this.formatMoney(Number(it.subtotal || (Number(it.quantity || 0) * Number(it.unitPrice || 0))))}</td>
      </tr>`).join('');
    const subtotal = items.reduce((s: number, it: any) => s + Number(it.subtotal || (Number(it.quantity || 0) * Number(it.unitPrice || 0))), 0);
    const taxPercent = Number(payload.taxPercent || 0);
    const tax = subtotal * (taxPercent / 100);
    const total = subtotal + tax;
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
  <div class="header">
    <div class="company-info">
      <img class="brand-logo" src="${companyInfo.logoDataUri}" alt="${companyInfo.brand}"/>
      <h1>${companyInfo.name}</h1>
      <p>${this.nz(companyInfo.address)}</p>
      ${contactLine}
    </div>
    <div class="doc-title">
      <h2>SALES ORDER</h2>
      <div class="doc-subtitle">Pesanan Penjualan</div>
      <div class="doc-number">${docNumber}</div>
    </div>
  </div>
  <div class="meta">
    <div class="meta-box">
      <p><strong>Customer:</strong> ${this.nz(payload.clientName)}</p>
      <p><strong>Brand:</strong> ${this.nz(payload.brandName)}</p>
    </div>
    <div class="meta-box" style="text-align:right">
      <p><strong>Tanggal SO:</strong> ${this.formatDate(payload.orderDate)}</p>
      <p><strong>Jatuh Tempo:</strong> ${this.formatDate(payload.dueDate)}</p>
      <p><strong>Status:</strong> ${this.nz(payload.status, 'DRAFT')}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>No</th><th>Produk</th><th style="text-align:center">Qty</th><th>UOM</th><th style="text-align:right">Harga Satuan</th><th style="text-align:right">Subtotal</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#666">Tidak ada item</td></tr>'}
    <tr><td colspan="5" style="text-align:right"><strong>Subtotal</strong></td><td style="text-align:right">${this.formatMoney(subtotal)}</td></tr>
    ${taxPercent > 0 ? `<tr><td colspan="5" style="text-align:right"><strong>PPN ${taxPercent}%</strong></td><td style="text-align:right">${this.formatMoney(tax)}</td></tr>` : ''}
    <tr class="total-row"><td colspan="5" style="text-align:right"><strong>TOTAL</strong></td><td style="text-align:right"><strong>${this.formatMoney(total)}</strong></td></tr>
    </tbody>
  </table>
  ${payload.notes ? `<div class="notes"><strong>Catatan:</strong> ${payload.notes}</div>` : ''}
</body></html>`;
  }

  // ── Batch Record ───────────────────────────────────────────────────────
  private batchRecordTemplate(
    companyInfo: any,
    contactLine: string,
    docNumber: string,
    payload: Record<string, any>,
    baseStyle: string,
  ): string {
    const materials = (payload.materials || []).map((m: any, idx: number) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${this.nz(m.materialName || m.name)}</td>
        <td style="text-align:right">${Number(m.qtySent || 0).toLocaleString('id-ID')}</td>
        <td style="text-align:right">${Number(m.qtyUsed || 0).toLocaleString('id-ID')}</td>
        <td style="text-align:right">${Number(m.qtyReturned || 0).toLocaleString('id-ID')}</td>
        <td style="text-align:right">${Number(m.variance || 0).toLocaleString('id-ID')}</td>
        <td>${this.nz(m.uom)}</td>
        <td>${this.nz(m.reason)}</td>
      </tr>`).join('');
    const stages = (payload.stages || []).map((s: any, idx: number) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${this.nz(s.stageName || s.stage)}</td>
        <td>${this.formatDateTime(s.startedAt)}</td>
        <td>${this.formatDateTime(s.completedAt)}</td>
        <td>${this.nz(s.operator)}</td>
        <td>${this.nz(s.notes)}</td>
      </tr>`).join('');
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
  <div class="header">
    <div class="company-info">
      <img class="brand-logo" src="${companyInfo.logoDataUri}" alt="${companyInfo.brand}"/>
      <h1>${companyInfo.name}</h1>
      <p>${this.nz(companyInfo.address)}</p>
      ${contactLine}
    </div>
    <div class="doc-title">
      <h2>BATCH RECORD</h2>
      <div class="doc-subtitle">Catatan Produksi Batch</div>
      <div class="doc-number">${docNumber}</div>
    </div>
  </div>
  <div class="meta">
    <div class="meta-box">
      <p><strong>Batch No:</strong> ${this.nz(payload.batchNo)}</p>
      <p><strong>Work Order:</strong> ${this.nz(payload.workOrderNumber)}</p>
      <p><strong>Product:</strong> ${this.nz(payload.productName)}</p>
    </div>
    <div class="meta-box" style="text-align:right">
      <p><strong>Formula:</strong> ${this.nz(payload.formulaCode)}${payload.formulaVersionSnapshot ? ' · v' + payload.formulaVersionSnapshot : ''}</p>
      <p><strong>Target Qty:</strong> ${this.nz(payload.targetQty)}</p>
      <p><strong>Actual Qty:</strong> ${this.nz(payload.actualQty)}</p>
    </div>
  </div>
  <h3 class="section-h">Material Usage</h3>
  <table>
    <thead><tr><th>No</th><th>Material</th><th style="text-align:right">Qty Sent</th><th style="text-align:right">Qty Used</th><th style="text-align:right">Qty Returned</th><th style="text-align:right">Variance</th><th>UOM</th><th>Reason</th></tr></thead>
    <tbody>${materials || '<tr><td colspan="8" style="text-align:center;color:#666">Tidak ada material usage tercatat</td></tr>'}</tbody>
  </table>
  <h3 class="section-h">Production Stages</h3>
  <table>
    <thead><tr><th>No</th><th>Stage</th><th>Started</th><th>Completed</th><th>Operator</th><th>Notes</th></tr></thead>
    <tbody>${stages || '<tr><td colspan="6" style="text-align:center;color:#666">Tidak ada stage log tercatat</td></tr>'}</tbody>
  </table>
  ${payload.qcResult ? `<div class="notes"><strong>QC Checkpoint:</strong> ${payload.qcResult}</div>` : ''}
  ${payload.notes ? `<div class="notes"><strong>Catatan:</strong> ${payload.notes}</div>` : ''}
  <div class="signature">
    <div class="signature-box"><div>Operator</div><div class="signature-line">${this.nz(payload.operator)}</div></div>
    <div class="signature-box"><div>Supervisor</div><div class="signature-line">${this.nz(payload.supervisor)}</div></div>
    <div class="signature-box"><div>QC</div><div class="signature-line">${this.nz(payload.qcInspector)}</div></div>
  </div>
</body></html>`;
  }

  private quotationTemplate(
    companyInfo: any,
    contactLine: string,
    docNumber: string,
    payload: Record<string, any>,
    items: any[],
    baseStyle: string,
  ): string {
    const rows = items.map((it: any, idx: number) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${this.nz(it.productName || it.name)}</td>
        <td style="text-align:center">${this.nz(it.quantity, '0')}</td>
        <td style="text-align:right">${this.formatMoney(Number(it.unitPrice || 0))}</td>
        <td style="text-align:right">${this.formatMoney(Number(it.subtotal || (Number(it.quantity || 0) * Number(it.unitPrice || 0))))}</td>
      </tr>`).join('');
    const subtotal = items.reduce((s: number, it: any) => s + Number(it.subtotal || (Number(it.quantity || 0) * Number(it.unitPrice || 0))), 0);
    const tax = payload.taxRate ? subtotal * (payload.taxRate / 100) : 0;
    const total = subtotal + tax;
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
  <div class="header">
    <div class="company-info">
      <img class="brand-logo" src="${companyInfo.logoDataUri}" alt="${companyInfo.brand}"/>
      <h1>${companyInfo.name}</h1>
      <p>${this.nz(companyInfo.address)}</p>
      ${contactLine}
      ${companyInfo.npwp ? `<p>NPWP: ${companyInfo.npwp}</p>` : ''}
    </div>
    <div class="doc-title">
      <h2>Quotation</h2>
      <div class="doc-number">${docNumber}</div>
    </div>
  </div>
  <div class="meta">
    <div class="meta-box">
      <p><strong>Kepada:</strong> ${this.nz(payload.clientName)}</p>
      <p><strong>Brand:</strong> ${this.nz(payload.brandName)}</p>
    </div>
    <div class="meta-box" style="text-align:right">
      <p><strong>Tanggal:</strong> ${this.formatDate(new Date())}</p>
      <p><strong>Valid Hingga:</strong> ${this.formatDate(payload.validUntil)}</p>
      <p><strong>Term:</strong> ${this.nz(payload.paymentTerms, 'DP 30% + Pelunasan')}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>No</th><th>Deskripsi</th><th style="text-align:center">Qty</th><th style="text-align:right">Harga Satuan</th><th style="text-align:right">Subtotal</th></tr></thead>
    <tbody>${rows}
    <tr class="total-row"><td colspan="4" style="text-align:right">Subtotal</td><td style="text-align:right">${this.formatMoney(subtotal)}</td></tr>
    ${tax > 0 ? `<tr><td colspan="4" style="text-align:right">PPN 11%</td><td style="text-align:right">${this.formatMoney(tax)}</td></tr>` : ''}
    <tr class="total-row"><td colspan="4" style="text-align:right"><strong>TOTAL</strong></td><td style="text-align:right"><strong>${this.formatMoney(total)}</strong></td></tr>
    </tbody>
  </table>
  ${payload.notes ? `<div class="notes"><strong>Catatan:</strong> ${payload.notes}</div>` : ''}
  <div class="signature">
    <div class="signature-box"><div class="signature-line">Hormat Kami,<br/><strong>${companyInfo.name}</strong></div></div>
    <div class="signature-box"><div class="signature-line">Mengetahui,<br/><strong>Customer</strong></div></div>
  </div>
  <div class="footer"><p>Dokumen ini merupakan penawaran resmi dari ${companyInfo.name}.</p></div>
</body></html>`;
  }

  private invoiceTemplate(
    companyInfo: any,
    contactLine: string,
    docNumber: string,
    payload: Record<string, any>,
    items: any[],
    baseStyle: string,
    invoiceType: string,
  ): string {
    const rows = items.map((it: any, idx: number) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${this.nz(it.productName || it.name)}</td>
        <td style="text-align:center">${this.nz(it.quantity, '0')}</td>
        <td style="text-align:right">${this.formatMoney(Number(it.unitPrice || 0))}</td>
        <td style="text-align:right">${this.formatMoney(Number(it.subtotal || (Number(it.quantity || 0) * Number(it.unitPrice || 0))))}</td>
      </tr>`).join('');
    const subtotal = items.reduce((s: number, it: any) => s + Number(it.subtotal || (Number(it.quantity || 0) * Number(it.unitPrice || 0))), 0);
    const tax = payload.taxRate ? subtotal * (payload.taxRate / 100) : 0;
    const total = subtotal + tax;
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
  <div class="header">
    <div class="company-info">
      <img class="brand-logo" src="${companyInfo.logoDataUri}" alt="${companyInfo.brand}"/>
      <h1>${companyInfo.name}</h1>
      <p>${this.nz(companyInfo.address)}</p>
      ${contactLine}
    </div>
    <div class="doc-title">
      <h2>Invoice</h2>
      <div class="doc-number">${docNumber}</div>
      <p style="font-size:10px;color:#dc2626;font-weight:bold">${invoiceType}</p>
    </div>
  </div>
  <div class="meta">
    <div class="meta-box">
      <p><strong>Kepada:</strong> ${this.nz(payload.clientName)}</p>
      <p><strong>Brand:</strong> ${this.nz(payload.brandName)}</p>
      <p><strong>SO Reference:</strong> ${this.nz(payload.soNumber)}</p>
    </div>
    <div class="meta-box" style="text-align:right">
      <p><strong>Tanggal:</strong> ${this.formatDate(payload.issueDate || new Date())}</p>
      <p><strong>Jatuh Tempo:</strong> ${this.formatDate(payload.dueDate)}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>No</th><th>Deskripsi</th><th style="text-align:center">Qty</th><th style="text-align:right">Harga</th><th style="text-align:right">Subtotal</th></tr></thead>
    <tbody>${rows}
    <tr class="total-row"><td colspan="4" style="text-align:right">Subtotal</td><td style="text-align:right">${this.formatMoney(subtotal)}</td></tr>
    ${tax > 0 ? `<tr><td colspan="4" style="text-align:right">PPN 11%</td><td style="text-align:right">${this.formatMoney(tax)}</td></tr>` : ''}
    <tr class="total-row"><td colspan="4" style="text-align:right"><strong>TOTAL</strong></td><td style="text-align:right"><strong>${this.formatMoney(total)}</strong></td></tr>
    </tbody>
  </table>
  <div class="notes"><strong>Cara Pembayaran:</strong> Transfer ke rekening BCA 264-035-1589 a.n. ${companyInfo.name}</div>
  <div class="signature">
    <div class="signature-box"><div class="signature-line">Dikeluarkan Oleh,<br/><strong>Finance Dept</strong></div></div>
    <div class="signature-box"><div class="signature-line">Diterima Oleh,<br/><strong>Customer</strong></div></div>
  </div>
  <div class="footer"><p>Invoice ini harus dibayar sesuai jatuh tempo yang tertera.</p></div>
</body></html>`;
  }

  private deliveryOrderTemplate(
    companyInfo: any,
    contactLine: string,
    docNumber: string,
    payload: Record<string, any>,
    baseStyle: string,
  ): string {
    // Delivery has NO price columns — financial columns belong on DO financial side only,
    // not on the operational dispatch slip. Build rows independently.
    const rows = (payload.items || []).map((it: any, idx: number) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${this.nz(it.productName || it.name)}</td>
        <td style="text-align:center">${this.nz(it.quantity, '0')}</td>
        <td>${this.nz(it.uom || it.unit, 'PCS')}</td>
        <td>${this.nz(it.notes || it.keterangan)}</td>
      </tr>`).join('');
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
  <div class="header">
    <div class="company-info">
      <img class="brand-logo" src="${companyInfo.logoDataUri}" alt="${companyInfo.brand}"/>
      <h1>${companyInfo.name}</h1>
      <p>${this.nz(companyInfo.address)}</p>
    </div>
    <div class="doc-title">
      <h2>DELIVERY ORDER</h2>
      <div class="doc-subtitle">Surat Jalan Pengiriman</div>
      <div class="doc-number">${docNumber}</div>
    </div>
  </div>
  <div class="meta">
    <div class="meta-box">
      <p><strong>Penerima:</strong> ${this.nz(payload.clientName)}</p>
      <p><strong>Ref. SO:</strong> ${this.nz(payload.soNumber)}</p>
      ${payload.shippingAddress ? `<p><strong>Alamat:</strong> ${payload.shippingAddress}</p>` : ''}
      ${payload.contactPerson ? `<p><strong>Kontak:</strong> ${payload.contactPerson}</p>` : ''}
    </div>
    <div class="meta-box" style="text-align:right">
      <p><strong>Tanggal Kirim:</strong> ${this.formatDate(payload.shipDate)}</p>
      ${payload.courierName ? `<p><strong>Courier:</strong> ${payload.courierName}</p>` : ''}
      ${payload.trackingNumber ? `<p><strong>Tracking:</strong> ${payload.trackingNumber}</p>` : ''}
    </div>
  </div>
  <table>
    <thead><tr><th>No</th><th>Produk</th><th style="text-align:center">Qty</th><th>UOM</th><th>Catatan</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#666">Tidak ada item</td></tr>'}</tbody>
  </table>
  <div class="signature">
    <div class="signature-box"><div class="signature-line">Dikirim Oleh,<br/><strong>Warehouse</strong></div></div>
    <div class="signature-box"><div class="signature-line">Diterima Oleh,<br/><strong>Penerima</strong></div></div>
  </div>
</body></html>`;
  }

  private suratJalanTemplate(
    companyInfo: any,
    contactLine: string,
    docNumber: string,
    payload: Record<string, any>,
    baseStyle: string,
  ): string {
    const rows = (payload.items || []).map((it: any, idx: number) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${this.nz(it.productName || it.name)}</td>
        <td style="text-align:center">${this.nz(it.quantity, '0')}</td>
        <td>${this.nz(it.uom || it.unit, 'PCS')}</td>
        <td>${this.nz(it.notes || it.keterangan)}</td>
      </tr>`).join('');
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
  <div class="header">
    <div class="company-info">
      <img class="brand-logo" src="${companyInfo.logoDataUri}" alt="${companyInfo.brand}"/>
      <h1>${companyInfo.name}</h1>
      <p>${this.nz(companyInfo.address)}</p>
      ${contactLine}
    </div>
    <div class="doc-title">
      <h2>SURAT JALAN</h2>
      <div class="doc-subtitle">Delivery Note</div>
      <div class="doc-number">${docNumber}</div>
    </div>
  </div>
  <div class="meta">
    <div class="meta-box">
      <p><strong>Pengirim:</strong> ${companyInfo.name}</p>
      <p><strong>Penerima:</strong> ${this.nz(payload.clientName)}</p>
      ${payload.shippingAddress ? `<p><strong>Alamat Tujuan:</strong> ${payload.shippingAddress}</p>` : ''}
    </div>
    <div class="meta-box" style="text-align:right">
      <p><strong>Tanggal:</strong> ${this.formatDate(payload.shipDate)}</p>
      ${payload.vehicleNumber ? `<p><strong>No. Kendaraan:</strong> ${payload.vehicleNumber}</p>` : ''}
      ${payload.driverName ? `<p><strong>Driver:</strong> ${payload.driverName}</p>` : ''}
    </div>
  </div>
  <table>
    <thead><tr><th>No</th><th>Nama Barang</th><th style="text-align:center">Jumlah</th><th>Satuan</th><th>Keterangan</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#666">Tidak ada item</td></tr>'}</tbody>
  </table>
  <div class="signature">
    <div class="signature-box"><div class="signature-line">Pengirim,<br/><strong>Warehouse</strong></div></div>
    <div class="signature-box"><div class="signature-line">Penerima,<br/><strong>&nbsp;</strong></div></div>
  </div>
  <div class="footer"><p>Barang yang sudah diterima tidak dapat dikembalikan kecuali ada kesepakatan tertulis.</p></div>
</body></html>`;
  }

  // ── Goods Requirement (Kebutuhan Barang) — request phase, no prices ─────
  private goodsRequirementTemplate(
    companyInfo: any,
    contactLine: string,
    docNumber: string,
    payload: Record<string, any>,
    items: any[],
    baseStyle: string,
  ): string {
    // Goods Requirement is a REQUEST — quantities + UOM only. Price columns
    // would mislead operators into treating estimates as a binding contract.
    const rows = items.map((it: any, idx: number) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${this.nz(it.materialName || it.productName || it.name)}</td>
        <td style="text-align:center">${this.nz(it.quantity || it.qtyRequired || it.qty, '0')}</td>
        <td>${this.nz(it.uom || it.unit, 'PCS')}</td>
        <td>${this.nz(it.notes || it.notesMaterial)}</td>
      </tr>`).join('');
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
  <div class="header">
    <div class="company-info">
      <img class="brand-logo" src="${companyInfo.logoDataUri}" alt="${companyInfo.brand}"/>
      <h1>${companyInfo.name}</h1>
      <p>Departemen: ${this.nz(payload.departmentId, 'SCM / Procurement')}</p>
    </div>
    <div class="doc-title">
      <h2>GOODS REQUIREMENT</h2>
      <div class="doc-subtitle">Kebutuhan Barang</div>
      <div class="doc-number">${docNumber}</div>
    </div>
  </div>
  <div class="meta">
    <div class="meta-box">
      <p><strong>Requester:</strong> ${this.nz(payload.requester || payload.requestedBy)}</p>
      <p><strong>Ref. SO:</strong> ${this.nz(payload.referenceSo || payload.soNumber)}</p>
      <p><strong>Product Target:</strong> ${this.nz(payload.productName)}</p>
    </div>
    <div class="meta-box" style="text-align:right">
      <p><strong>Tanggal:</strong> ${this.formatDate(payload.requestDate || new Date())}</p>
      <p><strong>Prioritas:</strong> ${this.nz(payload.priority, 'MEDIUM')}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>No</th><th>Material</th><th style="text-align:center">Qty Dibutuhkan</th><th>UOM</th><th>Catatan</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#666">Tidak ada material</td></tr>'}</tbody>
  </table>
  ${payload.notes ? `<div class="notes"><strong>Catatan:</strong> ${payload.notes}</div>` : ''}
  <div class="signature">
    <div class="signature-box"><div>Requester</div><div class="signature-line">${this.nz(payload.requester || payload.requestedBy)}</div></div>
    <div class="signature-box"><div>Department Head</div><div class="signature-line">${this.nz(payload.approver)}</div></div>
  </div>
</body></html>`;
  }

  // ── Purchase Request (Permintaan Pembelian) — pre-PR with cost columns ──
  private purchaseRequestTemplate(
    companyInfo: any,
    contactLine: string,
    docNumber: string,
    payload: Record<string, any>,
    items: any[],
    baseStyle: string,
  ): string {
    const rows = items.map((it: any, idx: number) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${this.nz(it.materialName || it.productName || it.name)}</td>
        <td style="text-align:center">${this.nz(it.quantity || it.qty, '0')}</td>
        <td style="text-align:right">${this.formatMoney(Number(it.unitPrice || it.estimatedPrice || 0))}</td>
        <td style="text-align:right">${this.formatMoney(Number(it.subtotal || 0))}</td>
      </tr>`).join('');
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
  <div class="header">
    <div class="company-info">
      <img class="brand-logo" src="${companyInfo.logoDataUri}" alt="${companyInfo.brand}"/>
      <h1>${companyInfo.name}</h1>
      <p>Departemen: SCM / Purchasing</p>
    </div>
    <div class="doc-title">
      <h2>PURCHASE REQUEST</h2>
      <div class="doc-subtitle">Permintaan Pembelian</div>
      <div class="doc-number">${docNumber}</div>
    </div>
  </div>
  <div class="meta">
    <div class="meta-box">
      <p><strong>Gudang:</strong> ${this.nz(payload.warehouseName)}</p>
      <p><strong>Prioritas:</strong> ${this.nz(payload.priority, 'MEDIUM')}</p>
    </div>
    <div class="meta-box" style="text-align:right">
      <p><strong>Tanggal:</strong> ${this.formatDate(new Date())}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>No</th><th>Material</th><th style="text-align:center">Qty Dibutuhkan</th><th style="text-align:right">Estimasi Harga</th><th style="text-align:right">Subtotal</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5" style="text-align:center;color:#666">Tidak ada material</td></tr>'}</tbody>
  </table>
  <div class="notes"><strong>Catatan:</strong> ${this.nz(payload.notes, 'Dibuat otomatis dari BOM Production')}</div>
</body></html>`;
  }

  private journalTemplate(
    companyInfo: any,
    contactLine: string,
    docNumber: string,
    payload: Record<string, any>,
    baseStyle: string,
  ): string {
    const lines = payload.lines || [];
    const linesHtml = lines.map((line: any, idx: number) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${this.nz(line.accountCode)}</td>
        <td>${this.nz(line.accountName)}</td>
        <td style="text-align:right">${line.debit ? this.formatMoney(Number(line.debit)) : ''}</td>
        <td style="text-align:right">${line.credit ? this.formatMoney(Number(line.credit)) : ''}</td>
      </tr>`).join('');
    const totalDebit = lines.reduce((s: number, l: any) => s + (l.debit || 0), 0);
    const totalCredit = lines.reduce((s: number, l: any) => s + (l.credit || 0), 0);
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
  <div class="header">
    <div class="company-info">
      <img class="brand-logo" src="${companyInfo.logoDataUri}" alt="${companyInfo.brand}"/>
      <h1>${companyInfo.name}</h1>
      <p>Jurnal Entry</p>
    </div>
    <div class="doc-title">
      <h2>JURNAL UMUM</h2>
      <div class="doc-number">${docNumber}</div>
    </div>
  </div>
  <div class="meta">
    <div class="meta-box">
      <p><strong>Tanggal:</strong> ${this.formatDate(new Date())}</p>
      <p><strong>Deskripsi:</strong> ${this.nz(payload.description)}</p>
    </div>
  </div>
  <table>
    <thead><tr><th>No</th><th>Kode Akun</th><th>Nama Akun</th><th style="text-align:right">Debit</th><th style="text-align:right">Kredit</th></tr></thead>
    <tbody>${linesHtml}
    <tr class="total-row"><td colspan="3" style="text-align:right"><strong>TOTAL</strong></td><td style="text-align:right"><strong>${this.formatMoney(totalDebit)}</strong></td><td style="text-align:right"><strong>${this.formatMoney(totalCredit)}</strong></td></tr>
    </tbody>
  </table>
  ${payload.notes ? `<div class="notes"><strong>Catatan:</strong> ${payload.notes}</div>` : ''}
</body></html>`;
  }

  // ── QC Inspection Report — phase-specific params, no Supervisor PIN ──────
  private qcReportTemplate(
    companyInfo: any,
    contactLine: string,
    docNumber: string,
    payload: Record<string, any>,
    baseStyle: string,
  ): string {
    const yn = (v: any) => v == null ? '-' : v ? '✓ PASS' : '✗ FAIL';
    // Two columns x N rows. Pair these as [label, value, label, value] tuples.
    // Hide row if BOTH paired values are null AND it's a phase-specific param.
    const phase = String(payload.phase || '').toUpperCase();
    const isIncoming = phase === 'INCOMING' || phase === 'RAW';
    const isFinal = phase === 'FINAL' || phase === 'RELEASE';
    const isProcess = phase === 'PROCESS' || phase === 'IN_PROCESS';

    // Build 2-col grid pairs. Rows where both values are missing collapse to "-".
    // Odd count: append the leftover parameter as a single-cell row (NEVER a filler
    // placeholder like "—" — that's banned).
    const pairs: Array<[string, any, string, any]> = [
      ['pH Value', payload.phValue, 'Density', payload.densityValue],
      ['Viscosity', payload.viscosityValue, 'Torque', payload.torqueValue],
      ['Sampling Volume', payload.samplingVolume, 'Organoleptic', yn(payload.organoleptic)],
      ['COA Verified', yn(payload.coaVerified), 'Halal Status', yn(payload.halalStatus)],
      ['Inkjet Coding', yn(payload.inkjetCheck), 'Sealing', yn(payload.sealingCheck)],
      ['Labeling', yn(payload.labelingCheck), 'Exp Date', yn(payload.expDateCheck)],
      ['Homogenity', yn(payload.homogenityPass), 'Leak Test', yn(payload.leakTestPass)],
    ];
    const dimensionLabel = 'Dimension';
    const dimensionValue = yn(payload.dimensionCheck);
    // For phase-specific emphasis: drop rows where both values are null except the
    // first 2 spec rows (pH/density/viscosity/torque) which are universal.
    const gridHtml = pairs.map((p, i) => {
      const [l1, v1, l2, v2] = p;
      const allBlank = (v1 == null || v1 === '-') && (v2 == null || v2 === '-') && i > 1;
      if (allBlank) return '';
      return `<tr><td>${l1}</td><td>${this.nz(v1)}</td><td>${l2}</td><td>${v2 == null ? '-' : v2}</td></tr>`;
    }).join('')
      // Ponytail: odd leftover param renders as 1-col row. Skip entirely when
      // value is null/undefined/'-' — NEVER insert blank filler to balance grid.
      + (dimensionValue && dimensionValue !== '-'
        ? `<tr><td>${dimensionLabel}</td><td colspan="3">${dimensionValue}</td></tr>`
        : '');

    const resultLabel = payload.status === 'GOOD' ? '✓ RELEASE'
      : payload.status === 'QUARANTINE' ? '⚠ HOLD'
      : payload.status === 'FAIL' ? '✗ REJECT'
      : this.nz(payload.status);

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
  <div class="header">
    <div class="company-info">
      <img class="brand-logo" src="${companyInfo.logoDataUri}" alt="${companyInfo.brand}"/>
      <h1>${companyInfo.name}</h1>
      <p>${this.nz(companyInfo.address)}</p>
      ${contactLine}
    </div>
    <div class="doc-title">
      <h2>QC INSPECTION REPORT</h2>
      <div class="doc-subtitle">Laporan Inspeksi QC</div>
      <div class="doc-number">${docNumber}</div>
    </div>
  </div>
  <div class="meta">
    <div class="meta-box">
      <p><strong>Phase:</strong> ${this.nz(phase, 'GENERAL')}${isIncoming ? ' (Incoming)' : isFinal ? ' (Final)' : isProcess ? ' (In-process)' : ''}</p>
      <p><strong>Material Batch:</strong> ${this.nz(payload.materialBatchNo)}</p>
      ${isIncoming ? `<p><strong>Supplier:</strong> ${this.nz(payload.supplierName)}</p>` : ''}
    </div>
    <div class="meta-box" style="text-align:right">
      <p><strong>Tanggal:</strong> ${this.formatDateTime(payload.createdAt)}</p>
      <p><strong>Status:</strong> ${this.nz(payload.status)}</p>
      <p><strong>Result:</strong> ${resultLabel}</p>
    </div>
  </div>
  <h3 class="section-h">Measurements &amp; Specifications</h3>
  <table>
    <thead><tr><th>Parameter</th><th>Result</th><th>Parameter</th><th>Result</th></tr></thead>
    <tbody>${gridHtml || '<tr><td colspan="4" style="text-align:center;color:#666">Tidak ada parameter tercatat</td></tr>'}</tbody>
  </table>
  ${payload.defectType ? `<h3 class="section-h">Defect / Disposition</h3>
  <table>
    <thead><tr><th>Category</th><th>Type</th><th>Location</th><th>Cause</th><th>Severity</th><th>Disposition</th></tr></thead>
    <tbody><tr>
      <td>${this.nz(payload.defectCategory)}</td>
      <td>${this.nz(payload.defectType)}</td>
      <td>${this.nz(payload.defectLocation)}</td>
      <td>${this.nz(payload.defectCause)}</td>
      <td>${this.nz(payload.severity)}</td>
      <td>${this.nz(payload.disposition)}</td>
    </tr></tbody>
  </table>` : ''}
  ${payload.rootCause ? `<div class="notes"><strong>Root Cause:</strong> ${payload.rootCause}<br/><strong>Corrective Action:</strong> ${this.nz(payload.correctiveAction)}</div>` : ''}
  ${payload.notes ? `<div class="notes"><strong>Catatan:</strong> ${payload.notes}</div>` : ''}
  <div class="signature">
    <div class="signature-box"><div>Inspector</div><div class="signature-line">${this.nz(payload.inspectorName)}</div></div>
    <div class="signature-box"><div>QC Supervisor</div><div class="signature-line">${this.nz(payload.supervisorName)}</div></div>
  </div>
</body></html>`;
  }

  // ── Fund Request — minimal empty-box fix ────────────────────────────────
  private fundRequestTemplate(
    companyInfo: any,
    contactLine: string,
    docNumber: string,
    payload: Record<string, any>,
    baseStyle: string,
  ): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
  <div class="header">
    <div class="company-info">
      <img class="brand-logo" src="${companyInfo.logoDataUri}" alt="${companyInfo.brand}"/>
      <h1>${companyInfo.name}</h1>
      <p>${this.nz(companyInfo.address)}</p>
      ${contactLine}
    </div>
    <div class="doc-title">
      <h2>FUND REQUEST</h2>
      <div class="doc-subtitle">Permintaan Dana</div>
      <div class="doc-number">${docNumber}</div>
    </div>
  </div>
  <div class="meta">
    <div class="meta-box">
      <p><strong>Requester:</strong> ${this.nz(payload.requester)}</p>
      <p><strong>Department:</strong> ${this.nz(payload.departmentId)}</p>
      <p><strong>Attachment Count:</strong> ${this.nz(payload.attachmentCount, '0')}</p>
    </div>
    <div class="meta-box" style="text-align:right">
      <p><strong>Tanggal Request:</strong> ${this.formatDate(payload.requestDate)}</p>
      <p><strong>Status:</strong> ${this.nz(payload.status)}</p>
      ${payload.approvedAt ? `<p><strong>Tanggal Disetujui:</strong> ${this.formatDateTime(payload.approvedAt)}</p>` : ''}
    </div>
  </div>
  <table>
    <tbody>
      <tr><td style="width:30%"><strong>Fund Request #</strong></td><td>${this.nz(payload.requestNumber)}</td></tr>
      <tr><td><strong>Department / Project</strong></td><td>${this.nz(payload.departmentId)}</td></tr>
      <tr><td><strong>Purpose / Reason</strong></td><td>${this.nz(payload.reason)}</td></tr>
      <tr class="total-row"><td><strong>Requested Amount</strong></td><td style="text-align:right"><strong>${this.formatMoney(Number(payload.amount || 0))}</strong></td></tr>
    </tbody>
  </table>
  <div class="meta">
    <div class="meta-box">
      <p><strong>Approver:</strong> ${this.nz(payload.approver)}</p>
      ${payload.approvedAt ? `<p><strong>Tanggal Approve:</strong> ${this.formatDateTime(payload.approvedAt)}</p>` : ''}
      <p><strong>Disburser:</strong> ${this.nz(payload.disbursedBy)}</p>
      ${payload.disbursedAt ? `<p><strong>Tanggal Cair:</strong> ${this.formatDateTime(payload.disbursedAt)}</p>` : ''}
    </div>
    ${payload.rejectReason ? `<div class="meta-box" style="text-align:right;border-color:#dc2626"><p><strong>Reject Reason:</strong> ${payload.rejectReason}</p></div>` : ''}
  </div>
  ${payload.notes ? `<div class="notes"><strong>Catatan:</strong> ${payload.notes}</div>` : ''}
  <div class="signature">
    <div class="signature-box"><div>Requester</div><div class="signature-line">${this.nz(payload.requester)}</div></div>
    <div class="signature-box"><div>Manager / Director</div><div class="signature-line">${this.nz(payload.approver)}</div></div>
    <div class="signature-box"><div>Finance</div><div class="signature-line">${this.nz(payload.disbursedBy)}</div></div>
  </div>
</body></html>`;
  }

  private genericTemplate(
    companyInfo: any,
    contactLine: string,
    docNumber: string,
    payload: Record<string, any>,
    baseStyle: string,
  ): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
  <div class="header">
    <div class="company-info"><img class="brand-logo" src="${companyInfo.logoDataUri}" alt="${companyInfo.brand}"/><h1>${companyInfo.name}</h1></div>
    <div class="doc-title"><h2>Document</h2><div class="doc-number">${docNumber}</div></div>
  </div>
  <pre style="font-size:11px;white-space:pre-wrap">${JSON.stringify(payload, null, 2)}</pre>
</body></html>`;
  }

  private async htmlToPdf(html: string): Promise<Buffer> {
    try {
      const htmlPdfNode = await import('html-pdf-node');
      const file = { content: html };
      const options = {
        format: 'A4',
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
        printBackground: true,
      };
      const pdfBuffer = await htmlPdfNode.default.generatePdf(file, options);
      return pdfBuffer;
    } catch (error) {
      this.logger.error(`PDF generation failed, returning HTML: ${error}`);
      return Buffer.from(html, 'utf-8');
    }
  }
}