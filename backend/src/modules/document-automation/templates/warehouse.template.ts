import {
  CompanyInfo,
  DEFAULT_COMPANY,
  getBaseStyles,
} from './common.template';

export function renderDeliveryOrder(
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
      <td style="font-family:monospace;font-weight:bold">${it.itemCode || it.kodeBarang || '-'}</td>
      <td><strong>${it.productName || it.name || it.namaBarang || '-'}</strong></td>
      <td style="text-align:right;font-weight:bold">${Number(it.qty || it.quantity || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
      <td style="text-align:center">${it.unit || it.satuan || 'pcs'}</td>
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
        <h2>BUKTI PENGIRIMAN BARANG</h2>
        <div class="doc-sub">${company.name}</div>
        <div class="doc-num">No. Bukti: ${docNumber}</div>
        <div class="doc-sub">Tanggal: ${data.deliveryDate || data.shipDate || data.date || '-'}</div>
        <div class="doc-sub">No. Sales: ${data.salesOrderCode || data.soCode || '-'}</div>
        <div class="doc-sub">Tgl. Sales: ${data.salesDate || '-'}</div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Kepada Yth:</strong></p>
        <p><strong>${data.customerName || data.recipientName || data.clientName || '-'}</strong></p>
        <p>${data.shippingAddress || data.address || '-'}</p>
        <p>Telp: ${data.phone || data.customerPhone || '-'}</p>
      </div>
    </div>
    <div style="font-weight:bold;margin:12px 0 4px">Perihal: Bukti Pengiriman Barang</div>
    <p style="margin:2px 0 10px;font-size:10px;color:#475569">Bersama ini diberitahukan bahwa barang-barang berikut telah dikirim:</p>
    <table class="doc-table">
      <thead><tr><th style="width:30px;text-align:center">No</th><th style="width:120px">Kode Barang</th><th>Nama Barang</th><th style="width:100px;text-align:right">Qty</th><th style="width:70px;text-align:center">Satuan</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="signatures-row">
      <div class="signature-col">
        <p>Yang Menyerahkan,</p>
        <div class="signature-space"></div>
        <div class="signature-line">${data.senderName || data.createdBy || 'Staff Warehouse'}<br/><span style="font-weight:normal;color:#64748b">${data.deliveryDate || ''}</span></div>
      </div>
    </div>
  </body></html>`;
}

export function renderGoodsTransfer(
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
      <td>
        <div style="font-family:monospace;font-weight:bold">${it.itemCode || it.kodeBarang || '-'}</div>
        <div>${it.productName || it.name || it.namaBarang || '-'}</div>
      </td>
      <td style="text-align:center">${it.unit || it.satuan || 'pcs'}</td>
      <td style="text-align:right;font-weight:bold">${Number(it.qty || it.transferQty || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
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
        <p>Telp: ${company.phone}</p>
      </div>
      <div class="doc-block">
        <h2>BUKTI TRANSFER BARANG</h2>
        <div class="doc-sub">${company.name}</div>
        <div class="doc-num">No. Transfer: ${docNumber}</div>
        <div class="doc-sub">Tanggal: ${data.transferDate || data.date || '-'}</div>
        <div class="doc-sub">Pembuat: ${data.createdBy || data.senderPic || '-'}</div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Gudang Asal:</strong> ${data.fromWarehouse || '-'}</p>
        <p><strong>Gudang Tujuan:</strong> ${data.toWarehouse || '-'}</p>
      </div>
    </div>
    <table class="doc-table">
      <thead><tr><th style="width:30px;text-align:center">#</th><th style="width:40px;text-align:center">Gambar</th><th>Barang</th><th style="width:70px;text-align:center">Satuan</th><th style="width:80px;text-align:right">Qty</th><th>Catatan</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${data.notes ? `<div class="terbilang-box" style="font-style:normal"><strong>Catatan:</strong> ${data.notes}</div>` : ''}
    <div class="signatures-row">
      <div class="signature-col">
        <p>Penerima,</p>
        <div class="signature-space"></div>
        <div class="signature-line">${data.receiverPic || data.createdBy || 'Staff Gudang'}</div>
      </div>
    </div>
  </body></html>`;
}

export function renderPoWarehouseCopy(
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
      <td style="font-family:monospace;font-weight:bold">${it.itemCode || it.materialCode || '-'}</td>
      <td><strong>${it.productName || it.name || it.materialName || '-'}</strong></td>
      <td style="text-align:right;font-weight:bold">${Number(it.qty || it.quantity || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</td>
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
        <h2>PURCHASE ORDER</h2>
        <div class="doc-sub" style="color:#0284c7;font-weight:700">Warehouse Copy</div>
        <div class="doc-sub">${company.name}</div>
        <div class="doc-num">No. PO: ${docNumber}</div>
        <div class="doc-sub">Tanggal: ${data.orderDate || data.date || '-'}</div>
        <div class="doc-sub">Jatuh Tempo: ${data.dueDate || data.orderDate || '-'}</div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Supplier:</strong></p>
        <p><strong>Nama:</strong> ${data.vendorName || data.supplierName || '-'}</p>
        <p><strong>Alamat:</strong> ${data.vendorAddress || '-'}</p>
        <p><strong>Telp:</strong> ${data.vendorPhone || '-'}</p>
      </div>
      <div class="meta-col">
        <p><strong>Warehouse:</strong></p>
        <p><strong>Nama:</strong> ${data.warehouseName || 'Gudang Bahan Baku'}</p>
        <p><strong>Alamat:</strong> ${data.warehouseAddress || company.address}</p>
        <p><strong>Telp:</strong> ${data.warehousePhone || company.phone}</p>
      </div>
    </div>
    <table class="doc-table">
      <thead><tr><th style="width:30px;text-align:center">No</th><th style="width:40px;text-align:center">Gambar</th><th style="width:110px">Kode Barang</th><th>Nama Barang</th><th style="width:90px;text-align:right">Qty</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${data.notes ? `<div class="terbilang-box" style="font-style:normal"><strong>Catatan:</strong> ${data.notes}</div>` : ''}
    <div class="signatures-row">
      <div class="signature-col">
        <p>Diterima oleh,</p>
        <div class="signature-space"></div>
        <div class="signature-line">Warehouse Staff</div>
      </div>
    </div>
  </body></html>`;
}

export function renderSuratJalan(
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
      <td><strong>${it.productName || it.name || it.namaBarang || '-'}</strong></td>
      <td style="text-align:center;font-weight:bold">${Number(it.qty || it.quantity || 0).toLocaleString('id-ID')}</td>
      <td style="text-align:center">${it.unit || it.satuan || 'pcs'}</td>
      <td>${it.notes || it.keterangan || '-'}</td>
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
        <h2>SURAT JALAN</h2>
        <div class="doc-num">No: ${docNumber}</div>
        <div class="doc-sub">Tanggal: ${data.shipDate || data.date || '-'}</div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Pengirim:</strong> ${company.name}</p>
        <p><strong>Penerima:</strong> ${data.clientName || data.customerName || '-'}</p>
        <p><strong>Alamat Tujuan:</strong> ${data.shippingAddress || data.address || '-'}</p>
      </div>
      <div class="meta-col" style="text-align:right">
        <p><strong>No. Kendaraan:</strong> ${data.vehicleNumber || '-'}</p>
        <p><strong>Driver:</strong> ${data.driverName || '-'}</p>
      </div>
    </div>
    <table class="doc-table">
      <thead><tr><th style="width:30px;text-align:center">No</th><th>Nama Barang</th><th style="width:70px;text-align:center">Jumlah</th><th style="width:60px;text-align:center">Satuan</th><th>Keterangan</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="signatures-row">
      <div class="signature-col">
        <p>Pengirim,</p>
        <div class="signature-space"></div>
        <div class="signature-line">Warehouse</div>
      </div>
      <div class="signature-col">
        <p>Penerima,</p>
        <div class="signature-space"></div>
        <div class="signature-line">...................</div>
      </div>
    </div>
    <div class="footer-note"><span>Barang yang sudah diterima tidak dapat dikembalikan kecuali ada kesepakatan tertulis.</span></div>
  </body></html>`;
}
