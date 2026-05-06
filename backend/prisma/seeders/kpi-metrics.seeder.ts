import { PrismaClient, Division } from '@prisma/client';

interface KpiMetricSeed {
  eventCode: string;
  label: string;
  points: number;
  division: Division;
  description: string;
}

const METRICS: KpiMetricSeed[] = [
  // === BD (Business Development) ===
  { eventCode: 'LEAD_WON', label: 'Lead Menjadi Deal', points: 50, division: Division.BD, description: 'Lead berhasil menjadi Won Deal' },
  { eventCode: 'LEAD_LOST', label: 'Lead Hilang', points: -20, division: Division.BD, description: 'Lead gagal / lost' },
  { eventCode: 'SO_PAID', label: 'Sales Order Lunas', points: 30, division: Division.BD, description: 'Pembayaran SO lunas' },
  { eventCode: 'SAMPLE_APPROVED', label: 'Sample Disetujui', points: 25, division: Division.BD, description: 'Sample request approved oleh klien' },
  { eventCode: 'TARGET_MONTHLY_ACHIEVED', label: 'Target Bulanan Tercapai', points: 40, division: Division.BD, description: 'Revenue target bulanan tercapai' },
  { eventCode: 'NEW_LEAD_CREATED', label: 'Lead Baru Masuk', points: 10, division: Division.BD, description: 'Lead baru terdaftar' },

  // === RND (Research & Development) ===
  { eventCode: 'FORMULA_APPROVED_FIRST_TRY', label: 'Formula Disetujui Percobaan Pertama', points: 40, division: Division.RND, description: 'Formula approved tanpa revisi' },
  { eventCode: 'SAMPLE_ON_TIME', label: 'Sample Tepat Waktu', points: 30, division: Division.RND, description: 'Sample selesai sebelum deadline' },
  { eventCode: 'SAMPLE_LATE', label: 'Sample Terlambat', points: -15, division: Division.RND, description: 'Sample melewati deadline' },
  { eventCode: 'LAB_TEST_PASS', label: 'Lab Test Lulus', points: 20, division: Division.RND, description: 'Lab test berhasil pass' },
  { eventCode: 'FORMULA_REVISION', label: 'Formula Direvisi', points: -10, division: Division.RND, description: 'Formula perlu revisi dari klien' },
  { eventCode: 'BOM_CREATED', label: 'BOM Berhasil Dibuat', points: 15, division: Division.RND, description: 'Bill of Material selesai' },

  // === MARKETING ===
  { eventCode: 'LEAD_GENERATED', label: 'Lead Tergenerate dari Iklan', points: 15, division: Division.BD, description: 'Iklan menghasilkan lead baru' },
  { eventCode: 'CONTENT_POSTED', label: 'Konten Terposting', points: 5, division: Division.CREATIVE, description: 'Konten berhasil dipublikasi' },
  { eventCode: 'ROAS_ABOVE_2', label: 'ROAS di Atas 2x', points: 25, division: Division.BD, description: 'Return on ad spend > 2x' },
  { eventCode: 'CAMPAIGN_COMPLETED', label: 'Kampanye Selesai', points: 10, division: Division.BD, description: 'Kampanye marketing selesai tepat waktu' },
  { eventCode: 'ENGAGEMENT_HIGH', label: 'Engagement Tinggi', points: 15, division: Division.CREATIVE, description: 'Engagement rate di atas target' },

  // === FINANCE ===
  { eventCode: 'INVOICE_PAID_ON_TIME', label: 'Invoice Dibayar Tepat Waktu', points: 20, division: Division.FINANCE, description: 'Pembayaran invoice sebelum due date' },
  { eventCode: 'REPORT_SUBMITTED', label: 'Laporan Keuangan Tepat Waktu', points: 25, division: Division.FINANCE, description: 'Laporan keuangan periodik disubmit' },
  { eventCode: 'RECON_DONE', label: 'Rekonsiliasi Selesai', points: 15, division: Division.FINANCE, description: 'Rekonsiliasi bank/buku selesai' },
  { eventCode: 'PAYMENT_VERIFIED', label: 'Pembayaran Terverifikasi', points: 10, division: Division.FINANCE, description: 'Verifikasi pembayaran selesai' },
  { eventCode: 'BUDGET_OVERRUN', label: 'Anggaran Melebihi Batas', points: -20, division: Division.FINANCE, description: 'Pengeluaran melebihi anggaran' },

  // === PRODUCTION ===
  { eventCode: 'BATCH_COMPLETED', label: 'Batch Produksi Selesai', points: 20, division: Division.PRODUCTION, description: 'Satu batch produksi completed' },
  { eventCode: 'ON_TIME_DELIVERY', label: 'Pengiriman Tepat Waktu', points: 25, division: Division.PRODUCTION, description: 'Produk siap kirim sesuai jadwal' },
  { eventCode: 'NO_REWORK', label: 'Zero Rework', points: 30, division: Division.PRODUCTION, description: 'Batch lolos tanpa perlu rework' },
  { eventCode: 'PRODUCTION_DELAY', label: 'Keterlambatan Produksi', points: -15, division: Division.PRODUCTION, description: 'Batch melewati deadline produksi' },
  { eventCode: 'MATERIAL_SHORTAGE', label: 'Kekurangan Material', points: -10, division: Division.PRODUCTION, description: 'Produksi terhambat kurang material' },
  { eventCode: 'WORK_ORDER_COMPLETED', label: 'Work Order Selesai', points: 15, division: Division.PRODUCTION, description: 'Work Order completed' },

  // === QC (Quality Control) ===
  { eventCode: 'QC_AUDIT_PASS', label: 'QC Audit Lulus', points: 25, division: Division.QC, description: 'Audit QC lulus tanpa temuan' },
  { eventCode: 'ZERO_REJECT', label: 'Zero Reject', points: 35, division: Division.QC, description: 'Semua sampel lolos QC' },
  { eventCode: 'STABILITY_TEST_DONE', label: 'Stability Test Selesai', points: 20, division: Division.QC, description: 'Uji stabilitas selesai tepat waktu' },
  { eventCode: 'QC_REJECT', label: 'QC Reject', points: -10, division: Division.QC, description: 'QC menemukan batch reject' },

  // === WAREHOUSE ===
  { eventCode: 'INBOUND_COMPLETED', label: 'Barang Masuk Selesai', points: 15, division: Division.WAREHOUSE, description: 'Inbound receiving selesai' },
  { eventCode: 'OUTBOUND_COMPLETED', label: 'Barang Keluar Selesai', points: 15, division: Division.WAREHOUSE, description: 'Outbound delivery selesai' },
  { eventCode: 'STOCK_OPNAME_DONE', label: 'Stock Opname Selesai', points: 25, division: Division.WAREHOUSE, description: 'Stock opname periodik selesai' },
  { eventCode: 'INVENTORY_ACCURATE', label: 'Inventory Akurat', points: 20, division: Division.WAREHOUSE, description: 'Selisih stock 0 setelah opname' },
  { eventCode: 'STOCK_MISMATCH', label: 'Selisih Stock', points: -15, division: Division.WAREHOUSE, description: 'Ditemukan selisih stock' },

  // === COMPLIANCE / LEGAL ===
  { eventCode: 'BPOM_REGISTERED', label: 'BPOM Terdaftar', points: 30, division: Division.LEGAL, description: 'Produk terdaftar BPOM' },
  { eventCode: 'HKI_FILED', label: 'HKI Diajukan', points: 25, division: Division.LEGAL, description: 'Pendaftaran HKI/HAKI selesai' },
  { eventCode: 'HALAL_CERTIFIED', label: 'Sertifikat Halal Terbit', points: 35, division: Division.LEGAL, description: 'Sertifikasi halal selesai' },
  { eventCode: 'AUDIT_PASS', label: 'Audit Internal Lulus', points: 30, division: Division.LEGAL, description: 'Audit internal tanpa temuan mayor' },

  // === SCM (Supply Chain / Purchasing) ===
  { eventCode: 'PO_PLACED', label: 'Purchase Order Dibuat', points: 10, division: Division.SCM, description: 'PO berhasil dibuat' },
  { eventCode: 'PO_RECEIVED_ON_TIME', label: 'Barang PO Tepat Waktu', points: 20, division: Division.SCM, description: 'Barang tiba sesuai estimasi' },
  { eventCode: 'SUPPLIER_GOOD_PRICE', label: 'Harga Supplier Kompetitif', points: 15, division: Division.SCM, description: 'Negosiasi harga di bawah budget' },
  { eventCode: 'PO_LATE', label: 'PO Terlambat', points: -10, division: Division.SCM, description: 'Barang tiba melewati estimasi' },

  // === HR ===
  { eventCode: 'PAYROLL_GENERATED', label: 'Payroll Tergenerate', points: 15, division: Division.MANAGEMENT, description: 'Payroll periodik berhasil digenerate' },
  { eventCode: 'ATTENDANCE_100', label: 'Absensi 100%', points: 20, division: Division.MANAGEMENT, description: 'Absensi sebulan penuh tanpa alpha' },
  { eventCode: 'HIRING_COMPLETED', label: 'Rekrutmen Selesai', points: 25, division: Division.MANAGEMENT, description: 'Proses hiring selesai' },
];

export async function seedKpiMetrics(prisma: PrismaClient) {
  console.log('🌱 Seeding KPI Metric Definitions...');

  for (const m of METRICS) {
    await prisma.kpiMetricDefinition.upsert({
      where: { eventCode: m.eventCode },
      update: {
        label: m.label,
        points: m.points,
        division: m.division,
        description: m.description,
        isActive: true,
      },
      create: {
        eventCode: m.eventCode,
        label: m.label,
        points: m.points,
        division: m.division,
        description: m.description,
        isActive: true,
      },
    });
  }

  console.log(`  ✅ ${METRICS.length} KPI Metrics defined.`);
}
