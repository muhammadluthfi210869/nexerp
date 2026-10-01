import { toast } from "sonner";

export interface ExportColumn<T = any> {
  header: string;
  accessor?: keyof T | ((item: T) => any);
  key?: string;
}

export interface ExportCsvOptions<T = any> {
  filename?: string;
  title?: string;
  data: T[];
  columns?: ExportColumn<T>[];
  headers?: string[];
}

/**
 * Cleanly format any cell value for CSV / Spreadsheet export
 */
function formatCellValue(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "Ya" : "Tidak";
  if (val instanceof Date) return val.toLocaleDateString("id-ID");
  if (typeof val === "object") {
    // If it's a React element or complex object, try to extract textual representation
    if (val.props && val.props.children) {
      if (typeof val.props.children === "string" || typeof val.props.children === "number") {
        return String(val.props.children);
      }
    }
    return JSON.stringify(val);
  }
  return String(val).replace(/\r?\n|\r/g, " ").trim();
}

/**
 * Trigger a real browser file download
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Universal CSV / Excel export function
 */
export function exportToCsv<T = any>({
  filename = `export-${new Date().toISOString().slice(0, 10)}.csv`,
  data,
  columns,
  headers,
}: ExportCsvOptions<T>): boolean {
  if (!data || data.length === 0) {
    toast.warning("Tidak ada data untuk diekspor!");
    return false;
  }

  // Ensure .csv extension
  const safeFilename = filename.endsWith(".csv") ? filename : `${filename}.csv`;

  let headerRow: string[] = [];
  let extractors: ((item: T) => any)[] = [];

  if (columns && columns.length > 0) {
    headerRow = columns.map((col) => col.header);
    extractors = columns.map((col) => {
      if (typeof col.accessor === "function") {
        return col.accessor;
      }
      if (col.accessor) {
        const key = col.accessor as keyof T;
        return (item: T) => item[key];
      }
      if (col.key) {
        const key = col.key as keyof T;
        return (item: T) => item[key];
      }
      return () => "";
    });
  } else if (headers && headers.length > 0) {
    headerRow = headers;
    const firstRow = data[0] as Record<string, any>;
    const keys = Object.keys(firstRow);
    extractors = keys.map((k) => (item: any) => item[k]);
  } else {
    // Auto-detect keys from first object
    const firstRow = data[0] as Record<string, any>;
    const keys = Object.keys(firstRow).filter(
      (k) => !["lineItems", "timeline", "rawStatus", "id"].includes(k)
    );
    headerRow = keys.map((k) =>
      k
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase())
        .trim()
    );
    extractors = keys.map((k) => (item: any) => item[k]);
  }

  const rows = data.map((item) => extractors.map((fn) => formatCellValue(fn(item))));

  // Prepend UTF-8 BOM (\uFEFF) so Excel correctly handles Indonesian accents and formatting
  const csvContent =
    "\uFEFF" +
    [
      headerRow.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
    ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, safeFilename);

  toast.success("Ekspor Berhasil Diunduh", {
    description: `${data.length} baris data berhasil disimpan sebagai ${safeFilename}.`,
  });
  return true;
}

/**
 * Universal printable document export
 */
export function exportToPrintableDocument({
  title,
  subtitle,
  headers,
  rows,
}: {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    toast.error("Gagal membuka jendela cetak. Pastikan pop-up diizinkan.");
    return;
  }

  const dateStr = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 32px;
      color: #0f172a;
      background: #ffffff;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0;
      color: #0f172a;
    }
    .subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .date {
      font-size: 11px;
      color: #64748b;
      text-align: right;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 8px 10px;
      border-bottom: 1px solid #cbd5e1;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
      font-size: 10px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">${title}</h1>
      ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
    </div>
    <div class="date">
      <div>Dicetak pada: ${dateStr}</div>
      <div>Sistem: NEX ERP System</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 30px; text-align: center;">#</th>
        ${headers.map((h) => `<th>${h}</th>`).join("")}
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (row, idx) => `
        <tr>
          <td style="text-align: center; color: #94a3b8;">${idx + 1}</td>
          ${row.map((cell) => `<td>${cell !== null && cell !== undefined ? cell : "-"}</td>`).join("")}
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="footer">
    <div>Total: ${rows.length} Baris Data</div>
    <div>Dokumen Resmi Internal — Rahasia & Terbatas</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
