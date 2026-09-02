import { Project, ProjectHealthSummary } from "@/types/project-control";

export const MOCK_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "Winning Formula R&D 2026",
    objective: "Mengembangkan 5 formula hero produk skincare baru dengan margin HPP di bawah 15%.",
    definitionOfDone: "5 Formula selesai diuji stabilitas 3 bulan, Lulus QC rilis micro, CoA disetujui APJ, dan HPP disetujui Finance & BusDev.",
    department: "R&D",
    owner: "Dr. Hendra Wijaya",
    pic: "Siti Aminah",
    sponsor: "Direktur Operasional",
    priority: "URGENT",
    startDate: "2026-06-01",
    deadline: "2026-09-15",
    status: "AT_RISK",
    progress: 60,
    currentMilestone: "Validasi Bahan Aktif Alternatif",
    currentMilestoneDue: "2026-09-05",
    decisionRequired: true,
    activeDecision: {
      id: "dec-1",
      projectId: "proj-1",
      title: "Persetujuan Supplier Bahan Aktif Retinol Impor",
      description: "Supplier A menawarkan lead time 14 hari tapi MOQ 500kg. Supplier B tanpa MOQ tapi lead time 45 hari.",
      requestedBy: "Siti Aminah",
      requestedAt: "2026-08-30 09:00",
      decisionOwner: "Direktur Utama",
      optionsRecommendation: "Rekomendasi memilih Supplier A untuk mengamankan deadline rilis Oktober.",
      impactIfDelayed: "Penundaan rilis 1 bulan & potensi kehilangan pasar kuartal 4.",
      status: "OPEN"
    },
    blocker: {
      id: "blk-1",
      projectId: "proj-1",
      title: "Konfirmasi MOQ Supplier Retinol Tertunda",
      description: "Menunggu persetujuan diskresi MOQ dari Purchasing & Direksi.",
      severity: "HIGH",
      owner: "Budi Santoso (Purchase)",
      createdAt: "2026-08-28",
      expectedResolution: "2026-09-03",
      status: "ACTIVE"
    },
    lastUpdate: "2026-09-01 14:30",
    kpiLinked: true,
    milestones: [
      { id: "m1", sequence: 1, milestone: "Studi Literatur & Formulasi Awal", pic: "Siti Aminah", startDate: "2026-06-01", deadline: "2026-06-15", status: "DONE", isMandatory: true, evidence: "Doc_Formula_v1.pdf", verifiedBy: "Dr. Hendra", verifiedAt: "2026-06-16" },
      { id: "m2", sequence: 2, milestone: "Uji Stabilitas Accelerate (1 Bulan)", pic: "Siti Aminah", startDate: "2026-06-16", deadline: "2026-07-16", status: "DONE", isMandatory: true, evidence: "Stability_Report_M1.pdf", verifiedBy: "Dr. Hendra", verifiedAt: "2026-07-17" },
      { id: "m3", sequence: 3, milestone: "Validasi Bahan Aktif Alternatif", pic: "Siti Aminah", startDate: "2026-07-17", deadline: "2026-09-05", status: "IN_PROGRESS", isMandatory: true, blocker: "Waiting Supplier MOQ Confirmation" },
      { id: "m4", sequence: 4, milestone: "Uji Organoleptik & Homogenitas Bulk", pic: "Agus Pratama", startDate: "2026-09-06", deadline: "2026-09-10", status: "NOT_STARTED", isMandatory: true },
      { id: "m5", sequence: 5, milestone: "Final Sign-off APJ & HPP Finance", pic: "Dr. Hendra Wijaya", startDate: "2026-09-11", deadline: "2026-09-15", status: "NOT_STARTED", isMandatory: true }
    ]
  },
  {
    id: "proj-2",
    name: "ERP PO & SCM Integration",
    objective: "Mengintegrasikan modul Purchase Order dengan Inventory Gudang & Accounting secara otomatis.",
    definitionOfDone: "Seluruh PO tergenerasi otomatis dari MRP, approval digital terhubung ke Telegram/Email Direksi, dan auto-reconcile invoice 100%.",
    department: "IT / SYSTEM",
    owner: "Rian Hidayat",
    pic: "Rian Hidayat",
    sponsor: "Direktur Keuangan",
    priority: "HIGH",
    startDate: "2026-07-01",
    deadline: "2026-09-30",
    status: "OFF_TRACK",
    progress: 40,
    currentMilestone: "Webhooks API Purchasing & Warehouse",
    currentMilestoneDue: "2026-08-25",
    decisionRequired: false,
    blocker: {
      id: "blk-2",
      projectId: "proj-2",
      title: "API Endpoint SCM Belum Siap dari Vendor Third Party",
      description: "Sistem legacy SCM belum merilis Swagger documentation.",
      severity: "CRITICAL",
      owner: "Rian Hidayat",
      createdAt: "2026-08-20",
      expectedResolution: "2026-09-08",
      status: "ACTIVE"
    },
    lastUpdate: "2026-08-31 10:00",
    kpiLinked: true,
    milestones: [
      { id: "m21", sequence: 1, milestone: "Database Schema & Migration", pic: "Rian Hidayat", startDate: "2026-07-01", deadline: "2026-07-15", status: "DONE", isMandatory: true, verifiedBy: "Rian", verifiedAt: "2026-07-16" },
      { id: "m22", sequence: 2, milestone: "Webhooks API Purchasing & Warehouse", pic: "Rian Hidayat", startDate: "2026-07-16", deadline: "2026-08-25", status: "OVERDUE", isMandatory: true, blocker: "Vendor documentation missing" },
      { id: "m23", sequence: 3, milestone: "User Acceptance Testing (UAT) SCM Team", pic: "Dewi Kartika", startDate: "2026-08-26", deadline: "2026-09-15", status: "NOT_STARTED", isMandatory: true },
      { id: "m24", sequence: 4, milestone: "Go Live & Training User", pic: "Rian Hidayat", startDate: "2026-09-16", deadline: "2026-09-30", status: "NOT_STARTED", isMandatory: true }
    ]
  },
  {
    id: "proj-3",
    name: "Catalog Packaging Premium 2026",
    objective: "Penyusunan katalog fisik & digital 50+ botol & jar akrilik baru untuk penawaran maklon premium.",
    definitionOfDone: "Semua foto high-res 3D render siap, spesifikasi ukuran & MOQ divalidasi Purchase, dan materi siap kirim ke klien.",
    department: "CREATIVE",
    owner: "Andi Saputra",
    pic: "Maya Putri",
    sponsor: "Head of BusDev",
    priority: "MEDIUM",
    startDate: "2026-08-01",
    deadline: "2026-09-20",
    status: "ON_TRACK",
    progress: 75,
    currentMilestone: "3D Render & Color Matching Packaging",
    currentMilestoneDue: "2026-09-08",
    decisionRequired: false,
    lastUpdate: "2026-09-02 08:30",
    kpiLinked: true,
    milestones: [
      { id: "m31", sequence: 1, milestone: "Sampling Botol Baru dari Vendor", pic: "Maya Putri", startDate: "2026-08-01", deadline: "2026-08-15", status: "DONE", isMandatory: true, verifiedBy: "Andi", verifiedAt: "2026-08-15" },
      { id: "m32", sequence: 2, milestone: "Fotografi & Mockup 3D", pic: "Maya Putri", startDate: "2026-08-16", deadline: "2026-08-30", status: "DONE", isMandatory: true, verifiedBy: "Andi", verifiedAt: "2026-08-30" },
      { id: "m33", sequence: 3, milestone: "Layout Booklet Digital & Cetak", pic: "Maya Putri", startDate: "2026-08-31", deadline: "2026-09-12", status: "IN_PROGRESS", isMandatory: true },
      { id: "m34", sequence: 4, milestone: "Review Harga & MOQ dengan Purchasing", pic: "Budi Santoso", startDate: "2026-09-13", deadline: "2026-09-20", status: "NOT_STARTED", isMandatory: true }
    ]
  },
  {
    id: "proj-4",
    name: "Kualifikasi Lini Produksi Mixing 03 (Tank 500L)",
    objective: "Instalasi & kualifikasi mesin mixing tank 500L baru untuk meningkatkan kapasitas produksi 40%.",
    definitionOfDone: "Instalasi selesai, Kualifikasi Mesin (IQ/OQ/PQ) disetujui QA/APJ, dan 3 batch trial sukses tanpa kendala.",
    department: "PRODUCTION",
    owner: "Bambang Perkasa",
    pic: "Agus Pratama",
    sponsor: "Direktur Utama",
    priority: "HIGH",
    startDate: "2026-07-15",
    deadline: "2026-10-15",
    status: "NOT_UPDATED",
    progress: 50,
    currentMilestone: "Pemasangan Piping & Electrical Tank 03",
    currentMilestoneDue: "2026-08-28",
    decisionRequired: true,
    activeDecision: {
      id: "dec-4",
      projectId: "proj-4",
      title: "Penambahan Power Panel Listrik 3-Phase",
      description: "Daya listrik eksisting di Line B tidak mencukupi untuk pemanas tank 500L. Butuh penambahan panel Listrik Rp 35 Juta.",
      requestedBy: "Agus Pratama",
      requestedAt: "2026-08-27",
      decisionOwner: "Direktur Operasional",
      impactIfDelayed: "Uji coba mesin terhenti dan jadwal produksi Oktober terancam.",
      status: "OPEN"
    },
    lastUpdate: "2026-08-26 11:00", // > 2 days ago
    kpiLinked: true,
    milestones: [
      { id: "m41", sequence: 1, milestone: "Inbound Mesin & Setup Pondasi", pic: "Agus Pratama", startDate: "2026-07-15", deadline: "2026-07-31", status: "DONE", isMandatory: true, verifiedBy: "Bambang", verifiedAt: "2026-08-01" },
      { id: "m42", sequence: 2, milestone: "Pemasangan Piping & Electrical Tank 03", pic: "Agus Pratama", startDate: "2026-08-01", deadline: "2026-08-28", status: "OVERDUE", isMandatory: true, blocker: "Power panel upgrade required" },
      { id: "m43", sequence: 3, milestone: "Kualifikasi Instalasi & Operasional (IQ/OQ)", pic: "Siti QA", startDate: "2026-08-29", deadline: "2026-09-20", status: "NOT_STARTED", isMandatory: true },
      { id: "m44", sequence: 4, milestone: "Kualifikasi Performa (PQ) 3 Batch Trial", pic: "Agus Pratama", startDate: "2026-09-21", deadline: "2026-10-15", status: "NOT_STARTED", isMandatory: true }
    ]
  },
  {
    id: "proj-5",
    name: "Sertifikasi CPKB Izin Edar BPOM Batch 2026",
    objective: "Pembaruan izin edar 15 SKU produk existing dan pengajuan 5 SKU kosmetik baru.",
    definitionOfDone: "Seluruh NIE (Nomor Izin Edar) diterbitkan BPOM dan dokumen audit CPKB diperbarui.",
    department: "LEGAL / APJ",
    owner: "Apt. Nurul Huda",
    pic: "Apt. Nurul Huda",
    sponsor: "Direktur Utama",
    priority: "URGENT",
    startDate: "2026-05-01",
    deadline: "2026-11-01",
    status: "ON_TRACK",
    progress: 80,
    currentMilestone: "Audit Dokumen Formularium BPOM",
    currentMilestoneDue: "2026-09-15",
    decisionRequired: false,
    lastUpdate: "2026-09-02 09:15",
    kpiLinked: true,
    milestones: [
      { id: "m51", sequence: 1, milestone: "Penyusunan Dokumen Informasi Produk (DIP)", pic: "Apt. Nurul Huda", startDate: "2026-05-01", deadline: "2026-06-30", status: "DONE", isMandatory: true, verifiedBy: "Nurul", verifiedAt: "2026-07-01" },
      { id: "m52", sequence: 2, milestone: "Submit Berkas e-BPOM & Pembayaran PNBP", pic: "Apt. Nurul Huda", startDate: "2026-07-01", deadline: "2026-08-15", status: "DONE", isMandatory: true, verifiedBy: "Nurul", verifiedAt: "2026-08-16" },
      { id: "m53", sequence: 3, milestone: "Audit Dokumen Formularium BPOM", pic: "Apt. Nurul Huda", startDate: "2026-08-16", deadline: "2026-09-15", status: "IN_PROGRESS", isMandatory: true },
      { id: "m54", sequence: 4, milestone: "Penerbitan NIE & Rilis Sertifikat", pic: "Apt. Nurul Huda", startDate: "2026-09-16", deadline: "2026-11-01", status: "NOT_STARTED", isMandatory: true }
    ]
  }
];

export const MOCK_PROJECT_HEALTH: ProjectHealthSummary = {
  totalActive: 5,
  onTrack: 2,
  atRisk: 1,
  offTrack: 1,
  notUpdated: 1,
  needDecision: 2,
  completedThisMonth: 1
};
