/**
 * Aurora Beauty Showcase Seed (R4 Shadow)
 *
 * Idempotent fixture for the R4 shadow database. Covers BusDev, R&D, SCM,
 * Warehouse, Production, QC, and Finance with coherent PT Aurora Beauty
 * Indonesia records. Uses upsert by stable unique keys (natural unique
 * fields where they exist, fixed UUIDs where they don't). Never deletes.
 *
 * Run: npx ts-node prisma/seed-aurora-showcase.ts
 * Re-run is safe — every record is upserted and counts are unchanged.
 *
 * Context: 2026-08-31 — UI finalization sprint, business-ready is PAUSED.
 * This seed populates visual/operational records only. It does NOT pretend
 * the Shipment→Finance Golden Flow has passed.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  AccountType,
  ApprovalStatus,
  InboundStatus,
  InvoiceCategory,
  InvoiceStatus,
  InvoiceType,
  LifecycleStatus,
  MaterialStatus,
  MaterialType,
  NormalBalance,
  PaymentType,
  PeriodStatus,
  PRPriority,
  PRStatus,
  POStatus,
  QCStatus,
  QcInspectionPhase,
  ReportGroup,
  SampleStage,
  TransactionType,
  UserRole,
  UserStatus,
  WorkflowStatus,
} from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const ID = (slug: string) =>
  // Stable UUID v5-like from a namespace; here we use a fixed namespace plus the slug.
  // ponytail: deterministic IDs enable idempotent upserts without deleteMany.
  require('crypto')
    .createHash('md5')
    .update(`aurora-showcase:${slug}`)
    .digest('hex')
    .replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

const IDR = (n: number) => n.toFixed(2);

async function main() {
  console.log('🌸 AURORA SHOWCASE SEED — idempotent');
  const t0 = Date.now();

  // ─── USERS (named, role-tagged) ─────────────────────────────────
  const users = [
    { slug: 'budi.bd',       fullName: 'Budi Hartono',     email: 'budi.hartono@nexerp.id',      roles: [UserRole.COMMERCIAL] },
    { slug: 'rini.rnd',      fullName: 'Rini Kusuma',      email: 'rini.kusuma@nexerp.id',       roles: [UserRole.RND] },
    { slug: 'eko.scm',       fullName: 'Eko Saputra',      email: 'eko.saputra@nexerp.id',       roles: [UserRole.SCM, UserRole.PURCHASING] },
    { slug: 'dewi.wh',       fullName: 'Dewi Anggraini',   email: 'dewi.anggraini@nexerp.id',    roles: [UserRole.WAREHOUSE] },
    { slug: 'agus.prod',     fullName: 'Agus Pranoto',     email: 'agus.pranoto@nexerp.id',      roles: [UserRole.PRODUCTION, UserRole.PPIC] },
    { slug: 'sinta.qc',      fullName: 'Sinta Mardiyah',   email: 'sinta.mardiyah@nexerp.id',    roles: [UserRole.QC_LAB] },
    { slug: 'hendra.fin',    fullName: 'Hendra Wijaya',    email: 'hendra.wijaya@nexerp.id',     roles: [UserRole.FINANCE] },
  ];
  const userBySlug: Record<string, string> = {};
  for (const u of users) {
    const id = ID(`user:${u.slug}`);
    const row = await prisma.user.upsert({
      where: { email: u.email },
      update: { fullName: u.fullName, roles: u.roles, status: UserStatus.ACTIVE },
      create: { id, email: u.email, fullName: u.fullName, roles: u.roles, status: UserStatus.ACTIVE },
    });
    userBySlug[u.slug] = row.id;
  }
  console.log(`  ✓ users: ${users.length}`);

  // ─── BUSSDEV STAFF ──────────────────────────────────────────────
  const bdsId = ID('staff:budi');
  const bds = await prisma.bussdevStaff.upsert({
    where: { id: bdsId },
    update: { name: 'Budi Hartono', targetRevenue: '5000000000' },
    create: {
      id: bdsId,
      name: 'Budi Hartono',
      targetRevenue: '5000000000',
      userId: userBySlug['budi.bd'],
      avgClosingDays: 18,
      totalLeads: 24,
      totalWon: 9,
      totalLost: 4,
    },
  });

  // ─── SALES LEADS (5–8, varied stages) ──────────────────────────
  const leads = [
    { brand: 'PT Aurora Beauty Indonesia',     code: 'AURORA', contact: 'ratna.sari@aurora-beauty.co.id',   interest: 'Body Lotion Premium 100 ml',     value: 375000000, stage: WorkflowStatus.NEGOTIATION,     city: 'Jakarta Selatan', source: 'INSTAGRAM', repeat: true,  high: true  },
    { brand: 'PT Natura Skincare Nusantara',   code: 'NATURA', contact: 'adi.wibowo@natura-skincare.id',     interest: 'Facial Wash Gentle 150 ml',       value: 125000000, stage: WorkflowStatus.SAMPLE_REQUESTED, city: 'Bandung',         source: 'TIKTOK',     repeat: false, high: false },
    { brand: 'CV Lumiere Personal Care',       code: 'LUMIERE',contact: 'bella.putri@lumiere-cosmetics.id',  interest: 'Brightening Serum 20 ml',         value: 75000000,  stage: WorkflowStatus.SAMPLE_APPROVED,   city: 'Surabaya',       source: 'LINKTREE',   repeat: false, high: false },
    { brand: 'PT Senja Kosmetika',             code: 'SENJA',  contact: 'putu.ananda@senja-kosmetik.co.id', interest: 'Body Scrub Coffee 200 ml',        value: 90000000,  stage: WorkflowStatus.SPK_SIGNED,       city: 'Denpasar',       source: 'WEBSITE',    repeat: false, high: false },
    { brand: 'PT Aruna Wellness Indonesia',    code: 'ARUNA',  contact: 'dimas.pratama@aruna-wellness.id',  interest: 'Body Lotion Premium 100 ml',     value: 210000000, stage: WorkflowStatus.DP_PAID,          city: 'Yogyakarta',     source: 'GOOGLE',     repeat: true,  high: true  },
    { brand: 'PT Sinar Pagi Kosmetindo',       code: 'SINAR',  contact: 'lina.wijaya@sinar-pagi.co.id',     interest: 'Facial Wash Gentle 150 ml',       value: 45000000,  stage: WorkflowStatus.NEW_LEAD,         city: 'Semarang',       source: 'OFFLINE',    repeat: false, high: false },
  ];
  for (const l of leads) {
    await prisma.salesLead.upsert({
      where: { brandCode: l.code },
      update: {
        contactInfo: l.contact,
        productInterest: l.interest,
        estimatedValue: l.value,
        status: l.stage,
        city: l.city,
        isRepeatOrder: l.repeat,
        isHighValue: l.high,
      },
      create: {
        brandName: l.brand,
        brandCode: l.code,
        clientName: l.brand,
        contactInfo: l.contact,
        productInterest: l.interest,
        estimatedValue: l.value,
        status: l.stage,
        picId: bds.id,
        city: l.city,
        source: l.source,
        isRepeatOrder: l.repeat,
        isHighValue: l.high,
        hkiMode: 'NEW',
        paymentType: PaymentType.PREPAID,
        marginPercentage: '32.50',
        moq: 1000,
        planOmset: l.value,
      },
    });
  }
  console.log(`  ✓ sales_leads: ${leads.length}`);

  // ─── R&D STAFF ──────────────────────────────────────────────────
  const rndId = ID('staff:rini');
  await prisma.rndStaff.upsert({
    where: { id: rndId },
    update: { name: 'Rini Kusuma', specialty: 'Cosmetic Emulsion & Active' },
    create: { id: rndId, name: 'Rini Kusuma', specialty: 'Cosmetic Emulsion & Active', maxWeeklyCapacity: 6 },
  });

  // ─── SAMPLE REQUESTS (4–6, varied stages) ──────────────────────
  const auroraLead = await prisma.salesLead.findUnique({ where: { brandCode: 'AURORA' } });
  const naturaLead = await prisma.salesLead.findUnique({ where: { brandCode: 'NATURA' } });
  const lumiereLead = await prisma.salesLead.findUnique({ where: { brandCode: 'LUMIERE' } });
  const senjaLead = await prisma.salesLead.findUnique({ where: { brandCode: 'SENJA' } });

  type SampleSpec = {
    code: string;
    productName: string;
    fn: string;        // targetFunction
    texture: string;
    color: string;
    aroma: string;
    stage: SampleStage;
    leadId: string | null | undefined;
  };
  const samples: SampleSpec[] = [
    { code: 'SMP-AUR-001', productName: 'Body Lotion Premium 100 ml',   fn: 'Moisturizing 24h',     texture: 'Light lotion',     color: 'Ivory',       aroma: 'White tea',   stage: SampleStage.APPROVED,     leadId: auroraLead?.id },
    { code: 'SMP-AUR-002', productName: 'Body Lotion Premium 200 ml',   fn: 'Moisturizing 24h',     texture: 'Light lotion',     color: 'Ivory',       aroma: 'White tea',   stage: SampleStage.CLIENT_REVIEW,leadId: auroraLead?.id },
    { code: 'SMP-NAT-001', productName: 'Facial Wash Gentle 150 ml',    fn: 'Cleansing, low foam',  texture: 'Clear gel',        color: 'Translucent', aroma: 'Chamomile',   stage: SampleStage.READY_TO_SHIP,leadId: naturaLead?.id },
    { code: 'SMP-LUM-001', productName: 'Brightening Serum 20 ml',      fn: 'Niacinamide brightening', texture: 'Watery serum', color: 'Translucent', aroma: 'Rose',        stage: SampleStage.LAB_TEST,    leadId: lumiereLead?.id },
    { code: 'SMP-SEN-001', productName: 'Body Scrub Coffee 200 ml',     fn: 'Exfoliation, coffee',  texture: 'Granular scrub',   color: 'Brown',       aroma: 'Coffee',      stage: SampleStage.SHIPPED,      leadId: senjaLead?.id },
  ];
  for (const s of samples) {
    if (!s.leadId) continue;
    await prisma.sampleRequest.upsert({
      where: { sampleCode: s.code },
      update: { stage: s.stage },
      create: {
        sampleCode: s.code,
        leadId: s.leadId,
        productName: s.productName,
        targetFunction: s.fn,
        textureReq: s.texture,
        colorReq: s.color,
        aromaReq: s.aroma,
        stage: s.stage,
        picId: rndId,
        rndId: userBySlug['rini.rnd'],
        difficultyLevel: 2,
      },
    });
  }
  console.log(`  ✓ sample_requests: ${samples.length}`);

  // ─── BILL OF MATERIALS + FORMULA for Aurora samples ─────────────
  // Materials are created below; here we reference them by code.
  const sampleAur001 = await prisma.sampleRequest.findUnique({ where: { sampleCode: 'SMP-AUR-001' } });

  // ─── SUPPLIERS ──────────────────────────────────────────────────
  const suppliers = [
    { id: ID('sup:chemindo'),   name: 'PT Chemindo Sentosa',         city: 'Jakarta',     score: 4.8 },
    { id: ID('sup:natura-bali'),name: 'CV Natura Bali Lestari',      city: 'Denpasar',    score: 4.6 },
    { id: ID('sup:pack-pro'),   name: 'PT Pack Pro Indonesia',       city: 'Bekasi',      score: 4.7 },
    { id: ID('sup:aroma-jaya'), name: 'PT Aroma Jaya Mandiri',       city: 'Surabaya',    score: 4.4 },
  ];
  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { id: s.id },
      update: { name: s.name, city: s.city, performanceScore: s.score },
      create: { id: s.id, name: s.name, city: s.city, performanceScore: s.score, contact: 'purchasing@' + s.name.toLowerCase().replace(/[^a-z]/g, '') + '.id' },
    });
  }

  // ─── WAREHOUSE ──────────────────────────────────────────────────
  const whId = ID('wh:cikarang');
  await prisma.warehouse.upsert({
    where: { id: whId },
    update: { name: 'Gudang Cikarang Pusat' },
    create: {
      id: whId,
      name: 'Gudang Cikarang Pusat',
      picName: 'Dewi Anggraini',
      province: 'Jawa Barat',
      city: 'Cikarang',
      address: 'Kawasan Industri Jababeka, Cikarang',
      status: 'ACTIVE',
      phone: '021-8990-1122',
    },
  });

  // ─── MATERIAL ITEMS (8 with realistic SKU/codes) ────────────────
  const materials = [
    { code: 'RM-AQUA-100',  name: 'Aqua DM',                  type: MaterialType.RAW_MATERIAL, unit: 'KG', price: 12000,    min: 100, max: 1000, reorder: 200, qty: 850 },
    { code: 'RM-GLYC-101',  name: 'Glycerin',                 type: MaterialType.RAW_MATERIAL, unit: 'KG', price: 38000,    min: 30,  max: 300,  reorder: 60,  qty: 180 },
    { code: 'RM-NIAC-102',  name: 'Niacinamide',              type: MaterialType.RAW_MATERIAL, unit: 'KG', price: 720000,   min: 5,   max: 50,   reorder: 10,  qty: 4 },     // LOW
    { code: 'RM-FRAG-103',  name: 'Fragrance White Tea',      type: MaterialType.RAW_MATERIAL, unit: 'KG', price: 1450000,  min: 2,   max: 30,   reorder: 5,   qty: 14 },
    { code: 'RM-PRES-104',  name: 'Preservative Euxyl PE9010', type: MaterialType.RAW_MATERIAL, unit: 'KG', price: 540000,   min: 3,   max: 30,   reorder: 6,   qty: 22 },
    { code: 'PK-BTL-200',   name: 'Bottle PET 100 ml + Pump',  type: MaterialType.PACKAGING,    unit: 'PCS',price: 4200,     min: 500, max: 8000, reorder: 1000, qty: 6800 },
    { code: 'PK-LBL-201',   name: 'Label Sticker Premium',    type: MaterialType.LABEL,        unit: 'PCS',price: 750,      min: 500, max: 8000, reorder: 1000, qty: 5400 },
    { code: 'PK-BOX-202',   name: 'Carton Box 12 pcs',        type: MaterialType.BOX,          unit: 'PCS',price: 3500,     min: 100, max: 1500, reorder: 250,  qty: 1200 },
  ];
  const materialByCode: Record<string, string> = {};
  for (const m of materials) {
    const row = await prisma.materialItem.upsert({
      where: { code: m.code },
      update: {
        name: m.name,
        type: m.type,
        unit: m.unit,
        unitPrice: IDR(m.price),
        minLevel: IDR(m.min),
        maxLevel: IDR(m.max),
        reorderPoint: IDR(m.reorder),
        stockQty: IDR(m.qty),
        status: MaterialStatus.ACTIVE,
      },
      create: {
        code: m.code,
        name: m.name,
        type: m.type,
        unit: m.unit,
        unitPrice: IDR(m.price),
        minLevel: IDR(m.min),
        maxLevel: IDR(m.max),
        reorderPoint: IDR(m.reorder),
        stockQty: IDR(m.qty),
        status: MaterialStatus.ACTIVE,
        isCritical: m.code === 'RM-NIAC-102',
        leadTime: 7,
        outMethod: 'FIFO',
      },
    });
    materialByCode[m.code] = row.id;
  }
  console.log(`  ✓ material_items: ${materials.length}`);

  // ─── MATERIAL INVENTORY (one batch per material) ────────────────
  for (const m of materials) {
    const invId = ID(`inv:${m.code}:A`);
    await prisma.materialInventory.upsert({
      where: { id: invId },
      update: { currentStock: IDR(m.qty) },
      create: {
        id: invId,
        materialId: materialByCode[m.code],
        supplierId: suppliers[0].id,
        batchNumber: `LOT-${m.code}-A`,
        currentStock: IDR(m.qty),
        reservedQty: '0',
        qcStatus: QCStatus.GOOD,
        receivingDate: new Date('2026-08-15'),
        lastRestock: new Date('2026-08-15'),
      },
    });
    await prisma.inventoryTransaction.upsert({
      where: { commandKey: `aurora-seed:in:${m.code}` },
      update: {},
      create: {
        materialId: materialByCode[m.code],
        type: TransactionType.INBOUND,
        quantity: IDR(m.qty),
        referenceNo: `SEED-AURORA-${m.code}`,
        notes: 'Aurora showcase seed initial stock',
        warehouseId: whId,
        performedBy: 'dewi.anggraini@nexerp.id',
        commandKey: `aurora-seed:in:${m.code}`,
        createdAt: new Date('2026-08-15'),
      },
    });
  }

  // ─── BoM for Aurora samples ─────────────────────────────────────
  if (sampleAur001) {
    const aqua = materialByCode['RM-AQUA-100'];
    const gly = materialByCode['RM-GLYC-101'];
    const nic = materialByCode['RM-NIAC-102'];
    const fra = materialByCode['RM-FRAG-103'];
    const pre = materialByCode['RM-PRES-104'];
    await prisma.billOfMaterial.deleteMany({ where: { sampleId: sampleAur001.id } });
    const data = [
      { sampleId: sampleAur001.id, materialId: aqua, quantityPerUnit: '78.50' },
      { sampleId: sampleAur001.id, materialId: gly,  quantityPerUnit: '12.00' },
      { sampleId: sampleAur001.id, materialId: nic,  quantityPerUnit: '4.00'  },
      { sampleId: sampleAur001.id, materialId: fra,  quantityPerUnit: '3.00'  },
      { sampleId: sampleAur001.id, materialId: pre,  quantityPerUnit: '2.50'  },
    ];
    for (const d of data) {
      await prisma.billOfMaterial.create({ data: d });
    }
    console.log(`  ✓ bill_of_materials: 5 (for AUR-001)`);
  }

  // ─── FORMULA (one per sample, simple single-phase) ──────────────
  async function ensureFormula(sampleId: string, sampleCode: string) {
    const formulaCode = `FRM-${sampleCode}`;
    const formulaId = ID(`formula:${formulaCode}`);
    await prisma.formula.upsert({
      where: { formulaCode },
      update: { status: 'SAMPLE_LOCKED' },
      create: {
        id: formulaId,
        formulaCode,
        sampleRequestId: sampleId,
        version: 1,
        status: 'SAMPLE_LOCKED',
        targetYieldGram: '1000.000',
        lockedById: userBySlug['rini.rnd'],
      },
    });
    return formulaId;
  }
  const formulaIds: Record<string, string> = {};
  for (const s of samples) {
    const sample = await prisma.sampleRequest.findUnique({ where: { sampleCode: s.code } });
    if (sample) formulaIds[s.code] = await ensureFormula(sample.id, s.code);
  }
  console.log(`  ✓ formulas: ${Object.keys(formulaIds).length}`);

  // ─── SCM: Goods Requirement, Purchase Request, Purchase Order ───
  const auroraLeadFull = auroraLead!;
  const soNumber = 'SO-AUR-001';
  const sampleForSO = sampleAur001!;
  const soId = ID('so:aur-001');
  await prisma.salesOrder.upsert({
    where: { orderNumber: soNumber },
    update: {},
    create: {
      id: soId,
      orderNumber: soNumber,
      transactionDate: new Date('2026-08-20'),
      leadId: auroraLeadFull.id,
      sampleId: sampleForSO.id,
      formulaId: formulaIds['SMP-AUR-001'],
      totalAmount: '187500000',
      quantity: 1500,
      status: 'ACTIVE',
      stockStatus: 'READY',
      salesCategory: 'BODYCARE',
      brandName: 'Aurora Premium Body Lotion',
    },
  });

  const reqCode = 'GR-AUR-001';
  const reqId = ID('gr:aur-001');
  await prisma.goodsRequirement.upsert({
    where: { code: reqCode },
    update: {},
    create: {
      id: reqId,
      code: reqCode,
      salesOrderId: soId,
      salesOrderVersion: 1,
      formulaId: formulaIds['SMP-AUR-001'],
      formulaVersion: 1,
      date: new Date('2026-08-20'),
      status: 'CONFIRMED',
      notes: 'Showcase fixture — Aurora body lotion 1500 pcs',
    },
  });

  // Purchase requests (idempotent via unique idempotencyKey)
  const pr1Key = 'aurora-seed:pr:1';
  const pr1Id = ID('pr:1');
  await prisma.purchaseRequest.upsert({
    where: { requirementId_idempotencyKey: { requirementId: reqId, idempotencyKey: pr1Key } },
    update: {},
    create: {
      id: pr1Id,
      requestDate: new Date('2026-08-21'),
      warehouseId: whId,
      priority: PRPriority.HIGH,
      status: PRStatus.APPROVED,
      supplierId: suppliers[0].id,
      requirementId: reqId,
      idempotencyKey: pr1Key,
      notes: 'Showcase PR — niacinamide + fragrance top-up',
      createdById: userBySlug['eko.scm'],
    },
  });
  const pr2Key = 'aurora-seed:pr:2';
  const pr2Id = ID('pr:2');
  await prisma.purchaseRequest.upsert({
    where: { requirementId_idempotencyKey: { requirementId: reqId, idempotencyKey: pr2Key } },
    update: {},
    create: {
      id: pr2Id,
      requestDate: new Date('2026-08-22'),
      warehouseId: whId,
      priority: PRPriority.MEDIUM,
      status: PRStatus.SUBMITTED,
      supplierId: suppliers[2].id,
      requirementId: reqId,
      idempotencyKey: pr2Key,
      notes: 'Showcase PR — packaging top-up',
      createdById: userBySlug['eko.scm'],
    },
  });
  console.log(`  ✓ purchase_requests: 2`);

  // Purchase orders
  const po1Number = 'PO-AUR-001';
  await prisma.purchaseOrder.upsert({
    where: { poNumber: po1Number },
    update: {},
    create: {
      poNumber: po1Number,
      supplierId: suppliers[0].id,
      scmId: userBySlug['eko.scm'],
      status: POStatus.ORDERED,
      totalValue: '8640000',
      estArrival: new Date('2026-08-28'),
      notes: 'Showcase PO — niacinamide 12 KG + fragrance 5 KG',
      requestId: pr1Id,
      leadId: auroraLeadFull.id,
    },
  });
  const po2Number = 'PO-AUR-002';
  await prisma.purchaseOrder.upsert({
    where: { poNumber: po2Number },
    update: {},
    create: {
      poNumber: po2Number,
      supplierId: suppliers[2].id,
      scmId: userBySlug['eko.scm'],
      status: POStatus.SHIPPED,
      totalValue: '6300000',
      estArrival: new Date('2026-08-30'),
      notes: 'Showcase PO — bottle 1500 pcs + label + box',
      requestId: pr2Id,
      leadId: auroraLeadFull.id,
    },
  });
  console.log(`  ✓ purchase_orders: 2`);

  // Inbound (receipt) for PO-001
  const inboundNo = 'INB-AUR-001';
  await prisma.warehouseInbound.upsert({
    where: { inboundNumber: inboundNo },
    update: {},
    create: {
      inboundNumber: inboundNo,
      poId: (await prisma.purchaseOrder.findUnique({ where: { poNumber: po1Number } }))!.id,
      status: InboundStatus.APPROVED,
      receivedAt: new Date('2026-08-28'),
      warehouseId: whId,
      supplierReference: 'SJ-AUR-001',
      idempotencyKey: 'aurora-seed:inb:001',
    },
  });

  // ─── PRODUCTION PLANS + WORK ORDERS ─────────────────────────────
  const plan1Batch = 'BATCH-AUR-001';
  const plan1Id = ID('plan:aur-001');
  await prisma.productionPlan.upsert({
    where: { batchNo: plan1Batch },
    update: {},
    create: {
      id: plan1Id,
      soId,
      adminId: userBySlug['agus.prod'],
      batchNo: plan1Batch,
      status: LifecycleStatus.MIXING,
      apjStatus: ApprovalStatus.APPROVED,
      apjNotes: 'Showcase plan — production underway',
      apjReleasedAt: new Date('2026-08-29'),
      formulaId: formulaIds['SMP-AUR-001'],
      formulaVersionSnapshot: 1,
    },
  });
  const wo1Number = 'WO-AUR-001';
  await prisma.workOrder.upsert({
    where: { woNumber: wo1Number },
    update: {},
    create: {
      leadId: auroraLeadFull.id,
      planId: plan1Id,
      woNumber: wo1Number,
      targetQty: 1500,
      stage: LifecycleStatus.MIXING,
      targetCompletion: new Date('2026-09-05'),
      targetHpp: '92500',
    },
  });
  const plan2Batch = 'BATCH-AUR-002';
  const plan2Id = ID('plan:aur-002');
  await prisma.productionPlan.upsert({
    where: { batchNo: plan2Batch },
    update: {},
    create: {
      id: plan2Id,
      soId,
      adminId: userBySlug['agus.prod'],
      batchNo: plan2Batch,
      status: LifecycleStatus.PLANNING,
      apjStatus: ApprovalStatus.WAITING,
      formulaId: formulaIds['SMP-AUR-002'],
      formulaVersionSnapshot: 1,
    },
  });
  const wo2Number = 'WO-AUR-002';
  await prisma.workOrder.upsert({
    where: { woNumber: wo2Number },
    update: {},
    create: {
      leadId: auroraLeadFull.id,
      planId: plan2Id,
      woNumber: wo2Number,
      targetQty: 500,
      stage: LifecycleStatus.WAITING_MATERIAL,
      targetCompletion: new Date('2026-09-10'),
      targetHpp: '95000',
    },
  });

  // Production log (one MIXING entry)
  const logNumber = 'PL-AUR-001';
  await prisma.productionLog.upsert({
    where: { logNumber },
    update: {},
    create: {
      logNumber,
      planId: plan1Id,
      workOrderId: (await prisma.workOrder.findUnique({ where: { woNumber: wo1Number } }))!.id,
      stage: LifecycleStatus.MIXING,
      inputQty: '1200.00',
      goodQty: '1175.00',
      quarantineQty: '15.00',
      rejectQty: '10.00',
      shrinkageQty: '0.00',
      startTime: new Date('2026-08-30T08:00:00Z'),
      endTime: new Date('2026-08-30T14:30:00Z'),
      downtimeMinutes: 12,
      notes: 'Showcase production log — mixing phase',
      operatorId: userBySlug['agus.prod'],
      executionCommandKey: 'aurora-seed:plog:1',
    },
  });
  console.log(`  ✓ production_plans: 2, work_orders: 2, production_logs: 1`);

  // ─── QC AUDITS ──────────────────────────────────────────────────
  const qcId1 = ID('qc:aur-001');
  await prisma.qCAudit.upsert({
    where: { id: qcId1 },
    update: {},
    create: {
      id: qcId1,
      qcId: userBySlug['sinta.qc'],
      status: QCStatus.GOOD,
      phase: QcInspectionPhase.MIXING,
      phValue: '5.80',
      viscosityValue: 4200,
      densityValue: '0.9980',
      organoleptic: true,
      homogenityPass: true,
      notes: 'Showcase audit — mixing phase within spec',
      createdAt: new Date('2026-08-30T15:00:00Z'),
    },
  });
  const qcId2 = ID('qc:aur-002');
  await prisma.qCAudit.upsert({
    where: { id: qcId2 },
    update: {},
    create: {
      id: qcId2,
      qcId: userBySlug['sinta.qc'],
      status: QCStatus.QUARANTINE,
      phase: QcInspectionPhase.INBOUND,
      inkjetCheck: true,
      sealingCheck: true,
      labelingCheck: false,
      expDateCheck: true,
      defectCategory: 'LABEL_DOKUMEN',
      defectType: 'Label offset 2mm',
      severity: 'MINOR',
      disposition: 'SORTING',
      notes: 'Showcase audit — label offset, batch quarantined for sorting',
      supplierId: suppliers[2].id,
      createdAt: new Date('2026-08-28T11:00:00Z'),
    },
  });
  const qcId3 = ID('qc:aur-003');
  await prisma.qCAudit.upsert({
    where: { id: qcId3 },
    update: {},
    create: {
      id: qcId3,
      qcId: userBySlug['sinta.qc'],
      status: QCStatus.GOOD,
      phase: QcInspectionPhase.FINAL,
      phValue: '5.85',
      viscosityValue: 4150,
      densityValue: '0.9985',
      organoleptic: true,
      coaVerified: true,
      leakTestPass: true,
      dimensionCheck: true,
      notes: 'Showcase audit — final QC PASS',
      createdAt: new Date('2026-08-31T09:00:00Z'),
    },
  });
  console.log(`  ✓ qc_audits: 3`);

  // ─── FINANCE: COA, Financial Period, Invoice, JournalEntry ──────
  const coa = [
    { code: '1100', name: 'Kas & Bank',               type: AccountType.ASSET,     nb: NormalBalance.DEBIT,  rg: ReportGroup.CURRENT_ASSET },
    { code: '1200', name: 'Piutang Usaha',            type: AccountType.ASSET,     nb: NormalBalance.DEBIT,  rg: ReportGroup.CURRENT_ASSET },
    { code: '1300', name: 'Persediaan Bahan Baku',    type: AccountType.ASSET,     nb: NormalBalance.DEBIT,  rg: ReportGroup.CURRENT_ASSET },
    { code: '2100', name: 'Hutang Usaha',             type: AccountType.LIABILITY, nb: NormalBalance.CREDIT, rg: ReportGroup.CURRENT_LIABILITY },
    { code: '2301', name: 'DP Produksi Klien',        type: AccountType.LIABILITY, nb: NormalBalance.CREDIT, rg: ReportGroup.CURRENT_LIABILITY },
    { code: '3100', name: 'Modal Disetor',            type: AccountType.EQUITY,    nb: NormalBalance.CREDIT, rg: ReportGroup.EQUITY },
    { code: '4101', name: 'Pendapatan Penjualan',     type: AccountType.REVENUE,   nb: NormalBalance.CREDIT, rg: ReportGroup.OPERATING_REVENUE },
    { code: '5100', name: 'HPP Produksi',             type: AccountType.EXPENSE,   nb: NormalBalance.DEBIT,  rg: ReportGroup.COGS },
    { code: '6101', name: 'Beban Iklan & Promosi',    type: AccountType.EXPENSE,   nb: NormalBalance.DEBIT,  rg: ReportGroup.OPEX },
    { code: '6201', name: 'Beban Gaji',               type: AccountType.EXPENSE,   nb: NormalBalance.DEBIT,  rg: ReportGroup.OPEX },
  ];
  for (const c of coa) {
    await prisma.account.upsert({
      where: { code: c.code },
      update: { name: c.name, type: c.type, normalBalance: c.nb, reportGroup: c.rg, isActive: true },
      create: { code: c.code, name: c.name, type: c.type, normalBalance: c.nb, reportGroup: c.rg, isActive: true },
    });
  }

  const periodName = 'FY2026-08';
  const periodId = ID('period:2026-08');
  await prisma.financialPeriod.upsert({
    where: { name: periodName },
    update: { status: PeriodStatus.OPEN },
    create: {
      id: periodId,
      name: periodName,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-31'),
      status: PeriodStatus.OPEN,
    },
  });

  // Invoices — show legitimate operational state only.
  // Intentionally NOT pretending Shipment→Finance Golden Flow has passed.
  const inv1 = 'INV-AUR-001';
  await prisma.invoice.upsert({
    where: { invoiceNumber: inv1 },
    update: {},
    create: {
      invoiceNumber: inv1,
      category: InvoiceCategory.RECEIVABLE,
      type: InvoiceType.DP,
      status: InvoiceStatus.PAID,
      amountDue: '56250000',
      outstandingAmount: '0',
      issuedAt: new Date('2026-08-20'),
      dueDate: new Date('2026-08-27'),
      paidAt: new Date('2026-08-25'),
      soId,
      description: 'Aurora DP 30% — Body Lotion Premium 100 ml',
    },
  });
  const inv2 = 'INV-AUR-002';
  await prisma.invoice.upsert({
    where: { invoiceNumber: inv2 },
    update: {},
    create: {
      invoiceNumber: inv2,
      category: InvoiceCategory.RECEIVABLE,
      type: InvoiceType.FINAL_PAYMENT,
      status: InvoiceStatus.UNPAID,
      amountDue: '131250000',
      outstandingAmount: '131250000',
      issuedAt: new Date('2026-08-30'),
      dueDate: new Date('2026-09-13'),
      soId,
      description: 'Aurora remaining 70% — pending shipment (Golden Flow paused)',
    },
  });
  const inv3 = 'INV-EXP-001';
  await prisma.invoice.upsert({
    where: { invoiceNumber: inv3 },
    update: {},
    create: {
      invoiceNumber: inv3,
      category: InvoiceCategory.PAYABLE,
      type: InvoiceType.FINAL_PAYMENT,
      status: InvoiceStatus.PARTIAL,
      amountDue: '8640000',
      outstandingAmount: '3000000',
      issuedAt: new Date('2026-08-28'),
      dueDate: new Date('2026-09-12'),
      supplierId: suppliers[0].id,
      poId: (await prisma.purchaseOrder.findUnique({ where: { poNumber: po1Number } }))!.id,
      description: 'Chemindo invoice — niacinamide + fragrance',
    },
  });
  console.log(`  ✓ accounts: ${coa.length}, invoices: 3`);

  // Journal entry (one for DP receipt — legitimate)
  const je1Id = ID('je:aur-dp');
  await prisma.journalEntry.upsert({
    where: { id: je1Id },
    update: {},
    create: {
      id: je1Id,
      date: new Date('2026-08-25'),
      reference: 'JV-AUR-DP-001',
      description: 'Aurora DP 30% received',
      attachmentUrls: [],
      soId,
      invoiceId: (await prisma.invoice.findUnique({ where: { invoiceNumber: inv1 } }))!.id,
      lines: {
        create: [
          { accountId: (await prisma.account.findUnique({ where: { code: '1100' } }))!.id, debit: '56250000', credit: '0' },
          { accountId: (await prisma.account.findUnique({ where: { code: '2301' } }))!.id, debit: '0',       credit: '56250000' },
        ],
      },
    },
  });
  console.log(`  ✓ journal_entries: 1`);

  console.log(`\n🎉 Aurora showcase seed complete in ${Date.now() - t0} ms`);
  console.log(`Idempotent: re-run is safe — all writes use upsert by unique key.`);
}

main()
  .catch((e) => {
    console.error('❌ Aurora seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
