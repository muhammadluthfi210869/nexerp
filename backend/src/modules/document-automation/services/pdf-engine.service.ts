import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PdfEngineService {
  private readonly logger = new Logger(PdfEngineService.name);

  async generatePdf(
    documentType: string,
    data: Record<string, any>,
    documentNumber: string,
  ): Promise<Buffer> {
    const html = this.renderTemplate(documentType, data, documentNumber);
    return this.htmlToPdf(html);
  }

  private renderTemplate(
    documentType: string,
    data: Record<string, any>,
    documentNumber: string,
  ): string {
    const companyInfo = {
      name: 'PT AUREON INDONESIA',
      address: 'Jl. Raya Industri No. 123, Jakarta Timur 13560',
      phone: '(021) 8888-9999',
      email: 'info@aureon.co.id',
      npwp: '12.345.678.9-012.000',
    };

    const baseStyle = `
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 20px; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
        .company-info h1 { margin: 0; font-size: 18px; color: #2563eb; }
        .company-info p { margin: 2px 0; font-size: 10px; color: #666; }
        .doc-title { text-align: right; }
        .doc-title h2 { margin: 0; font-size: 24px; color: #1a1a1a; text-transform: uppercase; }
        .doc-title .doc-number { font-size: 12px; color: #2563eb; font-weight: bold; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11px; }
        .meta-box { background: #f8fafc; padding: 10px 15px; border-radius: 6px; border: 1px solid #e2e8f0; }
        .meta-box p { margin: 2px 0; }
        .meta-box strong { color: #2563eb; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 11px; }
        th { background: #2563eb; color: white; padding: 8px 10px; text-align: left; font-weight: 600; }
        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #f8fafc; }
        .total-row { font-weight: bold; background: #eff6ff !important; }
        .total-row td { border-top: 2px solid #2563eb; }
        .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 10px; color: #666; }
        .signature { display: flex; justify-content: space-between; margin-top: 40px; }
        .signature-box { width: 45%; text-align: center; }
        .signature-line { border-top: 1px solid #1a1a1a; margin-top: 50px; padding-top: 5px; }
        .notes { background: #fffbeb; border: 1px solid #fbbf24; border-radius: 6px; padding: 10px 15px; margin: 15px 0; font-size: 10px; }
      </style>
    `;

    const payload = data as Record<string, any>;
    const items = payload.items || [];
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + (item.subtotal || (item.quantity || 0) * (item.unitPrice || 0) || 0),
      0,
    );
    const tax = payload.taxRate ? subtotal * (payload.taxRate / 100) : 0;
    const total = subtotal + tax;

    const itemsRows = items
      .map(
        (item: any, idx: number) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${item.productName || item.name || item.materialName || '-'}</td>
          <td style="text-align:center">${item.quantity || item.qty || 0}</td>
          <td style="text-align:right">Rp ${Number(item.unitPrice || item.price || 0).toLocaleString('id-ID')}</td>
          <td style="text-align:right">Rp ${Number(item.subtotal || (item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('id-ID')}</td>
        </tr>
      `,
      )
      .join('');

    const templateMap: Record<string, () => string> = {
      QUOTATION: () => this.quotationTemplate(companyInfo, documentNumber, payload, itemsRows, subtotal, tax, total, baseStyle),
      INVOICE_DP: () => this.invoiceTemplate(companyInfo, documentNumber, payload, itemsRows, subtotal, tax, total, baseStyle, 'DOWN PAYMENT (DP)'),
      INVOICE_FINAL: () => this.invoiceTemplate(companyInfo, documentNumber, payload, itemsRows, subtotal, tax, total, baseStyle, 'FINAL PAYMENT'),
      DELIVERY_ORDER: () => this.deliveryOrderTemplate(companyInfo, documentNumber, payload, itemsRows, baseStyle),
      SURAT_JALAN: () => this.suratJalanTemplate(companyInfo, documentNumber, payload, itemsRows, baseStyle),
      PURCHASE_REQUEST: () => this.purchaseRequestTemplate(companyInfo, documentNumber, payload, itemsRows, baseStyle),
      GOODS_REQUIREMENT: () => this.purchaseRequestTemplate(companyInfo, documentNumber, payload, itemsRows, baseStyle),
      JOURNAL_ENTRY: () => this.journalTemplate(companyInfo, documentNumber, payload, baseStyle),
    };

    const renderer = templateMap[documentType];
    if (!renderer) {
      return this.genericTemplate(companyInfo, documentNumber, payload, baseStyle);
    }
    return renderer();
  }

  private quotationTemplate(
    companyInfo: any,
    docNumber: string,
    payload: Record<string, any>,
    itemsRows: string,
    subtotal: number,
    tax: number,
    total: number,
    baseStyle: string,
  ): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
      <div class="header">
        <div class="company-info">
          <h1>${companyInfo.name}</h1>
          <p>${companyInfo.address}</p>
          <p>Telp: ${companyInfo.phone} | Email: ${companyInfo.email}</p>
          <p>NPWP: ${companyInfo.npwp}</p>
        </div>
        <div class="doc-title">
          <h2>Quotation</h2>
          <div class="doc-number">${docNumber}</div>
        </div>
      </div>
      <div class="meta">
        <div class="meta-box">
          <p><strong>Kepada:</strong> ${payload.clientName || '-'}</p>
          <p><strong>Brand:</strong> ${payload.brandName || '-'}</p>
        </div>
        <div class="meta-box" style="text-align:right">
          <p><strong>Tanggal:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
          <p><strong>Valid Hingga:</strong> ${payload.validUntil || '-'}</p>
          <p><strong>Term:</strong> ${payload.paymentTerms || 'DP 30% + Pelunasan'}</p>
        </div>
      </div>
      <table>
        <thead><tr><th>No</th><th>Deskripsi</th><th style="text-align:center">Qty</th><th style="text-align:right">Harga Satuan</th><th style="text-align:right">Subtotal</th></tr></thead>
        <tbody>${itemsRows}
        <tr class="total-row"><td colspan="4" style="text-align:right">Subtotal</td><td style="text-align:right">Rp ${subtotal.toLocaleString('id-ID')}</td></tr>
        ${tax > 0 ? `<tr><td colspan="4" style="text-align:right">PPN 11%</td><td style="text-align:right">Rp ${tax.toLocaleString('id-ID')}</td></tr>` : ''}
        <tr class="total-row"><td colspan="4" style="text-align:right"><strong>TOTAL</strong></td><td style="text-align:right"><strong>Rp ${total.toLocaleString('id-ID')}</strong></td></tr>
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
    docNumber: string,
    payload: Record<string, any>,
    itemsRows: string,
    subtotal: number,
    tax: number,
    total: number,
    baseStyle: string,
    invoiceType: string,
  ): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
      <div class="header">
        <div class="company-info">
          <h1>${companyInfo.name}</h1>
          <p>${companyInfo.address}</p>
          <p>Telp: ${companyInfo.phone} | Email: ${companyInfo.email}</p>
        </div>
        <div class="doc-title">
          <h2>Invoice</h2>
          <div class="doc-number">${docNumber}</div>
          <p style="font-size:10px;color:#dc2626;font-weight:bold">${invoiceType}</p>
        </div>
      </div>
      <div class="meta">
        <div class="meta-box">
          <p><strong>Kepada:</strong> ${payload.clientName || '-'}</p>
          <p><strong>Brand:</strong> ${payload.brandName || '-'}</p>
          <p><strong>SO Reference:</strong> ${payload.soNumber || '-'}</p>
        </div>
        <div class="meta-box" style="text-align:right">
          <p><strong>Tanggal:</strong> ${payload.issueDate || new Date().toLocaleDateString('id-ID')}</p>
          <p><strong>Jatuh Tempo:</strong> ${payload.dueDate ? new Date(payload.dueDate).toLocaleDateString('id-ID') : '-'}</p>
        </div>
      </div>
      <table>
        <thead><tr><th>No</th><th>Deskripsi</th><th style="text-align:center">Qty</th><th style="text-align:right">Harga</th><th style="text-align:right">Subtotal</th></tr></thead>
        <tbody>${itemsRows}
        <tr class="total-row"><td colspan="4" style="text-align:right">Subtotal</td><td style="text-align:right">Rp ${subtotal.toLocaleString('id-ID')}</td></tr>
        ${tax > 0 ? `<tr><td colspan="4" style="text-align:right">PPN 11%</td><td style="text-align:right">Rp ${tax.toLocaleString('id-ID')}</td></tr>` : ''}
        <tr class="total-row"><td colspan="4" style="text-align:right"><strong>TOTAL</strong></td><td style="text-align:right"><strong>Rp ${total.toLocaleString('id-ID')}</strong></td></tr>
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
    docNumber: string,
    payload: Record<string, any>,
    itemsRows: string,
    baseStyle: string,
  ): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
      <div class="header">
        <div class="company-info">
          <h1>${companyInfo.name}</h1>
          <p>${companyInfo.address}</p>
        </div>
        <div class="doc-title">
          <h2>Delivery Order</h2>
          <div class="doc-number">${docNumber}</div>
        </div>
      </div>
      <div class="meta">
        <div class="meta-box">
          <p><strong>Penerima:</strong> ${payload.clientName || '-'}</p>
          <p><strong>Alamat:</strong> ${payload.shippingAddress || '-'}</p>
          <p><strong>Kontak:</strong> ${payload.contactPerson || '-'}</p>
        </div>
        <div class="meta-box" style="text-align:right">
          <p><strong>Tanggal Kirim:</strong> ${payload.shipDate || new Date().toLocaleDateString('id-ID')}</p>
          <p><strong>Courier:</strong> ${payload.courierName || '-'}</p>
          <p><strong>Tracking:</strong> ${payload.trackingNumber || '-'}</p>
        </div>
      </div>
      <table>
        <thead><tr><th>No</th><th>Deskripsi</th><th style="text-align:center">Qty</th><th>Catatan</th></tr></thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div class="signature">
        <div class="signature-box"><div class="signature-line">Dikirim Oleh,<br/><strong>Warehouse</strong></div></div>
        <div class="signature-box"><div class="signature-line">Diterima Oleh,<br/><strong>Penerima</strong></div></div>
      </div>
    </body></html>`;
  }

  private suratJalanTemplate(
    companyInfo: any,
    docNumber: string,
    payload: Record<string, any>,
    itemsRows: string,
    baseStyle: string,
  ): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
      <div class="header">
        <div class="company-info">
          <h1>${companyInfo.name}</h1>
          <p>${companyInfo.address}</p>
          <p>Telp: ${companyInfo.phone}</p>
        </div>
        <div class="doc-title">
          <h2>Surat Jalan</h2>
          <div class="doc-number">${docNumber}</div>
        </div>
      </div>
      <div class="meta">
        <div class="meta-box">
          <p><strong>Pengirim:</strong> ${companyInfo.name}</p>
          <p><strong>Penerima:</strong> ${payload.clientName || '-'}</p>
          <p><strong>Alamat Tujuan:</strong> ${payload.shippingAddress || '-'}</p>
        </div>
        <div class="meta-box" style="text-align:right">
          <p><strong>Tanggal:</strong> ${payload.shipDate || new Date().toLocaleDateString('id-ID')}</p>
          <p><strong>No. Kendaraan:</strong> ${payload.vehicleNumber || '-'}</p>
          <p><strong>Driver:</strong> ${payload.driverName || '-'}</p>
        </div>
      </div>
      <table>
        <thead><tr><th>No</th><th>Nama Barang</th><th style="text-align:center">Jumlah</th><th>Satuan</th><th>Keterangan</th></tr></thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div class="signature">
        <div class="signature-box"><div class="signature-line">Pengirim,<br/><strong>Warehouse</strong></div></div>
        <div class="signature-box"><div class="signature-line">Penerima,<br/><strong>&nbsp;</strong></div></div>
      </div>
      <div class="footer"><p>Barang yang sudah diterima tidak dapat dikembalikan kecuali ada kesepakatan tertulis.</p></div>
    </body></html>`;
  }

  private purchaseRequestTemplate(
    companyInfo: any,
    docNumber: string,
    payload: Record<string, any>,
    itemsRows: string,
    baseStyle: string,
  ): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
      <div class="header">
        <div class="company-info">
          <h1>${companyInfo.name}</h1>
          <p>Departemen: SCM / Purchasing</p>
        </div>
        <div class="doc-title">
          <h2>Purchase Request</h2>
          <div class="doc-number">${docNumber}</div>
        </div>
      </div>
      <div class="meta">
        <div class="meta-box">
          <p><strong>Gudang:</strong> ${payload.warehouseName || '-'}</p>
          <p><strong>Prioritas:</strong> ${payload.priority || 'MEDIUM'}</p>
        </div>
        <div class="meta-box" style="text-align:right">
          <p><strong>Tanggal:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
        </div>
      </div>
      <table>
        <thead><tr><th>No</th><th>Material</th><th style="text-align:center">Qty Dibutuhkan</th><th style="text-align:right">Estimasi Harga</th><th style="text-align:right">Subtotal</th></tr></thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div class="notes"><strong>Catatan:</strong> ${payload.notes || 'Dibuat otomatis dari BOM Production'}</div>
    </body></html>`;
  }

  private journalTemplate(
    companyInfo: any,
    docNumber: string,
    payload: Record<string, any>,
    baseStyle: string,
  ): string {
    const lines = payload.lines || [];
    const linesHtml = lines
      .map(
        (line: any, idx: number) => `
        <tr>
          <td>${idx + 1}</td>
          <td>${line.accountCode || '-'}</td>
          <td>${line.accountName || '-'}</td>
          <td style="text-align:right">${line.debit ? `Rp ${Number(line.debit).toLocaleString('id-ID')}` : ''}</td>
          <td style="text-align:right">${line.credit ? `Rp ${Number(line.credit).toLocaleString('id-ID')}` : ''}</td>
        </tr>
      `,
      )
      .join('');

    const totalDebit = lines.reduce((sum: number, l: any) => sum + (l.debit || 0), 0);
    const totalCredit = lines.reduce((sum: number, l: any) => sum + (l.credit || 0), 0);

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
      <div class="header">
        <div class="company-info">
          <h1>${companyInfo.name}</h1>
          <p>Jurnal Entry</p>
        </div>
        <div class="doc-title">
          <h2>Jurnal Umum</h2>
          <div class="doc-number">${docNumber}</div>
        </div>
      </div>
      <div class="meta">
        <div class="meta-box">
          <p><strong>Tanggal:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
          <p><strong>Deskripsi:</strong> ${payload.description || '-'}</p>
        </div>
      </div>
      <table>
        <thead><tr><th>No</th><th>Kode Akun</th><th>Nama Akun</th><th style="text-align:right">Debit</th><th style="text-align:right">Kredit</th></tr></thead>
        <tbody>${linesHtml}
        <tr class="total-row"><td colspan="3" style="text-align:right"><strong>TOTAL</strong></td><td style="text-align:right"><strong>Rp ${totalDebit.toLocaleString('id-ID')}</strong></td><td style="text-align:right"><strong>Rp ${totalCredit.toLocaleString('id-ID')}</strong></td></tr>
        </tbody>
      </table>
      ${payload.notes ? `<div class="notes"><strong>Catatan:</strong> ${payload.notes}</div>` : ''}
    </body></html>`;
  }

  private genericTemplate(
    companyInfo: any,
    docNumber: string,
    payload: Record<string, any>,
    baseStyle: string,
  ): string {
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">${baseStyle}</head><body>
      <div class="header">
        <div class="company-info"><h1>${companyInfo.name}</h1></div>
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
