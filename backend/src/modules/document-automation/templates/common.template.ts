export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  npwp?: string;
  website?: string;
}

export const DEFAULT_COMPANY: CompanyInfo = {
  name: 'PT. KARYA IMPIAN LABORATORIS',
  address: 'Jl. Dukuh Kupang Timur XX. No. 778. Kec Sawahan, Kota Surabaya, Jawa Timur, Indonesia',
  phone: '087702232389',
  email: 'official@dreamlab.id',
  npwp: '12.345.678.9-012.000',
  website: 'https://dreamlab.id',
};

export function formatRupiah(num: number | string | undefined | null): string {
  const val = Number(num || 0);
  return val.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatRupiahNoDecimal(num: number | string | undefined | null): string {
  const val = Math.round(Number(num || 0));
  return val.toLocaleString('id-ID');
}

export function terbilang(n: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];
  const num = Math.floor(Math.abs(n));
  if (num === 0) return 'Nol Rupiah';
  if (num < 12) return bilangan[num] + ' Rupiah';
  if (num < 20) return terbilangRaw(num - 10) + ' Belas Rupiah';
  if (num < 100) return terbilangRaw(Math.floor(num / 10)) + ' Puluh ' + terbilangRaw(num % 10) + ' Rupiah';
  if (num < 200) return 'Seratus ' + terbilangRaw(num - 100) + ' Rupiah';
  if (num < 1000) return terbilangRaw(Math.floor(num / 100)) + ' Ratus ' + terbilangRaw(num % 100) + ' Rupiah';
  if (num < 2000) return 'Seribu ' + terbilangRaw(num - 1000) + ' Rupiah';
  if (num < 1000000) return terbilangRaw(Math.floor(num / 1000)) + ' Ribu ' + terbilangRaw(num % 1000) + ' Rupiah';
  if (num < 1000000000) return terbilangRaw(Math.floor(num / 1000000)) + ' Juta ' + terbilangRaw(num % 1000000) + ' Rupiah';
  if (num < 1000000000000) return terbilangRaw(Math.floor(num / 1000000000)) + ' Milyar ' + terbilangRaw(num % 1000000000) + ' Rupiah';
  return terbilangRaw(Math.floor(num / 1000000000000)) + ' Triliun ' + terbilangRaw(num % 1000000000000) + ' Rupiah';
}

function terbilangRaw(num: number): string {
  const bilangan = [
    '', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'
  ];
  if (num < 12) return bilangan[num];
  if (num < 20) return terbilangRaw(num - 10) + ' Belas';
  if (num < 100) return terbilangRaw(Math.floor(num / 10)) + ' Puluh ' + terbilangRaw(num % 10);
  if (num < 200) return 'Seratus ' + terbilangRaw(num - 100);
  if (num < 1000) return terbilangRaw(Math.floor(num / 100)) + ' Ratus ' + terbilangRaw(num % 100);
  if (num < 2000) return 'Seribu ' + terbilangRaw(num - 1000);
  if (num < 1000000) return terbilangRaw(Math.floor(num / 1000)) + ' Ribu ' + terbilangRaw(num % 1000);
  if (num < 1000000000) return terbilangRaw(Math.floor(num / 1000000)) + ' Juta ' + terbilangRaw(num % 1000000);
  if (num < 1000000000000) return terbilangRaw(Math.floor(num / 1000000000)) + ' Milyar ' + terbilangRaw(num % 1000000000);
  return terbilangRaw(Math.floor(num / 1000000000000)) + ' Triliun ' + terbilangRaw(num % 1000000000000);
}

export function getBaseStyles(landscape = false): string {
  return `
    <style>
      @page {
        size: A4 ${landscape ? 'landscape' : 'portrait'};
        margin: 12mm 15mm;
      }
      * { box-sizing: border-box; }
      body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        color: #1e293b;
        margin: 0;
        padding: ${landscape ? '10px' : '15px'};
        font-size: 11px;
        line-height: 1.4;
      }
      .header-container {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        border-bottom: 2px solid #0f172a;
        padding-bottom: 12px;
        margin-bottom: 16px;
      }
      .company-block h1 {
        margin: 0 0 4px 0;
        font-size: 15px;
        font-weight: 800;
        letter-spacing: -0.01em;
        color: #0f172a;
      }
      .company-block p {
        margin: 1px 0;
        font-size: 9.5px;
        color: #475569;
        max-width: 380px;
      }
      .doc-block {
        text-align: right;
      }
      .doc-block h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 800;
        color: #0f172a;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .doc-block .doc-sub {
        font-size: 10px;
        color: #64748b;
        font-weight: 600;
        margin-top: 2px;
      }
      .doc-block .doc-num {
        font-size: 11px;
        color: #0f172a;
        font-weight: 700;
        margin-top: 4px;
      }
      .meta-grid {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 14px;
        font-size: 10px;
      }
      .meta-col {
        flex: 1;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        padding: 8px 12px;
      }
      .meta-col p {
        margin: 3px 0;
      }
      .meta-col strong {
        color: #0f172a;
      }
      table.doc-table {
        width: 100%;
        border-collapse: collapse;
        margin: 12px 0;
        font-size: 10px;
      }
      table.doc-table th {
        background: #0f172a;
        color: #ffffff;
        font-weight: 700;
        padding: 6px 8px;
        text-align: left;
        border: 1px solid #0f172a;
      }
      table.doc-table td {
        padding: 6px 8px;
        border: 1px solid #cbd5e1;
        vertical-align: middle;
      }
      table.doc-table tr:nth-child(even) {
        background: #f8fafc;
      }
      .badge-type {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 8.5px;
        font-weight: 700;
        color: white;
      }
      .badge-barang { background: #0284c7; }
      .badge-jasa { background: #16a34a; }
      .badge-status {
        background: #0284c7;
        color: white;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 700;
      }
      .terbilang-box {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        padding: 6px 10px;
        font-style: italic;
        font-size: 10px;
        margin: 10px 0;
      }
      .signatures-row {
        display: flex;
        justify-content: flex-end;
        gap: 60px;
        margin-top: 30px;
        page-break-inside: avoid;
      }
      .signature-col {
        text-align: center;
        min-width: 160px;
      }
      .signature-space {
        height: 55px;
      }
      .signature-line {
        border-top: 1px solid #0f172a;
        padding-top: 4px;
        font-weight: 700;
        font-size: 10px;
      }
      .lunas-stamp {
        border: 3px solid #dc2626;
        color: #dc2626;
        display: inline-block;
        padding: 4px 16px;
        font-weight: 800;
        font-size: 22px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        border-radius: 6px;
        transform: rotate(-10deg);
        box-shadow: 0 0 0 2px #fff inset;
      }
      .footer-note {
        margin-top: 25px;
        border-top: 1px solid #e2e8f0;
        padding-top: 8px;
        font-size: 8.5px;
        color: #64748b;
        display: flex;
        justify-content: space-between;
      }
    </style>
  `;
}
