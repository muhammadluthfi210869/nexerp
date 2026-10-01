import {
  CompanyInfo,
  DEFAULT_COMPANY,
  getBaseStyles,
} from './common.template';

export function renderBatchRecord(
  data: Record<string, any>,
  docNumber: string,
  company: CompanyInfo = DEFAULT_COMPANY,
): string {
  const products = data.products || data.items || [];
  const history = data.statusHistory || data.riwayatStatus || [];

  const prodRows = products
    .map(
      (p: any, i: number) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="font-weight:bold;font-family:monospace">${p.itemCode || p.kodeBarang || '-'}</td>
      <td>
        <strong>${p.productName || p.namaBarang || '-'}</strong>
        ${p.formulaCode ? `<div style="font-size:9px;color:#64748b">${p.formulaCode}</div>` : ''}
      </td>
      <td style="text-align:center">${p.unit || p.satuan || 'pcs'}</td>
    </tr>
  `,
    )
    .join('');

  const historyRows = history.length
    ? history
        .map(
          (h: any) => `
      <tr>
        <td>${h.description || h.keterangan || '-'}</td>
        <td style="text-align:center">${h.by || h.oleh || '-'}</td>
        <td style="text-align:center">${h.date || h.tanggal || '-'}</td>
      </tr>
    `,
        )
        .join('')
    : '<tr><td colspan="3" style="text-align:center;color:#64748b">-</td></tr>';

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${getBaseStyles()}</head><body>
    <div class="header-container">
      <div class="company-block">
        <h1>${company.name}</h1>
        <p>${company.address}</p>
        <p>Telp: ${company.phone} | Website: ${company.website || '-'}</p>
      </div>
      <div class="doc-block">
        <h2>BATCH RECORD</h2>
        <div class="doc-sub">${company.name}</div>
        <div class="doc-num">No. Batch Record: ${docNumber}</div>
        <div class="doc-sub">Tanggal: ${data.date || data.createdAt?.split('T')[0] || '-'}</div>
        <div class="doc-sub">Status: <span class="badge-status">${data.status || 'Process'}</span></div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Informasi Sales:</strong></p>
        <p><strong>Kode Sales:</strong> ${data.salesOrderCode || data.soCode || '-'}</p>
        <p><strong>Tanggal Sales:</strong> ${data.salesDate || '-'}</p>
        <p><strong>Pelanggan:</strong> ${data.customerName || data.clientName || '-'}</p>
        <p><strong>Kategori:</strong> ${data.category || 'Produk Baru'}</p>
      </div>
      <div class="meta-col">
        <p><strong>Informasi Pembuat:</strong></p>
        <p><strong>Dibuat Oleh:</strong> ${data.createdBy || data.author || '-'}</p>
        <p><strong>Tanggal Dibuat:</strong> ${data.createdAtFormatted || data.date || '-'}</p>
      </div>
    </div>
    <div style="font-weight:bold;margin:10px 0 4px">Detail Produk</div>
    <table class="doc-table">
      <thead><tr><th style="width:30px;text-align:center">No</th><th style="width:110px">Kode Barang</th><th>Nama Barang</th><th style="width:80px;text-align:center">Satuan</th></tr></thead>
      <tbody>${prodRows}</tbody>
    </table>
    <div style="font-weight:bold;margin:12px 0 4px">Riwayat Status</div>
    <table class="doc-table">
      <thead><tr><th>Keterangan</th><th style="width:140px;text-align:center">Oleh</th><th style="width:120px;text-align:center">Tanggal</th></tr></thead>
      <tbody>${historyRows}</tbody>
    </table>
    <div class="signatures-row">
      <div class="signature-col">
        <p>Dibuat oleh,</p>
        <div class="signature-space"></div>
        <div class="signature-line">${data.createdBy || 'Staff Produksi'}</div>
      </div>
    </div>
  </body></html>`;
}

export function renderScheduleMixing(
  data: Record<string, any>,
  docNumber: string,
  company: CompanyInfo = DEFAULT_COMPANY,
): string {
  const upscalePct = Number(data.upscalePct || 5);
  const targetQty = Number(data.targetQty || 0);
  const nettoPerPcs = Number(data.nettoPerPcs || 0);
  const baseResult = Number(data.baseResult || targetQty * nettoPerPcs);
  const hasilUpscale = Number(data.hasilUpscale || baseResult + (baseResult * upscalePct) / 100);

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${getBaseStyles()}</head><body>
    <div class="header-container">
      <div class="company-block">
        <h1>${company.name}</h1>
        <p>${company.address}</p>
        <p>Telp: ${company.phone} | Website: ${company.website || '-'}</p>
      </div>
      <div class="doc-block">
        <h2>JADWAL MIXING</h2>
        <div class="doc-sub">${company.name}</div>
        <div class="doc-num">No. Jadwal Mixing: ${docNumber}</div>
        <div class="doc-sub">Tanggal: ${data.date || '-'}</div>
        <div class="doc-sub">Status: <span class="badge-status">${data.status || 'Pending'}</span></div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Informasi Batch Record:</strong></p>
        <p><strong>Kode Batch:</strong> ${data.batchRecordCode || data.batchCode || '-'}</p>
        <p><strong>Kode Sales:</strong> ${data.soCode || '-'}</p>
        <p><strong>Pelanggan:</strong> ${data.customerName || '-'}</p>
        <p><strong>Kategori:</strong> ${data.category || 'Produk Baru'}</p>
        <p><strong>Produk:</strong> ${data.productName || '-'}</p>
      </div>
      <div class="meta-col">
        <p><strong>Informasi Pembuat:</strong></p>
        <p><strong>Dibuat Oleh:</strong> ${data.createdBy || '-'}</p>
        <p><strong>Tanggal Dibuat:</strong> ${data.createdAt || '-'}</p>
      </div>
    </div>
    <div style="font-weight:bold;margin:10px 0 4px">Detail Produksi</div>
    <table class="doc-table">
      <tbody>
        <tr><td style="width:200px;font-weight:bold">Target Qty (PCS)</td><td style="width:20px">:</td><td><strong>${targetQty.toLocaleString('id-ID')} PCS</strong></td></tr>
        <tr><td style="font-weight:bold">Netto per PCS</td><td>:</td><td>${nettoPerPcs.toLocaleString('id-ID')} ${data.unit || 'ml'}</td></tr>
        <tr><td style="font-weight:bold">Base Result</td><td>:</td><td>${baseResult.toLocaleString('id-ID')} ${data.unit || 'ml'}</td></tr>
      </tbody>
    </table>
    <div style="font-weight:bold;margin:12px 0 4px">Perhitungan Upscale</div>
    <table class="doc-table">
      <tbody>
        <tr><td style="width:200px;font-weight:bold">Upscale (%)</td><td style="width:20px">:</td><td>${upscalePct.toFixed(2)}%</td></tr>
        <tr><td style="font-weight:bold">Hasil Upscale</td><td>:</td><td><strong>${hasilUpscale.toLocaleString('id-ID')} ${data.unit || 'ml'}</strong></td></tr>
      </tbody>
    </table>
    <div class="terbilang-box" style="font-style:normal;font-size:9.5px">
      <strong>Formula:</strong> Base Result + (Base Result × Upscale %) = ${baseResult.toLocaleString('id-ID')} + (${baseResult.toLocaleString('id-ID')} × ${upscalePct.toFixed(2)}%) = ${hasilUpscale.toLocaleString('id-ID')} ${data.unit || 'ml'}
    </div>
    <div class="signatures-row">
      <div class="signature-col">
        <p>Dibuat oleh,</p>
        <div class="signature-space"></div>
        <div class="signature-line">${data.createdBy || 'Operator Mixing'}</div>
      </div>
    </div>
  </body></html>`;
}

export function renderSchedulePackaging(
  data: Record<string, any>,
  docNumber: string,
  company: CompanyInfo = DEFAULT_COMPANY,
): string {
  const targetQty = Number(data.targetQty || 0);
  const items = data.secondaryPackaging || data.items || [];

  const rows = items
    .map(
      (it: any, i: number) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="font-family:monospace;font-weight:bold">${it.code || it.kode || '-'}</td>
      <td>${it.name || it.namaKemasan || '-'}</td>
      <td style="text-align:right;font-weight:bold">${Number(it.qty || 0).toLocaleString('id-ID')}</td>
      <td style="text-align:center">${it.unit || it.satuan || 'pcs'}</td>
      <td>${it.notes || it.catatan || '-'}</td>
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
        <h2>JADWAL PACKAGING</h2>
        <div class="doc-sub">${company.name}</div>
        <div class="doc-num">No. Jadwal Packaging: ${docNumber}</div>
        <div class="doc-sub">Tanggal: ${data.date || '-'}</div>
        <div class="doc-sub">Status: <span class="badge-status">${data.status || 'Pending'}</span></div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Informasi Batch Record:</strong></p>
        <p><strong>Kode Batch:</strong> ${data.batchRecordCode || data.batchCode || '-'}</p>
        <p><strong>Kode Sales:</strong> ${data.soCode || '-'}</p>
        <p><strong>Pelanggan:</strong> ${data.customerName || '-'}</p>
        <p><strong>Kategori:</strong> ${data.category || 'Produk Baru'}</p>
        <p><strong>Produk:</strong> ${data.productName || '-'}</p>
      </div>
      <div class="meta-col">
        <p><strong>Informasi Pembuat:</strong></p>
        <p><strong>Dibuat Oleh:</strong> ${data.createdBy || '-'}</p>
        <p><strong>Tanggal Dibuat:</strong> ${data.createdAt || '-'}</p>
      </div>
    </div>
    <div style="font-weight:bold;margin:10px 0 4px">Detail Produksi</div>
    <table class="doc-table">
      <tbody>
        <tr><td style="width:200px;font-weight:bold">Target Qty (PCS)</td><td style="width:20px">:</td><td><strong>${targetQty.toLocaleString('id-ID')} PCS</strong></td></tr>
      </tbody>
    </table>
    <div style="font-weight:bold;margin:12px 0 4px">Detail Kemasan Sekunder</div>
    <table class="doc-table">
      <thead><tr><th style="width:30px;text-align:center">No</th><th style="width:100px">Kode</th><th>Nama Kemasan</th><th style="width:70px;text-align:right">Qty</th><th style="width:60px;text-align:center">Satuan</th><th>Catatan</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="signatures-row">
      <div class="signature-col">
        <p>Dibuat oleh,</p>
        <div class="signature-space"></div>
        <div class="signature-line">${data.createdBy || 'Staff Packaging'}</div>
      </div>
    </div>
  </body></html>`;
}
