import fs from "fs";
import path from "path";

const targetFiles = [
  "src/app/(dashboard)/approvals/finance-approvals/page.tsx",
  "src/app/(dashboard)/finance/bayar/page.tsx",
  "src/app/(dashboard)/finance/bayar-sample/page.tsx",
  "src/app/(dashboard)/finance/fund/page.tsx",
  "src/app/(dashboard)/finance/jurnal/page.tsx",
  "src/app/(dashboard)/finance/kas/page.tsx",
  "src/app/(dashboard)/finance/piutang/page.tsx",
  "src/app/(dashboard)/penjualan/dp-finance/page.tsx",
  "src/app/(dashboard)/penjualan/sales-orders-finance/page.tsx",
  "src/app/(dashboard)/reports/finance-reports/page.tsx"
];

for (const rel of targetFiles) {
  const fp = path.resolve(rel);
  if (!fs.existsSync(fp)) continue;

  let code = fs.readFileSync(fp, "utf-8");

  // Replace import aliases
  code = code.replace(/DnaTable as Table,/g, "DnaTable,");
  code = code.replace(/DnaTableBody as TableBody,/g, "DnaTableBody,");
  code = code.replace(/DnaTd as TableCell,/g, "DnaTd,");
  code = code.replace(/DnaTh as TableHead,/g, "DnaTh,");
  code = code.replace(/DnaTableHead as TableHeader,/g, "DnaTableHead,");
  code = code.replace(/DnaTableRow as TableRow,?/g, "DnaTableRow,");

  // In case of multiline or single line without comma
  code = code.replace(/DnaTable as Table/g, "DnaTable");
  code = code.replace(/DnaTableBody as TableBody/g, "DnaTableBody");
  code = code.replace(/DnaTd as TableCell/g, "DnaTd");
  code = code.replace(/DnaTh as TableHead/g, "DnaTh");
  code = code.replace(/DnaTableHead as TableHeader/g, "DnaTableHead");
  code = code.replace(/DnaTableRow as TableRow/g, "DnaTableRow");

  // Clean duplicate commas or imports if any
  // Replace JSX tags
  code = code.replace(/<Table\b/g, "<DnaTable");
  code = code.replace(/<\/Table>/g, "</DnaTable>");
  code = code.replace(/<TableHeader\b/g, "<DnaTableHead");
  code = code.replace(/<\/TableHeader>/g, "</DnaTableHead>");
  code = code.replace(/<TableHead\b/g, "<DnaTh");
  code = code.replace(/<\/TableHead>/g, "</DnaTh>");
  code = code.replace(/<TableBody\b/g, "<DnaTableBody");
  code = code.replace(/<\/TableBody>/g, "</DnaTableBody>");
  code = code.replace(/<TableRow\b/g, "<DnaTableRow");
  code = code.replace(/<\/TableRow>/g, "</DnaTableRow>");
  code = code.replace(/<TableCell\b/g, "<DnaTd");
  code = code.replace(/<\/TableCell>/g, "</DnaTd>");

  // Also replace status="xxx" with variant="xxx" on DnaBadge
  code = code.replace(/(<DnaBadge[^>]*?)\bstatus=/g, "$1variant=");

  fs.writeFileSync(fp, code, "utf-8");
  console.log(`Successfully migrated: ${rel}`);
}
