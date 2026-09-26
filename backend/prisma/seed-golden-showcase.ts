// @ts-nocheck
import 'dotenv/config';
import {
  PrismaClient,
  UserRole,
  AccountType,
  NormalBalance,
  ReportGroup,
  MaterialType,
  MaterialStatus,
  LocationType,
  MachineType,
  LifecycleStatus,
  QCStatus,
  Division,
  ProdStage,
  QcInspectionPhase,
  QcDefectCategory,
  QcDisposition,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function runGoldenShowcaseSeed() {
  console.log('🌟 [GOLDEN SHOWCASE] Seeding end-to-end live cosmetic manufacturing scenario...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ──────────────────────────────────────────────
  // 1. CORE OPERATIONAL USERS
  // ──────────────────────────────────────────────
  console.log('  1️⃣  Ensuring Core Staff Users...');
  const userSpecs = [
    { email: 'superadmin@dreamlab.com', fullName: 'Dr. Hendra Kusuma (Direktur)', roles: [UserRole.SUPER_ADMIN, UserRole.DIRECTOR, UserRole.QC_LAB, UserRole.COMMERCIAL] },
    { email: 'sales@dreamlab.com', fullName: 'Siti Aminah (Head of Commercial)', roles: [UserRole.COMMERCIAL, UserRole.MARKETING] },
    { email: 'rnd@dreamlab.com', fullName: 'Ratna Paramitha (Lead Formulator)', roles: [UserRole.RND] },
    { email: 'scm@dreamlab.com', fullName: 'Bambang Sudiro (Head of SCM)', roles: [UserRole.SCM, UserRole.PURCHASING] },
    { email: 'warehouse@dreamlab.com', fullName: 'Ahmad Fauzi (Warehouse Supervisor)', roles: [UserRole.WAREHOUSE] },
    { email: 'production@dreamlab.com', fullName: 'Wahyu Hidayat (Production Head)', roles: [UserRole.PRODUCTION, UserRole.PRODUCTION_OP] },
    { email: 'qc@dreamlab.com', fullName: 'Dewi Lestari (QC Lab Officer)', roles: [UserRole.QC_LAB] },
    { email: 'apj@dreamlab.com', fullName: 'Apt. Sarah Wijaya, S.Farm (APJ Farmasis)', roles: [UserRole.APJ, UserRole.QC_LAB, UserRole.SUPER_ADMIN] },
    { email: 'finance@dreamlab.com', fullName: 'Budi Santoso (Accounting & Finance)', roles: [UserRole.FINANCE] },
    { email: 'hr@dreamlab.com', fullName: 'Maya Indah (People & Culture)', roles: [UserRole.HR] },
  ];

  const userMap: Record<string, any> = {};
  for (const spec of userSpecs) {
    const u = await prisma.user.upsert({
      where: { email: spec.email },
      update: { fullName: spec.fullName, roles: spec.roles },
      create: {
        email: spec.email,
        fullName: spec.fullName,
        passwordHash: hashedPassword,
        roles: spec.roles,
        status: 'ACTIVE',
      },
    });
    userMap[spec.email] = u;
  }

  // ──────────────────────────────────────────────
  // 2. CHART OF ACCOUNTS (FINANCE FOUNDATION)
  // ──────────────────────────────────────────────
  console.log('  2️⃣  Seeding Chart of Accounts (COA)...');
  const accounts = [
    { code: '1110', name: 'Bank BCA Operasional', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '1111', name: 'Bank Mandiri Penerimaan Maklon', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '1201', name: 'Piutang Usaha Klien Maklon', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '1301', name: 'Persediaan Bahan Baku Aktif & Eksipien', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '1302', name: 'Persediaan Kemasan Primer & Sekunder', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '1303', name: 'Persediaan Ruahan / Bulk Dalam Proses (WIP)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '1304', name: 'Persediaan Produk Jadi (WH-03)', type: AccountType.ASSET, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.CURRENT_ASSET },
    { code: '2101', name: 'Hutang Usaha Pemasok Bahan', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY },
    { code: '2301', name: 'Uang Muka Penjualan (Down Payment)', type: AccountType.LIABILITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.CURRENT_LIABILITY },
    { code: '3100', name: 'Modal Disetor Perseroan', type: AccountType.EQUITY, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.EQUITY },
    { code: '4101', name: 'Pendapatan Kontrak Maklon Kosmetik', type: AccountType.REVENUE, normalBalance: NormalBalance.CREDIT, reportGroup: ReportGroup.OPERATING_REVENUE },
    { code: '5100', name: 'HPP - Biaya Bahan Baku & Kemas', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS },
    { code: '5110', name: 'HPP - Biaya Tenaga Kerja Langsung', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS },
    { code: '5190', name: 'Biaya Kerugian Karantina & Scrap (COPQ)', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.COGS },
    { code: '6201', name: 'Beban Operasional & Gaji Karyawan', type: AccountType.EXPENSE, normalBalance: NormalBalance.DEBIT, reportGroup: ReportGroup.OPEX },
  ];

  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: { name: acc.name },
      create: acc,
    });
  }

  // ──────────────────────────────────────────────
  // 3. WAREHOUSES & LOCATIONS
  // ──────────────────────────────────────────────
  console.log('  3️⃣  Seeding Warehouses & Bins...');
  let whRaw = await prisma.warehouse.findFirst({ where: { name: 'Pabrik Utama Surabaya' } });
  if (!whRaw) {
    whRaw = await prisma.warehouse.create({
      data: {
        name: 'Pabrik Utama Surabaya',
        picName: userMap['warehouse@dreamlab.com'].fullName,
        description: 'Gudang pusat penyimpanan bahan baku, packaging, dan ruahan',
        status: 'ACTIVE',
      },
    });
  }

  let whFG = await prisma.warehouse.findFirst({ where: { name: 'Gudang Produk Jadi (WH-03)' } });
  if (!whFG) {
    whFG = await prisma.warehouse.create({
      data: {
        name: 'Gudang Produk Jadi (WH-03)',
        picName: userMap['warehouse@dreamlab.com'].fullName,
        description: 'Gudang penyimpanan produk jadi ber-AC sesuai cGMP/CPKB',
        status: 'ACTIVE',
      },
    });
  }

  let whQuarantine = await prisma.warehouse.findFirst({ where: { name: 'Gudang Karantina (GK-01)' } });
  if (!whQuarantine) {
    whQuarantine = await prisma.warehouse.create({
      data: {
        name: 'Gudang Karantina (GK-01)',
        picName: userMap['qc@dreamlab.com'].fullName,
        description: 'Area isolasi bahan/produk gagal QC atau menunggu release APJ',
        status: 'ACTIVE',
      },
    });
  }

  // ──────────────────────────────────────────────
  // 4. SUPPLIERS & RAW MATERIALS
  // ──────────────────────────────────────────────
  console.log('  4️⃣  Seeding Suppliers & Raw Materials...');
  let supplierChem = await prisma.supplier.findFirst({ where: { name: 'PT Chemindo Prima Sentosa' } });
  if (!supplierChem) {
    supplierChem = await prisma.supplier.create({
      data: {
        name: 'PT Chemindo Prima Sentosa',
        contact: '081299887766',
        performanceScore: 4.8,
      },
    });
  }

  let supplierPack = await prisma.supplier.findFirst({ where: { name: 'PT Packindo Botol Makmur' } });
  if (!supplierPack) {
    supplierPack = await prisma.supplier.create({
      data: {
        name: 'PT Packindo Botol Makmur',
        contact: '081122334455',
        performanceScore: 4.6,
      },
    });
  }

  const materialsList = [
    { code: 'RAW-NIACIN-01', name: 'Niacinamide USP Grade 99.8%', type: MaterialType.RAW_MATERIAL, unit: 'KG', unitPrice: 125000, stockQty: 500, minLevel: 50, maxLevel: 2000, reorderPoint: 100 },
    { code: 'RAW-HYALURON-01', name: 'Hyaluronic Acid Multi-Molecular 1%', type: MaterialType.RAW_MATERIAL, unit: 'KG', unitPrice: 280000, stockQty: 250, minLevel: 25, maxLevel: 1000, reorderPoint: 50 },
    { code: 'RAW-AQUA-01', name: 'Aqua Demineralisata (USP Grade)', type: MaterialType.RAW_MATERIAL, unit: 'LITER', unitPrice: 3500, stockQty: 10000, minLevel: 1000, maxLevel: 25000, reorderPoint: 2000 },
    { code: 'PKG-BOTTLE-30ML', name: 'Botol Kaca Serum 30ml Amber + Pipet Rubber', type: MaterialType.PACKAGING_PRIMARY, unit: 'PCS', unitPrice: 3600, stockQty: 25000, minLevel: 5000, maxLevel: 100000, reorderPoint: 10000 },
    { code: 'PKG-BOX-SERUM', name: 'Outer Box Folding Serum Doff Emboss Gold', type: MaterialType.PACKAGING_SECONDARY, unit: 'PCS', unitPrice: 1200, stockQty: 25000, minLevel: 5000, maxLevel: 100000, reorderPoint: 10000 },
  ];

  const materialMap: Record<string, any> = {};
  for (const m of materialsList) {
    let mat = await prisma.materialItem.findFirst({ where: { code: m.code } });
    if (!mat) {
      mat = await prisma.materialItem.create({ data: m });
    }
    materialMap[m.code] = mat;

    // Create / Update Inventory Batch
    const inv = await prisma.materialInventory.findFirst({ where: { materialId: mat.id } });
    if (!inv) {
      await prisma.materialInventory.create({
        data: {
          materialId: mat.id,
          supplierId: m.type === MaterialType.RAW_MATERIAL ? supplierChem.id : supplierPack.id,
          batchNumber: `LOT-${m.code.slice(0, 6)}-2609`,
          currentStock: m.stockQty,
          qcStatus: QCStatus.GOOD,
          expDate: new Date(Date.now() + 730 * 86400000), // +2 tahun
        },
      });
    }
  }

  // ──────────────────────────────────────────────
  // 5. PRODUCTION MACHINES
  // ──────────────────────────────────────────────
  console.log('  5️⃣  Seeding Machines...');
  const machines = [
    { name: 'Homogenizer Vacuum Mixer 500L (M-01)', type: MachineType.MIXING_VESSEL, capacityPerBatch: 500, costPerHour: 65000 },
    { name: 'Auto Rotary Filling & Capping 30ml (F-01)', type: MachineType.FILLING_MACHINE, capacityPerBatch: 2500, costPerHour: 45000 },
    { name: 'Conveyor Packaging & Shrink Tunnel (P-01)', type: MachineType.PACKAGING_LINE, capacityPerBatch: 3000, costPerHour: 35000 },
  ];

  const machineMap: Record<string, any> = {};
  for (const mach of machines) {
    let m = await prisma.machine.findFirst({ where: { name: mach.name } });
    if (!m) {
      m = await prisma.machine.create({ data: mach });
    }
    machineMap[mach.name] = m;
  }

  // ──────────────────────────────────────────────
  // 6. CLIENT, LEAD & FORMULA (R&D)
  // ──────────────────────────────────────────────
  console.log('  6️⃣  Seeding Client, Sales Lead & R&D Formula...');
  let staff = await prisma.bussdevStaff.findFirst({ where: { userId: userMap['sales@dreamlab.com'].id } });
  if (!staff) {
    staff = await prisma.bussdevStaff.create({
      data: {
        userId: userMap['sales@dreamlab.com'].id,
        name: userMap['sales@dreamlab.com'].fullName,
        targetRevenue: 2500000000,
        isActive: true,
      },
    });
  }

  let lead = await prisma.salesLead.findFirst({ where: { clientName: 'PT Glow Skin Global' } });
  if (!lead) {
    lead = await prisma.salesLead.create({
      data: {
        clientName: 'PT Glow Skin Global',
        contactInfo: '081234567890',
        source: 'DIRECT',
        status: 'WON_DEAL',
        productInterest: 'Brightening Barrier Glow Serum 30ml',
        picId: staff.id,
      },
    });
  }

  let sample = await prisma.sampleRequest.findFirst({ where: { leadId: lead.id } });
  if (!sample) {
    sample = await prisma.sampleRequest.create({
      data: {
        sampleCode: 'SMP-2609-001',
        leadId: lead.id,
        productName: 'Brightening Barrier Glow Serum 30ml',
        targetFunction: 'Mencerahkan dan memperkuat skin barrier',
        textureReq: 'Watery Gel Serum Cepat Meresap',
        colorReq: 'Transparan Light Amber',
        aromaReq: 'Fresh Neroli Blossom 0.1%',
        stage: 'SAMPLE_APPROVED',
      },
    });
  }

  let formula = await prisma.formula.findFirst({ where: { sampleRequestId: sample.id } });
  if (!formula) {
    formula = await prisma.formula.create({
      data: {
        formulaCode: 'FOR-GLOW-2026-001',
        sampleRequestId: sample.id,
        status: 'PRODUCTION_LOCKED',
        version: 1,
      },
    });

    // Add QC Target Reference for this Formula
    await prisma.qCParameter.upsert({
      where: { formulaId: formula.id },
      update: {},
      create: {
        formulaId: formula.id,
        targetPh: '5.2 - 5.8',
        targetViscosity: '2500 - 3200 cPs',
        targetColor: 'Transparan Amber Lembut',
        targetAroma: 'Neroli Lembut Khas',
        appearance: 'Jernih homogen, bebas partikel asing',
      },
    });
  }

  // ──────────────────────────────────────────────
  // 7. SALES ORDER & DOWN PAYMENT INVOICE
  // ──────────────────────────────────────────────
  console.log('  7️⃣  Seeding Sales Order & Invoice...');
  let customer = await prisma.customer.findFirst({ where: { name: 'PT Glow Skin Global' } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: 'PT Glow Skin Global',
        code: 'CUST-GLOW-01',
        email: 'procurement@glowskin.co.id',
        phone: '081234567890',
        address: 'Jl. Senopati No. 45, Jakarta Selatan',
      },
    });
  }

  let so = await prisma.salesOrder.findFirst({ where: { leadId: lead.id } });
  if (!so) {
    so = await prisma.salesOrder.create({
      data: {
        soNumber: 'SO-2026-0512',
        customerId: customer.id,
        leadId: lead.id,
        status: 'CONFIRMED',
        totalAmount: 350000000, // Rp 350 Juta
        targetCompletion: new Date(Date.now() + 30 * 86400000),
      },
    });

    // Add Sales Order Item
    await prisma.salesOrderItem.create({
      data: {
        salesOrderId: so.id,
        productName: 'Brightening Barrier Glow Serum 30ml',
        quantity: 10000,
        unitPrice: 35000,
        subtotal: 350000000,
      },
    });

    // Add 50% Down Payment Invoice
    await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2026-DP-0512',
        salesOrderId: so.id,
        type: 'DOWN_PAYMENT',
        totalAmount: 175000000,
        status: 'PAID',
        paidAt: new Date(),
      },
    });
  }

  // ──────────────────────────────────────────────
  // 8. MANUFACTURING WORK ORDER & LOGS (BMR)
  // ──────────────────────────────────────────────
  console.log('  8️⃣  Seeding Work Order, Schedules & Production Logs...');
  let plan = await prisma.productionPlan.findFirst({ where: { batchNo: 'BATCH-2026-GLOW-001' } });
  if (!plan) {
    plan = await prisma.productionPlan.create({
      data: {
        soId: so.id,
        adminId: userMap['production@dreamlab.com'].id,
        batchNo: 'BATCH-2026-GLOW-001',
        status: LifecycleStatus.PACKING,
        formulaId: formula.id,
        apjStatus: 'WAITING',
      },
    });
  }

  let wo = await prisma.workOrder.findFirst({ where: { woNumber: 'WO-2026-0001' } });
  if (!wo) {
    wo = await prisma.workOrder.create({
      data: {
        woNumber: 'WO-2026-0001',
        leadId: lead.id,
        planId: plan.id,
        targetQty: 10000,
        stage: LifecycleStatus.PACKING,
        targetCompletion: new Date(Date.now() + 7 * 86400000),
      },
    });
  }

  // Mixing Schedule & Log
  let mixSch = await prisma.productionSchedule.findFirst({ where: { scheduleNumber: 'SCH-MIX-2609-01' } });
  if (!mixSch) {
    mixSch = await prisma.productionSchedule.create({
      data: {
        scheduleNumber: 'SCH-MIX-2609-01',
        workOrderId: wo.id,
        machineId: machineMap['Homogenizer Vacuum Mixer 500L (M-01)'].id,
        stage: ProdStage.MIXING,
        startTime: new Date(Date.now() - 72 * 3600000),
        endTime: new Date(Date.now() - 70 * 3600000),
        targetQty: 10000,
        resultQty: 10000,
        status: 'COMPLETED',
      },
    });

    const mixStepLog = await prisma.productionStepLog.create({
      data: {
        woId: plan.id,
        stage: ProdStage.MIXING,
        inputQty: 300,
        qtyResult: 298,
        qtyQuarantine: 298,
        qtyReject: 2,
      },
    });

    await prisma.productionLog.create({
      data: {
        logNumber: 'LOG-MIX-2609-01',
        workOrderId: wo.id,
        planId: plan.id,
        stage: LifecycleStatus.MIXING,
        inputQty: 300,
        goodQty: 298,
        quarantineQty: 298,
        rejectQty: 2,
        notes: 'Mixing selesai homogen, uji lab pH 5.5 - PASSED',
      },
    });

    // QC Audit for Mixing Bulk
    await prisma.qCAudit.create({
      data: {
        stepLogId: mixStepLog.id,
        qcId: userMap['qc@dreamlab.com'].id,
        status: QCStatus.GOOD,
        phase: QcInspectionPhase.MIXING,
        phValue: 5.5,
        viscosityValue: 2850,
        densityValue: 1.025,
        homogenityPass: true,
        notes: 'Hasil lab curah memenuhi standar rujukan CPKB.',
      },
    });
  }

  // Packaging Schedule & Log
  let packSch = await prisma.productionSchedule.findFirst({ where: { scheduleNumber: 'SCH-PACK-2609-01' } });
  if (!packSch) {
    packSch = await prisma.productionSchedule.create({
      data: {
        scheduleNumber: 'SCH-PACK-2609-01',
        workOrderId: wo.id,
        machineId: machineMap['Conveyor Packaging & Shrink Tunnel (P-01)'].id,
        stage: ProdStage.PACKING,
        startTime: new Date(Date.now() - 24 * 3600000),
        endTime: new Date(Date.now() - 22 * 3600000),
        targetQty: 10000,
        resultQty: 9900,
        status: 'COMPLETED',
      },
    });

    await prisma.productionStepLog.create({
      data: {
        woId: plan.id,
        stage: ProdStage.PACKING,
        inputQty: 9950,
        qtyResult: 9900,
        qtyQuarantine: 9900,
        qtyReject: 50,
      },
    });

    await prisma.productionLog.create({
      data: {
        logNumber: 'LOG-PACK-2609-01',
        workOrderId: wo.id,
        planId: plan.id,
        stage: LifecycleStatus.PACKING,
        inputQty: 9950,
        goodQty: 9900,
        quarantineQty: 9900,
        rejectQty: 50,
        notes: 'Kemas sekunder tuntas. 9.900 pcs produk jadi diserahkan ke Karantina WH-03.',
      },
    });
  }

  // Finished Goods in QUARANTINE awaiting APJ Release
  let fg = await prisma.finishedGood.findFirst({ where: { woId: plan.id } });
  if (!fg) {
    fg = await prisma.finishedGood.create({
      data: {
        woId: plan.id,
        stockQty: 9900,
      },
    });
  }

  // ──────────────────────────────────────────────
  // 9. QC CHECKLISTS (CPKB COMPLIANCE PROTOCOLS)
  // ──────────────────────────────────────────────
  console.log('  9️⃣  Seeding Real QC Checklists (9-Stage Protocols)...');
  const checklistProtocols = [
    {
      title: 'Audit Mutu & CPKB: Sunscreen Glow Gel SPF 50 30ml',
      salesOrderId: so.id,
      workOrderId: wo.id,
      createdById: userMap['qc@dreamlab.com'].id,
      status: 'IN_PROGRESS',
      notes: 'Protokol CPKB batch perdana, verifikasi parameter stabilitas fisika-kimia.',
      items: [
        { id: 'item-1', label: 'Verifikasi Desain Logo & Label Sesuai Regulasi BPOM', isRequired: true },
        { id: 'item-2', label: 'Uji Mikrobiologi ALT & Patogen Ruahan', isRequired: true },
        { id: 'item-3', label: 'Pemeriksaan Organoleptik & Homogenitas Bulk', isRequired: true },
        { id: 'item-4', label: 'Uji Kebocoran Botol & Torsi Penutup Dropper', isRequired: true },
        { id: 'item-5', label: 'Verifikasi Inkjet Expired Date & Lot Number', isRequired: true },
        { id: 'item-6', label: 'Otorisasi Rilis Resmi APJ (SIPA)', isRequired: true },
      ],
      completedItems: ['item-1', 'item-2', 'item-3', 'item-4'],
    },
    {
      title: 'Audit Mutu & CPKB: Brightening Barrier Glow Serum 30ml',
      salesOrderId: so.id,
      workOrderId: wo.id,
      createdById: userMap['qc@dreamlab.com'].id,
      status: 'PENDING',
      notes: 'Batch 9.900 pcs berada di ruang karantina WH-03 menunggu ttd rilis APJ.',
      items: [
        { id: 'item-1', label: 'Pemeriksaan Kedatangan Kemasan Primer Amber 30ml', isRequired: true },
        { id: 'item-2', label: 'Uji pH & Viskositas Ruahan (Spesifikasi 5.2 - 5.8)', isRequired: true },
        { id: 'item-3', label: 'Pengecekan Kebersihan Mesin Homogenizer', isRequired: true },
        { id: 'item-4', label: 'Pemeriksaan Kerapatan Segel Induksi Foil', isRequired: true },
        { id: 'item-5', label: 'Sertifikat Analisis (CoA) Terverifikasi', isRequired: true },
        { id: 'item-6', label: 'Otorisasi Rilis Resmi APJ (SIPA)', isRequired: true },
      ],
      completedItems: ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'],
    },
    {
      title: 'Pemeriksaan Rutin Higienitas & Kalibrasi Mesin Mixing',
      createdById: userMap['qc@dreamlab.com'].id,
      status: 'COMPLETED',
      notes: 'Kalibrasi pH meter, viskometer Brookfield, dan sanitasi tangki selesai 100%.',
      items: [
        { id: 'item-1', label: 'Sanitasi CIP (Clean-in-Place) Tangki 500L', isRequired: true },
        { id: 'item-2', label: 'Kalibrasi Probe pH Meter Buffer 4 & 7', isRequired: true },
        { id: 'item-3', label: 'Verifikasi Timbangan Presisi 3 Desimal', isRequired: true },
      ],
      completedItems: ['item-1', 'item-2', 'item-3'],
    },
  ];

  for (const proto of checklistProtocols) {
    const existing = await prisma.qCChecklist.findFirst({ where: { title: proto.title } });
    if (!existing) {
      await prisma.qCChecklist.create({ data: proto });
    }
  }

  // ──────────────────────────────────────────────
  // 10. REJECT / QUARANTINE EXCEPTION (GUDANG KARANTINA)
  // ──────────────────────────────────────────────
  console.log('  🔟  Seeding Quarantine Exception Records...');
  const rejectAudit = await prisma.qCAudit.findFirst({ where: { defectType: 'Botol Retak / Cacat Tekanan' } });
  if (!rejectAudit) {
    await prisma.qCAudit.create({
      data: {
        qcId: userMap['qc@dreamlab.com'].id,
        status: QCStatus.REJECT,
        phase: QcInspectionPhase.PACKING,
        defectCategory: QcDefectCategory.KEMASAN,
        defectType: 'Botol Retak / Cacat Tekanan',
        defectCause: 'Benturan saat handling pallet supplier',
        notes: '50 unit botol serum retak rambut, ditolak dan dialihkan ke Gudang Karantina untuk disposal.',
        disposition: QcDisposition.SCRAP,
      },
    });
  }

  console.log('');
  console.log('🎉 [GOLDEN SHOWCASE] Seeding successfully completed!');
  console.log('   👤 Login Akun:');
  console.log('      • Super Admin: superadmin@dreamlab.com | pass: password123');
  console.log('      • APJ Farmasis: apj@dreamlab.com | pass: password123');
  console.log('      • QC Officer:  qc@dreamlab.com  | pass: password123');
  console.log('      • SCM/Gudang:  warehouse@dreamlab.com | pass: password123');
}

if (require.main === module) {
  runGoldenShowcaseSeed()
    .catch((err) => {
      console.error('❌ Error executing Golden Showcase seed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
