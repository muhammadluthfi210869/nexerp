import {
  CompanyInfo,
  DEFAULT_COMPANY,
  formatRupiah,
  terbilang,
  getBaseStyles,
} from './common.template';

export function renderSalesSample(
  data: Record<string, any>,
  docNumber: string,
  company: CompanyInfo = DEFAULT_COMPANY,
): string {
  const products = data.products || data.items || [];
  const prodRows = products
    .map(
      (p: any, i: number) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td>
        <strong>${p.productName || p.name || '-'}</strong>
        <div style="font-size:8.5px;color:#64748b">
          Form: ${p.form || '-'} | Color: ${p.color || '-'} | Flavor: ${p.flavor || '-'} | Netto: ${p.netto || '-'}
        </div>
      </td>
      <td style="text-align:center">${p.qty || 1}</td>
      <td style="text-align:right">Rp ${formatRupiah(p.price || 0)}</td>
      <td style="text-align:right">Rp ${formatRupiah(p.total || 0)}</td>
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
        <h2>SALES SAMPLE</h2>
        <div class="doc-sub">${company.name}</div>
        <div class="doc-num">No. Sales Sample: ${docNumber}</div>
        <div class="doc-sub">Tanggal: ${data.date || '-'}</div>
        <div class="doc-sub">Status: <span class="badge-status">${data.status || 'Process'}</span></div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Pelanggan:</strong></p>
        <p><strong>Nama:</strong> ${data.customerName || '-'}</p>
        <p><strong>Pembuat:</strong> ${data.createdBy || '-'}</p>
      </div>
      <div class="meta-col">
        <p><strong>Informasi Sample:</strong></p>
        <p><strong>Formulator:</strong> ${data.formulator || 'R&D Staff'}</p>
        <p><strong>Netto:</strong> ${data.netto || '20.00 gr'}</p>
      </div>
    </div>
    <div style="font-weight:bold;margin:10px 0 4px">Detail Produk</div>
    <table class="doc-table">
      <tbody>
        <tr>
          <td style="width:90px;font-weight:bold">Form</td><td style="width:10px">:</td><td>${data.form || 'Krim'}</td>
          <td style="width:90px;font-weight:bold">Color</td><td style="width:10px">:</td><td>${data.color || 'beige light'}</td>
        </tr>
        <tr>
          <td style="font-weight:bold">Flavor</td><td>:</td><td colspan="4">${data.flavor || 'sesuai acuan / rnd'}</td>
        </tr>
      </tbody>
    </table>
    <div style="font-weight:bold;margin:12px 0 4px">Deskripsi Sales Sample</div>
    <table class="doc-table">
      <tbody>
        <tr><td style="background:#f8fafc"><strong>Karakteristik & Tekstur:</strong><br/><div style="white-space:pre-wrap">${data.description || '• Tekstur: ringan lembut dan creamy\n• Kekentalan: sedang\n• Finish: Glowing glass skin'}</div></td></tr>
        ${data.target ? `<tr><td><strong>Target Look:</strong> ${data.target}</td></tr>` : ''}
        ${data.reference ? `<tr><td><strong>Referensi Pasar:</strong> ${data.reference}</td></tr>` : ''}
        ${data.materialRequest ? `<tr><td><strong>Material Request:</strong> ${data.materialRequest}</td></tr>` : ''}
        ${data.claims ? `<tr><td><strong>Klaim:</strong> ${data.claims}</td></tr>` : ''}
      </tbody>
    </table>
    ${prodRows ? `
      <div style="font-weight:bold;margin:12px 0 4px">Rincian Sample</div>
      <table class="doc-table">
        <thead><tr><th style="width:30px;text-align:center">No</th><th>Nama Produk</th><th style="width:50px;text-align:center">Qty</th><th style="width:90px;text-align:right">Harga</th><th style="width:100px;text-align:right">Total</th></tr></thead>
        <tbody>${prodRows}</tbody>
      </table>
    ` : ''}
    <div style="font-size:9.5px;margin:8px 0"><strong>Revisi:</strong> <span class="badge-status" style="background:#ea580c">${data.revision || 'Rev 0'}</span></div>
    <div class="signatures-row">
      <div class="signature-col">
        <p>Dibuat oleh,</p>
        <div class="signature-space"></div>
        <div class="signature-line">${data.createdBy || 'Commercial PIC'}</div>
      </div>
    </div>
  </body></html>`;
}

export function renderRequestCogs(
  data: Record<string, any>,
  docNumber: string,
  company: CompanyInfo = DEFAULT_COMPANY,
): string {
  const items = data.items || [
    {
      netto: data.netto || 0,
      moq: data.moq || 1000,
      hppProduk: data.hppProduk || 0,
      marginOp: data.marginOp || 0,
      hppPrimer1: data.hppPrimer1 || 0,
      hppPrimer2: data.hppPrimer2 || 0,
      hppSekunder: data.hppSekunder || 0,
      totalHpp: data.totalHpp || 0,
    },
  ];

  const rows = items
    .map(
      (it: any, i: number) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="text-align:center">${Number(it.netto || 0).toLocaleString('id-ID')}</td>
      <td style="text-align:center;font-weight:bold">${Number(it.moq || 0).toLocaleString('id-ID')}</td>
      <td style="text-align:right">Rp ${formatRupiah(it.hppProduk)}</td>
      <td style="text-align:right">Rp ${formatRupiah(it.marginOp)}</td>
      <td style="text-align:right">Rp ${formatRupiah(it.hppPrimer1)}</td>
      <td style="text-align:right">Rp ${formatRupiah(it.hppPrimer2)}</td>
      <td style="text-align:right">Rp ${formatRupiah(it.hppSekunder)}</td>
      <td style="text-align:right;font-weight:bold;background:#eff6ff">Rp ${formatRupiah(it.totalHpp)}</td>
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
        <h2>PERMINTAAN HARGA POKOK PENJUALAN (HPP)</h2>
        <div class="doc-sub">${company.name}</div>
        <div class="doc-num">No. Request: ${docNumber}</div>
        <div class="doc-sub">Tanggal: ${data.date || '-'}</div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Informasi Pelanggan & Sample:</strong></p>
        <p><strong>Pelanggan:</strong> ${data.customerName || '-'}</p>
        <p><strong>Alamat:</strong> ${data.address || '-'}</p>
        <p><strong>Telp:</strong> ${data.phone || '-'}</p>
      </div>
      <div class="meta-col">
        <p><strong>Kode Sample:</strong> ${data.sampleCode || '-'}</p>
        <p><strong>Nama Produk:</strong> ${data.productName || '-'}</p>
        <p><strong>Netto Sample:</strong> ${data.nettoSample || '-'}</p>
        <p><strong>Formula:</strong> ${data.formulaRevision || 'Rev 0'}</p>
      </div>
    </div>
    <table class="doc-table">
      <thead>
        <tr>
          <th style="width:25px;text-align:center">No</th>
          <th style="width:50px;text-align:center">Netto</th>
          <th style="width:70px;text-align:center">MOQ (pcs)</th>
          <th style="width:85px;text-align:right">HPP Produk</th>
          <th style="width:75px;text-align:right">Margin OP</th>
          <th style="width:80px;text-align:right">HPP Kemasan Primer</th>
          <th style="width:80px;text-align:right">HPP Kemasan Primer 2</th>
          <th style="width:80px;text-align:right">HPP Kemasan Sekunder</th>
          <th style="width:95px;text-align:right">Total HPP/Unit</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${data.notes ? `<div class="terbilang-box" style="font-style:normal"><strong>Catatan:</strong> ${data.notes}</div>` : ''}
    <div class="signatures-row">
      <div class="signature-col">
        <p>Dibuat Oleh,</p>
        <div class="signature-space"></div>
        <div class="signature-line">${data.createdBy || 'Staff R&D'}</div>
      </div>
      <div class="signature-col">
        <p>Disetujui Oleh,</p>
        <div class="signature-space"></div>
        <div class="signature-line">${data.approvedBy || 'Head of R&D'}</div>
      </div>
    </div>
  </body></html>`;
}
