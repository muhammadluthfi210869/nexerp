import {
  CompanyInfo,
  DEFAULT_COMPANY,
  getBaseStyles,
} from './common.template';

export function renderGoodsRequest(
  data: Record<string, any>,
  docNumber: string,
  company: CompanyInfo = DEFAULT_COMPANY,
): string {
  const items = data.items || [];
  const rows = items
    .map(
      (it: any, i: number) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="text-align:center">✔</td>
      <td style="font-family:monospace;font-weight:bold">${it.itemCode || it.kodeBarang || '-'}</td>
      <td><strong>${it.productName || it.name || it.namaBarang || '-'}</strong></td>
      <td style="text-align:center">${it.unit || it.satuan || 'gr'}</td>
      <td style="text-align:right">${Number(it.qtyRequested || it.qtyDiminta || it.qty || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
      <td style="text-align:right">${Number(it.qtyApproved || it.qtyDisetujui || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
      <td style="text-align:right">${Number(it.qtyIssued || it.qtyDikeluarkan || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
      <td style="text-align:right">${Number(it.qtyUsed || it.qtyDigunakan || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
      <td style="text-align:right">${Number(it.qtyReturned || it.qtyDikembalikan || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
      <td style="text-align:right;font-weight:bold">${Number(it.qtyDifference || it.qtySelisih || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
    </tr>
  `,
    )
    .join('');

  const totalRequested = items.reduce(
    (sum: number, it: any) => sum + Number(it.qtyRequested || it.qtyDiminta || it.qty || 0),
    0,
  );

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${getBaseStyles(true)}</head><body>
    <div class="header-container">
      <div class="company-block">
        <h1>${company.name}</h1>
        <p>${company.address}</p>
        <p>Telp: ${company.phone}</p>
      </div>
      <div class="doc-block">
        <h2>PERMINTAAN BARANG</h2>
        <div class="doc-sub">${company.name}</div>
        <div class="doc-num">No: ${docNumber}</div>
        <div class="doc-sub">Tanggal: ${data.date || data.requestDate || '-'}</div>
        <div class="doc-sub">Status: <span class="badge-status">${data.status || 'Pending'}</span></div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Peminta:</strong> ${data.requestingDepartment || data.peminta || 'Gudang Produksi Mixing'}</p>
        <p><strong>Pembuat:</strong> ${data.createdBy || data.pembuat || '-'}</p>
      </div>
      <div class="meta-col">
        <p><strong>Penyedia:</strong> ${data.sourceWarehouse || data.penyedia || 'Gudang Bahan Baku'}</p>
        <p><strong>Catatan:</strong> ${data.notes || data.catatan || '-'}</p>
      </div>
    </div>
    <div style="font-weight:bold;margin:10px 0 4px">Detail Barang</div>
    <table class="doc-table">
      <thead>
        <tr>
          <th style="width:25px;text-align:center">No</th>
          <th style="width:30px;text-align:center">Img</th>
          <th style="width:85px">Kode Barang</th>
          <th>Nama Barang</th>
          <th style="width:50px;text-align:center">Satuan</th>
          <th style="width:75px;text-align:right">Qty Diminta</th>
          <th style="width:75px;text-align:right">Qty Disetujui</th>
          <th style="width:75px;text-align:right">Qty Dikeluarkan</th>
          <th style="width:75px;text-align:right">Qty Digunakan</th>
          <th style="width:75px;text-align:right">Qty Dikembalikan</th>
          <th style="width:75px;text-align:right">Qty Selisih</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr style="background:#f1f5f9;font-weight:bold">
          <td colspan="5" style="text-align:right">TOTAL:</td>
          <td style="text-align:right">${totalRequested.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right">0.00</td>
          <td style="text-align:right">0.00</td>
          <td style="text-align:right">0.00</td>
          <td style="text-align:right">0.00</td>
          <td style="text-align:right">0.00</td>
        </tr>
      </tbody>
    </table>
    <div class="signatures-row">
      <div class="signature-col">
        <p>Pembuat,</p>
        <div class="signature-space"></div>
        <div class="signature-line">${data.createdBy || 'Muhammad Ruhullah'}</div>
      </div>
    </div>
  </body></html>`;
}

export function renderStockOpname(
  data: Record<string, any>,
  docNumber: string,
  company: CompanyInfo = DEFAULT_COMPANY,
): string {
  const items = data.items || [];
  let totalSystem = 0;
  let totalActual = 0;
  let diffPos = 0;
  let diffNeg = 0;

  const rows = items
    .map(
      (it: any, i: number) => {
        const sys = Number(it.systemStock || it.stokSistem || 0);
        const act = Number(it.actualStock || it.stokAktual || 0);
        const diff = Number(it.difference || it.selisih || act - sys);
        totalSystem += sys;
        totalActual += act;
        if (diff > 0) diffPos += diff;
        if (diff < 0) diffNeg += diff;

        return `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="text-align:center">✔</td>
      <td style="font-family:monospace;font-weight:bold">${it.itemCode || it.kodeBarang || '-'}</td>
      <td><strong>${it.productName || it.name || it.namaBarang || '-'}</strong></td>
      <td style="text-align:center">${it.unit || it.satuan || 'gr'}</td>
      <td style="text-align:right">${sys.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
      <td style="text-align:right">${act.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
      <td style="text-align:right;color:${diff < 0 ? '#dc2626' : diff > 0 ? '#16a34a' : 'inherit'};font-weight:bold">
        ${diff > 0 ? '+' : ''}${diff.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
      </td>
      <td>${it.notes || it.catatan || '-'}</td>
    </tr>
  `;
      },
    )
    .join('');

  const totalDiff = totalActual - totalSystem;

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${getBaseStyles(true)}</head><body>
    <div class="header-container">
      <div class="company-block">
        <h1>${company.name}</h1>
        <p>${company.address}</p>
        <p>Telp: ${company.phone}</p>
      </div>
      <div class="doc-block">
        <h2>STOCK OPNAME</h2>
        <div class="doc-sub">${company.name}</div>
        <div class="doc-num">No. SO: ${docNumber}</div>
        <div class="doc-sub">Tanggal: ${data.date || data.opnameDate || '-'}</div>
        <div class="doc-sub">Gudang: ${data.warehouseName || data.gudang || 'Gudang Bahan Baku'}</div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Pembuat:</strong> ${data.createdBy || data.pembuat || '-'}</p>
      </div>
    </div>
    <div style="font-weight:bold;margin:10px 0 4px">Detail Barang</div>
    <table class="doc-table">
      <thead>
        <tr>
          <th style="width:25px;text-align:center">No</th>
          <th style="width:30px;text-align:center">Img</th>
          <th style="width:90px">Kode Barang</th>
          <th>Nama Barang</th>
          <th style="width:50px;text-align:center">Satuan</th>
          <th style="width:85px;text-align:right">Stok Sistem</th>
          <th style="width:85px;text-align:right">Stok Aktual</th>
          <th style="width:85px;text-align:right">Selisih</th>
          <th>Catatan</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr style="background:#f1f5f9;font-weight:bold">
          <td colspan="5" style="text-align:right">TOTAL:</td>
          <td style="text-align:right">${totalSystem.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right">${totalActual.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
          <td style="text-align:right;color:${totalDiff < 0 ? '#dc2626' : totalDiff > 0 ? '#16a34a' : 'inherit'}">
            ${totalDiff > 0 ? '+' : ''}${totalDiff.toLocaleString('id-ID', { minimumFractionDigits: 2 })}
          </td>
          <td></td>
        </tr>
      </tbody>
    </table>
    <div style="margin:12px 0;background:#f8fafc;border:1px solid #cbd5e1;padding:8px 12px;border-radius:4px;font-size:9.5px">
      <strong>Ringkasan:</strong>
      <div style="display:flex;justify-content:space-between;margin-top:4px">
        <div>Total Item: <strong>${items.length}</strong></div>
        <div>Selisih Positif: <strong style="color:#16a34a">+${diffPos.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</strong></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:2px">
        <div>Total Stok Sistem: <strong>${totalSystem.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</strong></div>
        <div>Selisih Negatif: <strong style="color:#dc2626">${diffNeg.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</strong></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:2px">
        <div>Total Stok Aktual: <strong>${totalActual.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</strong></div>
        <div>Total Selisih: <strong style="color:${totalDiff < 0 ? '#dc2626' : totalDiff > 0 ? '#16a34a' : 'inherit'}">${totalDiff > 0 ? '+' : ''}${totalDiff.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</strong></div>
      </div>
    </div>
    ${data.notes ? `<div class="terbilang-box" style="font-style:normal"><strong>Catatan:</strong> ${data.notes}</div>` : ''}
    <div class="signatures-row">
      <div class="signature-col">
        <p>Dibuat oleh,</p>
        <div class="signature-space"></div>
        <div class="signature-line">${data.createdBy || 'Umar Nurbana'}</div>
      </div>
    </div>
  </body></html>`;
}
