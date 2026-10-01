import {
  CompanyInfo,
  DEFAULT_COMPANY,
  formatRupiah,
  formatRupiahNoDecimal,
  terbilang,
  getBaseStyles,
} from './common.template';

export function renderQuotation(
  data: Record<string, any>,
  docNumber: string,
  company: CompanyInfo = DEFAULT_COMPANY,
): string {
  const items = data.items || [];
  const subtotal = items.reduce(
    (sum: number, it: any) => sum + Number(it.subtotal || it.quantity * it.unitPrice || 0),
    0,
  );
  const tax = data.taxRate ? subtotal * (data.taxRate / 100) : 0;
  const total = subtotal + tax;

  const rows = items
    .map(
      (it: any, i: number) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td><strong>${it.productName || it.name || '-'}</strong></td>
      <td style="text-align:center">${it.quantity || it.qty || 1} ${it.unit || 'pcs'}</td>
      <td style="text-align:right">Rp ${formatRupiahNoDecimal(it.unitPrice || it.price)}</td>
      <td style="text-align:right">Rp ${formatRupiahNoDecimal(it.subtotal || it.quantity * it.unitPrice)}</td>
    </tr>
  `,
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${getBaseStyles()}</head><body>
    <div class="header-container">
      <div class="company-block">
        <h1>${company.name}</h1>
        <p>${company.address}</p>
        <p>Telp: ${company.phone} | Website: ${company.website || '-'}</p>
      </div>
      <div class="doc-block">
        <h2>QUOTATION</h2>
        <div class="doc-num">No. Quo: ${docNumber}</div>
        <div class="doc-sub">Tanggal: ${data.date || new Date().toISOString().split('T')[0]}</div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Kepada:</strong> ${data.clientName || '-'}</p>
        <p><strong>Brand:</strong> ${data.brandName || '-'}</p>
        <p><strong>PIC:</strong> ${data.picName || '-'}</p>
      </div>
      <div class="meta-col" style="text-align:right">
        <p><strong>Valid Hingga:</strong> ${data.validUntil || '-'}</p>
        <p><strong>Term Pembayaran:</strong> ${data.paymentTerms || 'DP 50% + Pelunasan'}</p>
      </div>
    </div>
    <table class="doc-table">
      <thead><tr><th style="width:30px;text-align:center">No</th><th>Deskripsi</th><th style="width:70px;text-align:center">Qty</th><th style="width:110px;text-align:right">Harga Satuan</th><th style="width:120px;text-align:right">Subtotal</th></tr></thead>
      <tbody>
        ${rows}
        <tr><td colspan="4" style="text-align:right;font-weight:bold">Subtotal</td><td style="text-align:right">Rp ${formatRupiahNoDecimal(subtotal)}</td></tr>
        ${tax > 0 ? `<tr><td colspan="4" style="text-align:right">PPN</td><td style="text-align:right">Rp ${formatRupiahNoDecimal(tax)}</td></tr>` : ''}
        <tr style="background:#f1f5f9;font-weight:bold"><td colspan="4" style="text-align:right">GRAND TOTAL</td><td style="text-align:right">Rp ${formatRupiahNoDecimal(total)}</td></tr>
      </tbody>
    </table>
    <div class="terbilang-box">Terbilang: ${terbilang(total)}</div>
    <div class="signatures-row">
      <div class="signature-col">
        <p>Hormat Kami,</p>
        <div class="signature-space"></div>
        <div class="signature-line">${data.salesPerson || company.name}</div>
      </div>
    </div>
  </body></html>`;
}

export function renderSalesOrder(
  data: Record<string, any>,
  docNumber: string,
  company: CompanyInfo = DEFAULT_COMPANY,
): string {
  const items = data.items || [];
  const subtotal = items.reduce(
    (sum: number, it: any) => sum + Number(it.total || it.subtotal || it.quantity * it.unitPrice || 0),
    0,
  );
  const discount = Number(data.discount || 0);
  const tax = Number(data.tax || 0);
  const grandTotal = subtotal - discount + tax;

  const rows = items
    .map(
      (it: any, i: number) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="text-align:center">
        <span class="badge-type ${it.type === 'JASA' || it.isService ? 'badge-jasa' : 'badge-barang'}">
          ${it.type === 'JASA' || it.isService ? 'Jasa' : 'Barang'}
        </span>
      </td>
      <td>
        <strong>${it.productName || it.name || it.itemName || '-'}</strong>
        ${it.sampleCode ? `<div style="font-size:9px;color:#64748b">Sample: ${it.sampleCode} ${it.revision ? `| Rev: ${it.revision}` : ''} ${it.netto ? `| Netto: ${it.netto}` : ''}</div>` : ''}
      </td>
      <td style="text-align:right">Rp ${formatRupiah(it.unitPrice || it.price || it.harga)}</td>
      <td style="text-align:right">${Number(it.quantity || it.qty || 1).toLocaleString('id-ID')}</td>
      <td style="text-align:right">Rp ${formatRupiah(it.total || it.subtotal || it.quantity * it.unitPrice)}</td>
    </tr>
  `,
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${getBaseStyles()}</head><body>
    <div class="header-container">
      <div class="company-block">
        <h1>${company.name}</h1>
        <p>${company.address}</p>
        <p>Telp: ${company.phone}</p>
      </div>
      <div class="doc-block">
        <h2>SALES ORDER</h2>
        <div class="doc-sub">${company.name}</div>
        <div class="doc-num">No. SO: ${docNumber}</div>
        <div class="doc-sub">Tanggal: ${data.orderDate || data.date || '-'}</div>
        <div class="doc-sub">Jatuh Tempo: ${data.dueDate || data.orderDate || '-'}</div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Pelanggan:</strong> ${data.customerName || data.clientName || '-'}</p>
        <p><strong>Alamat:</strong> ${data.address || data.shippingAddress || '-'}</p>
        <p><strong>Telp:</strong> ${data.phone || data.customerPhone || '-'}</p>
      </div>
      <div class="meta-col">
        <p><strong>Kategori:</strong> ${data.category || 'Produk Baru'}</p>
        <p><strong>Merek:</strong> ${data.brandName || '-'}</p>
      </div>
    </div>
    <table class="doc-table">
      <thead><tr><th style="width:25px;text-align:center">No</th><th style="width:55px;text-align:center">Tipe</th><th>Nama Item</th><th style="width:100px;text-align:right">Harga</th><th style="width:65px;text-align:right">Qty</th><th style="width:115px;text-align:right">Total</th></tr></thead>
      <tbody>
        ${rows}
        <tr><td colspan="5" style="text-align:right;font-weight:bold">Subtotal:</td><td style="text-align:right">Rp ${formatRupiah(subtotal)}</td></tr>
        <tr><td colspan="5" style="text-align:right">Diskon:</td><td style="text-align:right">(${formatRupiah(discount)})</td></tr>
        <tr><td colspan="5" style="text-align:right">Pajak:</td><td style="text-align:right">${formatRupiah(tax)}</td></tr>
        <tr style="background:#f1f5f9;font-weight:bold"><td colspan="5" style="text-align:right">GRAND TOTAL:</td><td style="text-align:right">Rp ${formatRupiah(grandTotal)}</td></tr>
      </tbody>
    </table>
    <div class="terbilang-box">Terbilang: ${terbilang(grandTotal)}</div>
    <div class="signatures-row">
      <div class="signature-col">
        <p>Hormat Kami,</p>
        <div class="signature-space"></div>
        <div class="signature-line">${data.salesPerson || data.createdBy || 'Commercial Dept'}</div>
      </div>
    </div>
    <div class="footer-note"><span>Dokumen dicetak otomatis oleh sistem NEX ERP</span><span>Halaman 1/1</span></div>
  </body></html>`;
}

export function renderInvoiceProduksi(
  data: Record<string, any>,
  docNumber: string,
  company: CompanyInfo = DEFAULT_COMPANY,
): string {
  const items = data.items || [];
  const subtotal = items.reduce(
    (sum: number, it: any) => sum + Number(it.total || it.jumlah || (it.qty || it.quantity || 1) * (it.harga || it.unitPrice || 0)),
    0,
  );
  const discount = Number(data.discount || 0);
  const downPayment = Number(data.downPayment || data.totalDownPayment || 0);
  const pelunasan = subtotal - discount - downPayment;

  const rows = items
    .map(
      (it: any) => `
    <tr>
      <td>${it.productName || it.name || it.namaBarang || '-'}</td>
      <td style="text-align:center">${it.qty || it.quantity || 1}</td>
      <td style="text-align:right">Rp ${formatRupiahNoDecimal(it.harga || it.unitPrice || 0)}</td>
      <td style="text-align:right">${it.discount ? `Rp ${formatRupiahNoDecimal(it.discount)}` : '-'}</td>
      <td style="text-align:right">Rp ${formatRupiahNoDecimal(it.total || it.jumlah || (it.qty || 1) * (it.harga || 0))}</td>
    </tr>
  `,
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${getBaseStyles()}</head><body>
    <div class="header-container" style="border-bottom: 3px solid #0f172a">
      <div class="company-block">
        <h1 style="color:#0f172a;font-size:18px">INVOICE PRODUKSI</h1>
        <div style="font-weight:700;color:#334155">${company.name}</div>
        <p>${company.address}</p>
        <p>T: ${company.phone} | M: ${company.email}</p>
      </div>
      <div class="doc-block" style="text-align:right">
        <div style="font-size:24px;font-weight:900;color:#eab308;letter-spacing:-1px">DREAM<span style="color:#0284c7">LAB</span></div>
        <div style="font-size:9px;color:#64748b;letter-spacing:1px;text-transform:uppercase">Cosmetics Laboratories</div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Yang Terhormat:</strong></p>
        <p><strong>NAMA:</strong> ${data.clientName || data.customerName || '-'}</p>
        <p><strong>NAMA BRAND:</strong> ${data.brandName || '-'}</p>
        <p><strong>ALAMAT:</strong> ${data.address || data.shippingAddress || '-'}</p>
        <p><strong>TELEPON:</strong> ${data.phone || data.customerPhone || '-'}</p>
      </div>
      <div class="meta-col" style="max-width:240px">
        <p><strong>INVOICE DATE:</strong> ${data.issueDate || data.date || '-'}</p>
        <p><strong>INVOICE NUMBER:</strong> ${docNumber}</p>
      </div>
    </div>
    <table class="doc-table">
      <thead><tr><th>NAMA BARANG</th><th style="width:60px;text-align:center">QTY</th><th style="width:100px;text-align:right">HARGA</th><th style="width:90px;text-align:right">DISCOUNT</th><th style="width:120px;text-align:right">JUMLAH</th></tr></thead>
      <tbody>
        ${rows}
        <tr><td colspan="4" style="text-align:right;font-weight:bold">Subtotal</td><td style="text-align:right">Rp ${formatRupiahNoDecimal(subtotal)}</td></tr>
        ${discount > 0 ? `<tr><td colspan="4" style="text-align:right">Discount</td><td style="text-align:right">Rp ${formatRupiahNoDecimal(discount)}</td></tr>` : ''}
        ${downPayment > 0 ? `<tr><td colspan="4" style="text-align:right;font-weight:bold">Total Down Payment</td><td style="text-align:right">Rp ${formatRupiahNoDecimal(downPayment)}</td></tr>` : ''}
        <tr style="background:#fef08a;font-weight:bold;color:#0f172a"><td colspan="4" style="text-align:right">TOTAL PELUNASAN</td><td style="text-align:right">Rp ${formatRupiahNoDecimal(pelunasan > 0 ? pelunasan : subtotal - discount)}</td></tr>
      </tbody>
    </table>
    <div class="terbilang-box">Terbilang: ${terbilang(pelunasan > 0 ? pelunasan : subtotal - discount)}</div>
    <div style="font-size:9.5px;margin-top:12px">
      <strong>Transfer ke:</strong><br/>
      ${company.name}<br/>
      Bank Central Asia (BCA)<br/>
      Rekening 010 223 2389 (IDR)
    </div>
    <div style="font-size:9px;color:#475569;margin-top:10px">
      <strong>Payment Term:</strong><br/>
      - Pembayaran maksimal 7 hari sejak Invoice ini diterbitkan<br/>
      - Konfirmasi Pembayaran Mohon sertakan bukti sah & valid<br/>
      - Proses Produksi Barang / jasa sesuai jadwal yang telah disetujui & setelah konfirmasi pembayaran (non-refundable)
    </div>
    <div class="signatures-row">
      <div class="signature-col">
        <p>Hormat Kami,<br/><strong>${company.name}</strong></p>
        <div class="signature-space"></div>
        <div class="signature-line">${data.directorName || 'ABDULLAH HUSIN ZAKI'}<br/><span style="font-weight:normal;color:#64748b">Direktur Utama</span></div>
      </div>
    </div>
  </body></html>`;
}

export function renderKwitansi(
  data: Record<string, any>,
  docNumber: string,
  company: CompanyInfo = DEFAULT_COMPANY,
): string {
  const items = data.items || [];
  const totalAmount = Number(data.amount || data.paidAmount || data.total || 0);

  const rows = items
    .map(
      (it: any) => `
    <tr>
      <td>${it.productName || it.name || it.namaBarang || '-'}</td>
      <td style="text-align:center">${it.qty || it.quantity || 1}</td>
      <td style="text-align:right">Rp ${formatRupiahNoDecimal(it.harga || it.unitPrice || 0)}</td>
      <td style="text-align:right">Rp ${formatRupiahNoDecimal(it.total || (it.qty || 1) * (it.harga || 0))}</td>
    </tr>
  `,
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${getBaseStyles()}</head><body>
    <div class="header-container" style="border-bottom: 3px solid #0f172a">
      <div class="company-block">
        <h1 style="color:#0f172a;font-size:18px">KWITANSI PEMBAYARAN</h1>
        <div style="font-weight:700;color:#334155">${company.name}</div>
        <p>${company.address}</p>
        <p>T: ${company.phone} | M: ${company.email}</p>
      </div>
      <div class="doc-block" style="text-align:right">
        <div style="font-size:24px;font-weight:900;color:#eab308;letter-spacing:-1px">DREAM<span style="color:#0284c7">LAB</span></div>
        <div style="font-size:9px;color:#64748b;letter-spacing:1px;text-transform:uppercase">Cosmetics Laboratories</div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Yang Terhormat:</strong></p>
        <p><strong>NAMA:</strong> ${data.clientName || data.customerName || '-'}</p>
        <p><strong>NAMA BRAND:</strong> ${data.brandName || '-'}</p>
        <p><strong>ALAMAT:</strong> ${data.address || '-'}</p>
        <p><strong>TELEPON:</strong> ${data.phone || '-'}</p>
      </div>
      <div class="meta-col" style="max-width:240px;position:relative">
        <p><strong>INVOICE DATE:</strong> ${data.date || new Date().toISOString().split('T')[0]}</p>
        <p><strong>INVOICE NUMBER:</strong> ${docNumber}</p>
        <div style="margin-top:14px;text-align:center">
          <span class="lunas-stamp">LUNAS</span>
        </div>
      </div>
    </div>
    <table class="doc-table">
      <thead><tr><th>NAMA BARANG</th><th style="width:60px;text-align:center">QTY</th><th style="width:110px;text-align:right">HARGA SATUAN</th><th style="width:130px;text-align:right">JUMLAH</th></tr></thead>
      <tbody>
        ${rows}
        <tr style="background:#f1f5f9;font-weight:bold"><td colspan="3" style="text-align:right">TOTAL DITERIMA</td><td style="text-align:right">Rp ${formatRupiahNoDecimal(totalAmount)}</td></tr>
      </tbody>
    </table>
    <div class="terbilang-box">Terbilang: ${terbilang(totalAmount)}</div>
    <div class="signatures-row">
      <div class="signature-col">
        <p>Hormat Kami,<br/><strong>${company.name}</strong></p>
        <div class="signature-space"></div>
        <div class="signature-line">${data.directorName || 'ABDULLAH HUSIN ZAKI'}<br/><span style="font-weight:normal;color:#64748b">Direktur Utama</span></div>
      </div>
    </div>
  </body></html>`;
}
