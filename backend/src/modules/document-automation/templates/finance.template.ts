import {
  CompanyInfo,
  DEFAULT_COMPANY,
  formatRupiah,
  getBaseStyles,
} from './common.template';

export function renderJournalEntry(
  data: Record<string, any>,
  docNumber: string,
  company: CompanyInfo = DEFAULT_COMPANY,
): string {
  const lines = data.lines || [];
  const linesHtml = lines
    .map(
      (line: any, idx: number) => `
    <tr>
      <td style="text-align:center">${idx + 1}</td>
      <td style="font-family:monospace;font-weight:bold">${line.accountCode || '-'}</td>
      <td>${line.accountName || '-'}</td>
      <td style="text-align:right">${line.debit ? `Rp ${formatRupiah(line.debit)}` : ''}</td>
      <td style="text-align:right">${line.credit ? `Rp ${formatRupiah(line.credit)}` : ''}</td>
    </tr>
  `,
    )
    .join('');

  const totalDebit = lines.reduce(
    (sum: number, l: any) => sum + Number(l.debit || 0),
    0,
  );
  const totalCredit = lines.reduce(
    (sum: number, l: any) => sum + Number(l.credit || 0),
    0,
  );

  return `<!DOCTYPE html><html><head><meta charset="utf-8">${getBaseStyles()}</head><body>
    <div class="header-container">
      <div class="company-block">
        <h1>${company.name}</h1>
        <p>${company.address}</p>
        <p>Jurnal Akuntansi</p>
      </div>
      <div class="doc-block">
        <h2>JURNAL UMUM</h2>
        <div class="doc-num">${docNumber}</div>
        <div class="doc-sub">Tanggal: ${data.date || new Date().toISOString().split('T')[0]}</div>
      </div>
    </div>
    <div class="meta-grid">
      <div class="meta-col">
        <p><strong>Deskripsi:</strong> ${data.description || '-'}</p>
        <p><strong>Referensi:</strong> ${data.reference || '-'}</p>
      </div>
    </div>
    <table class="doc-table">
      <thead><tr><th style="width:30px;text-align:center">No</th><th style="width:100px">Kode Akun</th><th>Nama Akun</th><th style="width:120px;text-align:right">Debit</th><th style="width:120px;text-align:right">Kredit</th></tr></thead>
      <tbody>
        ${linesHtml}
        <tr style="background:#f1f5f9;font-weight:bold"><td colspan="3" style="text-align:right">TOTAL</td><td style="text-align:right">Rp ${formatRupiah(totalDebit)}</td><td style="text-align:right">Rp ${formatRupiah(totalCredit)}</td></tr>
      </tbody>
    </table>
    ${data.notes ? `<div class="terbilang-box" style="font-style:normal"><strong>Catatan:</strong> ${data.notes}</div>` : ''}
    <div class="signatures-row">
      <div class="signature-col">
        <p>Disiapkan Oleh,</p>
        <div class="signature-space"></div>
        <div class="signature-line">Finance Accounting</div>
      </div>
    </div>
  </body></html>`;
}

export function renderGenericDocument(
  data: Record<string, any>,
  docNumber: string,
  docType: string,
  company: CompanyInfo = DEFAULT_COMPANY,
): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">${getBaseStyles()}</head><body>
    <div class="header-container">
      <div class="company-block"><h1>${company.name}</h1></div>
      <div class="doc-block"><h2>${docType}</h2><div class="doc-num">${docNumber}</div></div>
    </div>
    <pre style="font-size:10px;white-space:pre-wrap;background:#f8fafc;padding:12px;border:1px solid #e2e8f0;border-radius:4px">${JSON.stringify(data, null, 2)}</pre>
  </body></html>`;
}
