export const MOCK_DATA: any = {
  // ── BUSSDEV ──────────────────────────────────────────────────

  "/bussdev/dashboard": () => ({
    activeLeads: 24,
    pipelineValue: 2850000000,
    avgDays: "14 Days",
    conversion: { leadToSample: 68, sampleToDeal: 42 },
    revenuePipeline: {
      totalPipelineValue: 2850000000,
      potentialSample: 780000000,
      potentialDeal: 1850000000,
      confirmedDeal: 320000000,
      repeatOrderValue: 95000000,
    },
    staffPerformance: [
      { name: "Andi Pratama", leads: 450, fu: 1240, crSmpl: 26, crDeal: 18, clsSmpl: 117, clsNew: 81, clsRo: 42, rev: "3.24M", status: "MELAMPAUI TARGET" },
      { name: "Citra Kirana", leads: 320, fu: 980, crSmpl: 29, crDeal: 15, clsSmpl: 92, clsNew: 48, clsRo: 28, rev: "2.15M", status: "SESUAI TARGET" },
      { name: "Budi Santoso", leads: 180, fu: 420, crSmpl: 12, crDeal: 8, clsSmpl: 22, clsNew: 14, clsRo: 5, rev: "0.85M", status: "BAWAH TARGET" },
    ],
    lostChurn: [
      { brand: "Nature Glow", reason: "Price", bd: "Andi P.", val: "250Jt", lostValue: 250000000 },
      { brand: "Zen Skin", reason: "Sample", bd: "Budi S.", val: "120Jt", lostValue: 120000000 },
      { brand: "Aqua Pure", reason: "Ghosting", bd: "Andi P.", val: "450Jt", lostValue: 450000000 },
    ],
  }),

  "/bussdev/analytics/staff-performance": () => [
    { name: "Andi Pratama", leads: 450, followUp: 1240, crSample: 26, crDeal: 18, clsSample: 117, clsNewClient: 81000000, clsRO: 42000000, actualRevenue: 324000000, status: "MELAMPAUI TARGET" },
    { name: "Citra Kirana", leads: 320, followUp: 980, crSample: 29, crDeal: 15, clsSample: 92, clsNewClient: 48000000, clsRO: 28000000, actualRevenue: 215000000, status: "SESUAI TARGET" },
    { name: "Budi Santoso", leads: 180, followUp: 420, crSample: 12, crDeal: 8, clsSample: 22, clsNewClient: 14000000, clsRO: 5000000, actualRevenue: 85000000, status: "BAWAH TARGET" },
    { name: "Dewi Lestari", leads: 210, followUp: 640, crSample: 22, crDeal: 11, clsSample: 46, clsNewClient: 26000000, clsRO: 12000000, actualRevenue: 118000000, status: "SESUAI TARGET" },
    { name: "Eko Prasetyo", leads: 265, followUp: 730, crSample: 24, crDeal: 13, clsSample: 58, clsNewClient: 33000000, clsRO: 18000000, actualRevenue: 162000000, status: "MELAMPAUI TARGET" },
  ],

  "/bussdev/analytics/pipeline": () => ({
    activeLeads: 24,
    pipelineValue: 2850000000,
    avgDays: "14 Days",
    conversion: { leadToSample: 68, sampleToDeal: 42 },
  }),

  "/bussdev/analytics/guest": () => ({
    totalGuests: 47,
    convertedThisMonth: 12,
    pendingConversion: 18,
  }),

  "/bussdev/analytics/pipeline-granular": () => [
    {
      no: 1, id: "L-001", clientName: "PT Sejahtera Abadi", brandName: "GlowNat", productInterest: "Serum",
      estimatedValue: 150000000, moq: 5000, margin: 35, logoRevision: 2, hkiProgress: "EVALUATION",
      packagingSuggestion: "done", designSuggestion: "progress", valueSuggestion: "not_started",
      sku: "SER-001", unitPrice: 45000, sampleStatus: "APPROVED", rev1: true, rev2: true, rev3: false,
      revisionCount: 2, suggestPackaging: "Botol Kaca 30ml", suggestDesign: "Minimalis White",
      suggestValue: "Rp 45.000", totalPaid: 75000000, planOmset: 225000000, picName: "Andi Pratama",
      stage: "SAMPLE_APPROVED", status: "SAMPLE_APPROVED", isDpPaid: false, hkiStatus: "ON_PROGRESS",
      durationDays: 45, statusLabel: "Sample Approved",
    },
    {
      no: 2, id: "L-002", clientName: "CV Bumi Kosmetik", brandName: "EarthGlow", productInterest: "Moisturizer",
      estimatedValue: 250000000, moq: 10000, margin: 40, logoRevision: 1, hkiProgress: "DRAFT",
      packagingSuggestion: "progress", designSuggestion: "not_started", valueSuggestion: "not_started",
      sku: "MST-001", unitPrice: 35000, sampleStatus: "QUEUE", rev1: false, rev2: false, rev3: false,
      revisionCount: 0, suggestPackaging: "Tube Aluminium 50ml", suggestDesign: "Eco Green",
      suggestValue: "Rp 35.000", totalPaid: 0, planOmset: 350000000, picName: "Citra Kirana",
      stage: "NEGOTIATION", status: "NEGOTIATION", isDpPaid: false, hkiStatus: "BELUM",
      durationDays: 12, statusLabel: "Negotiation",
    },
    {
      no: 3, id: "L-003", clientName: "PT Natural Beauty", brandName: "BioEssence", productInterest: "Toner",
      estimatedValue: 500000000, moq: 20000, margin: 45, logoRevision: 3, hkiProgress: "PUBLISHED",
      packagingSuggestion: "done", designSuggestion: "done", valueSuggestion: "done",
      sku: "TON-001", unitPrice: 28000, sampleStatus: "APPROVED", rev1: true, rev2: true, rev3: true,
      revisionCount: 3, suggestPackaging: "Botol PET 200ml", suggestDesign: "Elegant Gold",
      suggestValue: "Rp 28.000", totalPaid: 250000000, planOmset: 560000000, picName: "Andi Pratama",
      stage: "DP_PAID", status: "DP_PAID", isDpPaid: true, hkiStatus: "PUBLISHED",
      durationDays: 78, statusLabel: "DP Paid",
    },
    {
      no: 4, id: "L-004", clientName: "CV Aroma Indah", brandName: "AromaGlow", productInterest: "Body Lotion",
      estimatedValue: 75000000, moq: 3000, margin: 30, logoRevision: 0, hkiProgress: "BELUM",
      packagingSuggestion: "not_started", designSuggestion: "not_started", valueSuggestion: "not_started",
      sku: "BDL-001", unitPrice: 25000, sampleStatus: "PENDING", rev1: false, rev2: false, rev3: false,
      revisionCount: 0, suggestPackaging: "Botol Pump 250ml", suggestDesign: "Fresh Blue",
      suggestValue: "Rp 25.000", totalPaid: 0, planOmset: 75000000, picName: "Budi Santoso",
      stage: "NEW_LEAD", status: "NEW_LEAD", isDpPaid: false, hkiStatus: "BELUM",
      durationDays: 3, statusLabel: "New Lead",
    },
    {
      no: 5, id: "L-005", clientName: "PT Luxcare Indonesia", brandName: "LuxGlow", productInterest: "Face Wash",
      estimatedValue: 350000000, moq: 15000, margin: 38, logoRevision: 1, hkiProgress: "SUBMITTED",
      packagingSuggestion: "progress", designSuggestion: "progress", valueSuggestion: "not_started",
      sku: "FWH-001", unitPrice: 22000, sampleStatus: "CLIENT_REVIEW", rev1: true, rev2: false, rev3: false,
      revisionCount: 1, suggestPackaging: "Tube 100ml", suggestDesign: "Clean White",
      suggestValue: "Rp 22.000", totalPaid: 17500000, planOmset: 330000000, picName: "Citra Kirana",
      stage: "SAMPLE_SENT", status: "SAMPLE_SENT", isDpPaid: false, hkiStatus: "ON_PROGRESS",
      durationDays: 23, statusLabel: "Sample Sent",
    },
  ],


  "/bussdev/pipeline-v2/leads": () => [
    { id: "L-001", clientName: "PT Sejahtera Abadi", brandName: "GlowNat", productInterest: "Serum", category: "SKINCARE", estimatedValue: 150000000, status: "SAMPLE_APPROVED", slaDays: 3, lastActionBy: "Andi Pratama", lastActionAt: "2026-05-20T10:30:00Z", notes: "Sample approved, preparing SPK" },
    { id: "L-002", clientName: "CV Bumi Kosmetik", brandName: "EarthGlow", productInterest: "Moisturizer", category: "SKINCARE", estimatedValue: 250000000, status: "NEGOTIATION", slaDays: 8, lastActionBy: "Citra Kirana", lastActionAt: "2026-05-18T14:00:00Z", notes: "Price negotiation ongoing" },
    { id: "L-003", clientName: "PT Natural Beauty", brandName: "BioEssence", productInterest: "Toner", category: "SKINCARE", estimatedValue: 500000000, status: "DP_PAID", slaDays: 1, lastActionBy: "Andi Pratama", lastActionAt: "2026-05-22T09:15:00Z", notes: "DP 50% verified, production queue" },
    { id: "L-004", clientName: "CV Aroma Indah", brandName: "AromaGlow", productInterest: "Body Lotion", category: "BODYCARE", estimatedValue: 75000000, status: "NEW_LEAD", slaDays: 5, lastActionBy: "Budi Santoso", lastActionAt: "2026-05-21T16:45:00Z", notes: "Initial intake completed" },
    { id: "L-005", clientName: "PT Luxcare Indonesia", brandName: "LuxGlow", productInterest: "Face Wash", category: "SKINCARE", estimatedValue: 350000000, status: "SAMPLE_SENT", slaDays: 12, lastActionBy: "Citra Kirana", lastActionAt: "2026-05-15T11:20:00Z", notes: "Sample delivered, awaiting client review" },
    { id: "L-006", clientName: "CV Berkah Kosmetik", brandName: "BerkahGlow", productInterest: "Day Cream", category: "SKINCARE", estimatedValue: 180000000, status: "FOLLOW_UP_2", slaDays: 7, lastActionBy: "Budi Santoso", lastActionAt: "2026-05-19T08:30:00Z", notes: "Client interested, sending brochure" },
    { id: "L-007", clientName: "PT Indo Beauty", brandName: "IndoGlow", productInterest: "Sunscreen", category: "SKINCARE", estimatedValue: 420000000, status: "WAITING_FINANCE_APPROVAL", slaDays: 2, lastActionBy: "Andi Pratama", lastActionAt: "2026-05-22T13:00:00Z", notes: "Payment proof uploaded, awaiting finance" },
  ],


  "/bussdev/pipeline-v2/audit": () => [
    { id: "A-001", timestamp: "2026-05-22 09:15", clientName: "PT Natural Beauty", fromStage: "SPK_SIGNED", toStage: "DP_PAID", action: "DP Verified by Finance", performedBy: "Finance Dept", effects: ["SO ACTIVE", "G2 OPENED", "PR AUTO"], artifacts: ["payment_proof.pdf"] },
    { id: "A-002", timestamp: "2026-05-21 16:45", clientName: "CV Aroma Indah", fromStage: null, toStage: "NEW_LEAD", action: "Lead Created", performedBy: "Budi Santoso", effects: ["LEAD CREATED"], artifacts: [] },
    { id: "A-003", timestamp: "2026-05-20 10:30", clientName: "PT Sejahtera Abadi", fromStage: "SAMPLE_SENT", toStage: "SAMPLE_APPROVED", action: "Sample Approved by Client", performedBy: "Andi Pratama", effects: ["FORMULA LOCKED", "NPF COMPLETE"], artifacts: ["sample_approval.pdf"] },
    { id: "A-004", timestamp: "2026-05-19 08:30", clientName: "CV Berkah Kosmetik", fromStage: "FOLLOW_UP_1", toStage: "FOLLOW_UP_2", action: "Follow Up 2", performedBy: "Budi Santoso", effects: ["FU UPDATED"], artifacts: [] },
    { id: "A-005", timestamp: "2026-05-18 14:00", clientName: "CV Bumi Kosmetik", fromStage: "CONTACTED", toStage: "NEGOTIATION", action: "Moved to Negotiation", performedBy: "Citra Kirana", effects: ["QUOTATION SENT"], artifacts: ["quotation.pdf"] },
  ],


  "/guests": () => [
    { id: "G-001", clientName: "PT Murni Sejahtera", brandName: "MurniGlow", productInterest: "Serum", estimatedValue: 200000000, visitDate: "2026-05-22T10:00:00Z", category: "BRANDED", city: "Jakarta", phoneNo: "021-5551001", email: "info@murni.com", fuStatus: "FU_1", bd: { fullName: "Andi Pratama" } },
    { id: "G-002", clientName: "CV Hijau Lestari", brandName: "GreenNatural", productInterest: "Body Butter", estimatedValue: 95000000, visitDate: "2026-05-21T14:30:00Z", category: "BRANDED", city: "Bandung", phoneNo: "022-5552002", email: "info@hijau.com", fuStatus: "NOT_FOLLOWED_UP", bd: { fullName: "Citra Kirana" } },
    { id: "G-003", clientName: "PT Cantik Alami", brandName: "CantikNatural", productInterest: "Face Mist", estimatedValue: 150000000, visitDate: "2026-05-20T09:15:00Z", category: "MAKLON_FULL", city: "Surabaya", phoneNo: "031-5553003", email: "info@cantikalami.com", fuStatus: "FU_2", bd: { fullName: "Budi Santoso" } },
    { id: "G-004", clientName: "CV Bersinar Abadi", brandName: "CahayaGlow", productInterest: "Lip Balm", estimatedValue: 50000000, visitDate: "2026-05-19T11:00:00Z", category: "BRANDED", city: "Yogyakarta", phoneNo: "0274-5554004", email: "info@bersinar.com", fuStatus: "NOT_FOLLOWED_UP", bd: { fullName: "Andi Pratama" } },
    { id: "G-005", clientName: "PT Sehat Makmur", brandName: "SehatGlow", productInterest: "Hand Cream", estimatedValue: 120000000, visitDate: "2026-05-18T16:45:00Z", category: "MAKLON_FULL", city: "Semarang", phoneNo: "024-5555005", email: "info@sehatmakmur.com", fuStatus: "FU_1", bd: { fullName: "Citra Kirana" } },
  ],


  "/bussdev/staffs": () => [
    { id: "S-001", name: "Andi Pratama", userId: "U-001", email: "andi@erp.com" },
    { id: "S-002", name: "Citra Kirana", userId: "U-002", email: "citra@erp.com" },
    { id: "S-003", name: "Budi Santoso", userId: "U-003", email: "budi@erp.com" },
  ],

  // ── FINANCE ───────────────────────────────────────────────────

  "/finance/dashboard": () => ({
    cashBalance: 1580000000,
    totalAR: 425000000,
    totalAP: 890000000,
    monthlyRevenue: 3200000000,
    monthlyExpense: 2100000000,
    netProfit: 1100000000,
    revenueGrowth: 15.8,
    expenseGrowth: 8.2,
    arAging: { current: 280000000, overdue30: 95000000, overdue60: 35000000, overdue90: 15000000 },
    topRevenue: [
      { client: "PT Natural Beauty", amount: 500000000, status: "PAID" },
      { client: "PT Sejahtera Abadi", amount: 150000000, status: "PAID" },
      { client: "PT Luxcare Indonesia", amount: 350000000, status: "PENDING" },
    ],
  }),

  "/finance/invoices": () => [
    { id: "INV-001", invoiceNumber: "INV-2026-0001", category: "RECEIVABLE", clientName: "PT Natural Beauty", amountDue: 500000000, outstandingAmount: 0, status: "PAID", dueDate: "2026-06-15", createdAt: "2026-05-01" },
    { id: "INV-002", invoiceNumber: "INV-2026-0002", category: "RECEIVABLE", clientName: "PT Sejahtera Abadi", amountDue: 150000000, outstandingAmount: 75000000, status: "PARTIAL", dueDate: "2026-06-20", createdAt: "2026-05-05" },
    { id: "INV-003", invoiceNumber: "INV-2026-0003", category: "PAYABLE", supplierName: "PT Bahan Baku", amountDue: 340000000, outstandingAmount: 340000000, status: "UNPAID", dueDate: "2026-06-10", createdAt: "2026-05-10" },
    { id: "INV-004", invoiceNumber: "INV-2026-0004", category: "RECEIVABLE", clientName: "PT Luxcare Indonesia", amountDue: 350000000, outstandingAmount: 350000000, status: "UNPAID", dueDate: "2026-07-01", createdAt: "2026-05-15" },
    { id: "INV-005", invoiceNumber: "INV-2026-0005", category: "PAYABLE", supplierName: "CV Kemasan Indah", amountDue: 120000000, outstandingAmount: 120000000, status: "UNPAID", dueDate: "2026-06-25", createdAt: "2026-05-18" },
  ],


  "/finance/transactions": () => [
    { id: "TRX-001", date: "2026-05-22", description: "Pembayaran DP PT Natural Beauty", type: "CREDIT", amount: 250000000, accountCode: "1101", accountName: "Kas Utama" },
    { id: "TRX-002", date: "2026-05-21", description: "Pembelian Bahan Baku", type: "DEBIT", amount: 120000000, accountCode: "5101", accountName: "Biaya Bahan Baku" },
    { id: "TRX-003", date: "2026-05-20", description: "Pembayaran Gaji Karyawan", type: "DEBIT", amount: 85000000, accountCode: "5102", accountName: "Biaya Gaji" },
    { id: "TRX-004", date: "2026-05-18", description: "Penerimaan Pelunasan PT Sejahtera", type: "CREDIT", amount: 75000000, accountCode: "1101", accountName: "Kas Utama" },
    { id: "TRX-005", date: "2026-05-16", description: "Pembayaran Listrik & Air", type: "DEBIT", amount: 15000000, accountCode: "5104", accountName: "Biaya Utilitas" },
  ],


  "/finance/ar-hub": () => ({
    pendingVerification: [
      { id: "AR-001", leadId: "L-007", clientName: "PT Indo Beauty", type: "SAMPLE", amount: 17500000, submittedAt: "2026-05-22", paymentProof: "proof_sample.pdf" },
      { id: "AR-002", leadId: "L-003", clientName: "PT Natural Beauty", type: "PELUNASAN", amount: 250000000, submittedAt: "2026-05-21", paymentProof: "proof_payment.pdf" },
    ],
    recentVerifications: [
      { id: "AR-003", leadId: "L-001", clientName: "PT Sejahtera Abadi", type: "DP_ORDER", amount: 75000000, verifiedAt: "2026-05-20", verifiedBy: "Finance Dept" },
    ],
  }),

  "/finance/dashboard/advanced": () => ({
    totalRevenue: 3200000000,
    totalExpense: 2100000000,
    netProfit: 1100000000,
    operatingMargin: 34.4,
    currentRatio: 2.1,
    arTurnover: 45,
    apTurnover: 30,
    revenueByMonth: [2100000000, 2450000000, 2800000000, 2600000000, 2900000000, 3200000000],
    expenseByMonth: [1800000000, 1900000000, 2000000000, 1950000000, 2050000000, 2100000000],
    topExpenses: [
      { category: "Bahan Baku", amount: 890000000, percentage: 42 },
      { category: "Gaji", amount: 520000000, percentage: 25 },
      { category: "Operasional", amount: 350000000, percentage: 17 },
      { category: "Marketing", amount: 210000000, percentage: 10 },
      { category: "Lainnya", amount: 130000000, percentage: 6 },
    ],
  }),

  "/finance/ledger": () => [
    { id: "ACC-1101", code: "1101", name: "Kas Utama", type: "ASSET", normalBalance: "DEBIT", balance: 1580000000 },
    { id: "ACC-1102", code: "1102", name: "Bank BCA", type: "ASSET", normalBalance: "DEBIT", balance: 420000000 },
    { id: "ACC-1201", code: "1201", name: "Piutang Usaha", type: "ASSET", normalBalance: "DEBIT", balance: 425000000 },
    { id: "ACC-2101", code: "2101", name: "Utang Usaha", type: "LIABILITY", normalBalance: "CREDIT", balance: 890000000 },
    { id: "ACC-3101", code: "3101", name: "Modal Disetor", type: "EQUITY", normalBalance: "CREDIT", balance: 2000000000 },
    { id: "ACC-4101", code: "4101", name: "Pendapatan Jasa", type: "REVENUE", normalBalance: "CREDIT", balance: 3200000000 },
    { id: "ACC-5101", code: "5101", name: "Biaya Bahan Baku", type: "EXPENSE", normalBalance: "DEBIT", balance: 890000000 },
  ],

  // ── SCM / WAREHOUSE ────────────────────────────────────────────

  "/scm/dashboard": () => ({
    cards: {
      inventory: { totalSku: 1248, criticalStock: 7, accuracy: 98.4 },
      warehouse: { fulfillment: 94.2, returnRate: 1.8 },
      procurement: { savingPercent: 12.6, leadTime: 4.2, supplierPerf: 96.1 },
      logistics: { otd: 91.5, shippingPerUnit: "Rp 8.4k" },
    },
    tables: {
      perfRaw: [
        { supplier: "PT Bahan Baku Utama", material: "Niacinamide", volume: 12400, otd: 96, quality: 98, risk: "LOW" },
        { supplier: "CV Kimia Jaya", material: "Glycerin", volume: 8600, otd: 92, quality: 95, risk: "LOW" },
        { supplier: "PT Aromatik Nusantara", material: "Essence", volume: 3200, otd: 84, quality: 91, risk: "MEDIUM" },
      ],
      perfPack: [
        { supplier: "CV Kemasan Indah", material: "Botol Kaca 30ml", volume: 24500, otd: 94, quality: 97, risk: "LOW" },
        { supplier: "PT Plastik Prima", material: "Tube Aluminium", volume: 12800, otd: 88, quality: 93, risk: "MEDIUM" },
        { supplier: "CV Labelindo", material: "Label & Sticker", volume: 32000, otd: 97, quality: 99, risk: "LOW" },
      ],
      perfBox: [
        { supplier: "PT Karton Utama", material: "Kardus 50x30", volume: 8200, otd: 90, quality: 94, risk: "MEDIUM" },
        { supplier: "CV Box Mulya", material: "Box Insert", volume: 6100, otd: 86, quality: 90, risk: "MEDIUM" },
      ],
      perfLabel: [
        { supplier: "CV Labelindo", material: "Sticker Roll", volume: 42000, otd: 98, quality: 99, risk: "LOW" },
        { supplier: "PT Cetak Digital", material: "Label NPF", volume: 15400, otd: 93, quality: 96, risk: "LOW" },
      ],
    },
    procurementSuggestions: [
      { priority: "URGENT", currentStock: 12, item: "Niacinamide", suggestedQty: 500, reason: "Stok kritis, pemakaian tinggi" },
      { priority: "URGENT", currentStock: 8, item: "Botol Kaca 30ml", suggestedQty: 2000, reason: "Proyeksi pemakaian 2 minggu habis" },
      { priority: "NORMAL", currentStock: 34, item: "Glycerin", suggestedQty: 800, reason: "Cycle stock normal" },
      { priority: "NORMAL", currentStock: 25, item: "Essence Parfum", suggestedQty: 300, reason: "Menjelang produksi parfum" },
      { priority: "LOW", currentStock: 120, item: "Kardus 50x30", suggestedQty: 0, reason: "Stok aman" },
    ],
    highFrequency: {
      raw: [
        { name: "Niacinamide", freq: 42, consumption: "820 kg/bln", turnover: 6.4 },
        { name: "Glycerin", freq: 38, consumption: "640 kg/bln", turnover: 5.8 },
        { name: "Essence", freq: 24, consumption: "310 L/bln", turnover: 4.9 },
      ],
      pack: [
        { name: "Botol Kaca 30ml", freq: 36, consumption: "2.4K pcs/bln", turnover: 7.2 },
        { name: "Tube Aluminium", freq: 22, consumption: "1.1K pcs/bln", turnover: 5.1 },
        { name: "Label Roll", freq: 31, consumption: "1.8K pcs/bln", turnover: 6.8 },
      ],
    },
  }),

  "/scm/work-orders/active": () => [
    { id: "WO-001", woNumber: "WO-2026-0101", product: "Brightening Serum", targetQty: 5000, gap: 0, poStatus: "CLOSED", estArrival: "2026-08-15", boStatus: "READY", supplierScore: 96 },
    { id: "WO-002", woNumber: "WO-2026-0102", product: "Moisturizer Green", targetQty: 3000, gap: 800, poStatus: "OPEN", estArrival: "2026-08-20", boStatus: "GAP", supplierScore: 88 },
    { id: "WO-003", woNumber: "WO-2026-0103", product: "Face Wash Clean", targetQty: 8000, gap: 0, poStatus: "CLOSED", estArrival: "2026-08-14", boStatus: "READY", supplierScore: 92 },
    { id: "WO-004", woNumber: "WO-2026-0104", product: "Toner Glow", targetQty: 6000, gap: 1500, poStatus: "OPEN", estArrival: "2026-08-22", boStatus: "GAP", supplierScore: 84 },
  ],

  "/scm/purchase-orders": () => [
    { id: "PO-001", poNumber: "PO-2026-0001", supplier: { name: "PT Bahan Baku Utama" }, status: "APPROVED", totalValue: 340000000, items: [{ material: { name: "Niacinamide" }, qty: 500, unit: "kg" }], createdAt: "2026-05-10", expectedDate: "2026-06-05" },
    { id: "PO-002", poNumber: "PO-2026-0002", supplier: { name: "CV Kemasan Indah" }, status: "PENDING", totalValue: 120000000, items: [{ material: { name: "Botol Pump 250ml" }, qty: 10000, unit: "pcs" }], createdAt: "2026-05-15", expectedDate: "2026-06-10" },
    { id: "PO-003", poNumber: "PO-2026-0003", supplier: { name: "PT Logistik Global" }, status: "RECEIVED", totalValue: 89000000, items: [{ material: { name: "Kardus Dus" }, qty: 5000, unit: "pcs" }], createdAt: "2026-05-05", expectedDate: "2026-05-25" },
  ],


  "/scm/purchase-requests": () => [
    { id: "PR-001", prNumber: "PR-2026-0001", priority: "HIGH", status: "PENDING_APPROVAL_SCM", items: [{ material: { name: "Niacinamide" }, qtyRequired: 200, estimatedPrice: 250000 }], createdAt: "2026-05-20", notes: "Auto-PR: Stock shortage detected" },
    { id: "PR-002", prNumber: "PR-2026-0002", priority: "MEDIUM", status: "APPROVED", items: [{ material: { name: "Glycerin" }, qtyRequired: 500, estimatedPrice: 45000 }], createdAt: "2026-05-18", notes: "Routine restock" },
    { id: "PR-003", prNumber: "PR-2026-0003", priority: "HIGH", status: "PENDING_APPROVAL_DIRECTOR", items: [{ material: { name: "Botol Kaca 30ml" }, qtyRequired: 5000, estimatedPrice: 3200 }], createdAt: "2026-05-22", notes: "New product line" },
  ],


  "/scm/materials": () => [
    { id: "M-001", name: "Niacinamide", unit: "kg", currentStock: 150, minStock: 100, unitPrice: 250000, category: "BAHAN BAKU" },
    { id: "M-002", name: "Glycerin", unit: "kg", currentStock: 320, minStock: 200, unitPrice: 45000, category: "BAHAN BAKU" },
    { id: "M-003", name: "Botol Kaca 30ml", unit: "pcs", currentStock: 2500, minStock: 1000, unitPrice: 3200, category: "KEMASAN" },
    { id: "M-004", name: "Tube Aluminium 50ml", unit: "pcs", currentStock: 800, minStock: 500, unitPrice: 2800, category: "KEMASAN" },
    { id: "M-005", name: "Kardus Dus", unit: "pcs", currentStock: 1200, minStock: 500, unitPrice: 1500, category: "PACKAGING" },
  ],


  "/warehouse/inbound": () => [
    { id: "WI-001", inboundNumber: "GRN-2026-0001", status: "APPROVED", receivedAt: "2026-05-22T10:00:00Z", items: [{ material: { name: "Niacinamide" }, qtyActual: 200 }], po: { poNumber: "PO-2026-0001" } },
    { id: "WI-002", inboundNumber: "GRN-2026-0002", status: "PENDING", receivedAt: "2026-05-21T14:30:00Z", items: [{ material: { name: "Botol Pump 250ml" }, qtyActual: 5000 }], po: { poNumber: "PO-2026-0002" } },
  ],


  "/warehouse/outbound": () => [
    { id: "WO-001", outboundNumber: "DO-2026-0001", status: "SHIPPED", shippedAt: "2026-05-22T11:00:00Z", items: [{ material: { name: "Brightening Serum" }, qty: 1000 }], destination: "PT Natural Beauty" },
    { id: "WO-002", outboundNumber: "DO-2026-0002", status: "PACKING", shippedAt: null, items: [{ material: { name: "Moisturizer Green" }, qty: 500 }], destination: "CV Bumi Kosmetik" },
  ],


  "/warehouse/adjustments": () => [
    { id: "WA-001", type: "OPNAME", status: "APPROVED", createdAt: "2026-05-20", items: [{ material: { name: "Glycerin" }, qtySystem: 320, qtyActual: 315 }] },
  ],

  // ── PRODUCTION ─────────────────────────────────────────────────

  "/production/dashboard": () => ({
    activeWorkOrders: 12,
    completedToday: 3,
    onTimeRate: 87,
    qualityPassRate: 95,
    totalOutput: 45000,
    efficiency: 82,
    cards: {
      achievement: { actual: 45000, completedOrders: 3, totalOrders: 12 },
      quality: { defectRate: 5 },
    },
    workshops: { queue: 4, mixing: 3, filling: 3, packing: 2 },
    workOrders: [
      { id: "WO-001", woNumber: "WO-2026-0001", product: "Brightening Serum", qty: 5000, status: "IN_PROGRESS", progress: 60, dueDate: "2026-05-25" },
      { id: "WO-002", woNumber: "WO-2026-0002", product: "Moisturizer Green", qty: 3000, status: "MIXING", progress: 25, dueDate: "2026-05-28" },
      { id: "WO-003", woNumber: "WO-2026-0003", product: "Face Wash Clean", qty: 10000, status: "PACKING", progress: 85, dueDate: "2026-05-24" },
      { id: "WO-004", woNumber: "WO-2026-0004", product: "Toner Glow", qty: 8000, status: "PLANNED", progress: 0, dueDate: "2026-06-01" },
    ],
  }),

  "/production/work-orders": () => [
    { id: "WO-001", woNumber: "WO-2026-0001", product: "Brightening Serum", qty: 5000, status: "IN_PROGRESS", progress: 60, dueDate: "2026-05-25", picName: "Production A", lead: { brandName: "GlowNat" } },
    { id: "WO-002", woNumber: "WO-2026-0002", product: "Moisturizer Green", qty: 3000, status: "MIXING", progress: 25, dueDate: "2026-05-28", picName: "Production B", lead: { brandName: "EarthGlow" } },
    { id: "WO-003", woNumber: "WO-2026-0003", product: "Face Wash Clean", qty: 10000, status: "PACKING", progress: 85, dueDate: "2026-05-24", picName: "Production A", lead: { brandName: "LuxGlow" } },
    { id: "WO-004", woNumber: "WO-2026-0004", product: "Toner Glow", qty: 8000, status: "PLANNED", progress: 0, dueDate: "2026-06-01", picName: "Production C", lead: { brandName: "BioEssence" } },
  ],


  "/production/schedules": () => [
    { id: "SCH-001", scheduleNumber: "SCH-2026-0001", stage: "MIXING", status: "IN_PROGRESS", targetQty: 5000, startTime: "2026-05-22T08:00:00Z", machine: { name: "Mixer A" } },
    { id: "SCH-002", scheduleNumber: "SCH-2026-0002", stage: "FILLING", status: "COMPLETED", targetQty: 5000, startTime: "2026-05-22T10:00:00Z", machine: { name: "Filler B" } },
  ],


  // ── R&D ────────────────────────────────────────────────────────

  "/rnd/dashboard": () => ({
    activeSamples: 15,
    pendingFinance: 3,
    inQueue: 5,
    formulating: 4,
    labTest: 2,
    readyToShip: 1,
    completedThisMonth: 8,
    avgCycleTime: "18 Days",
    samples: [
      { id: "SMP-001", sampleCode: "SMP-2026-0001", productName: "Brightening Serum V1", stage: "FORMULATING", picName: "R&D A", revisionCount: 1 },
      { id: "SMP-002", sampleCode: "SMP-2026-0002", productName: "Moisturizer Green V3", stage: "LAB_TEST", picName: "R&D B", revisionCount: 2 },
      { id: "SMP-003", sampleCode: "SMP-2026-0003", productName: "Face Wash Clean", stage: "QUEUE", picName: null, revisionCount: 0 },
      { id: "SMP-004", sampleCode: "SMP-2026-0004", productName: "Toner Glow V1", stage: "WAITING_FINANCE", picName: null, revisionCount: 0 },
      { id: "SMP-005", sampleCode: "SMP-2026-0005", productName: "Body Lotion Fresh", stage: "READY_TO_SHIP", picName: "R&D A", revisionCount: 3 },
    ],
  }),

  "/rnd/npf": () => [
    { id: "NPF-001", productName: "Brightening Serum", status: "PENDING", targetPrice: 35000, createdAt: "2026-05-10", lead: { clientName: "PT Sejahtera Abadi" } },
    { id: "NPF-002", productName: "Moisturizer Green", status: "IN_PROGRESS", targetPrice: 28000, createdAt: "2026-05-12", lead: { clientName: "CV Bumi Kosmetik" } },
    { id: "NPF-003", productName: "Toner Glow", status: "COMPLETED", targetPrice: 22000, createdAt: "2026-05-01", lead: { clientName: "PT Natural Beauty" } },
  ],


  "/rnd/samples": () => [
    { id: "SMP-001", sampleCode: "SMP-2026-0001", productName: "Brightening Serum V1", stage: "FORMULATING", picName: "R&D A", revisionCount: 1, lead: { clientName: "PT Sejahtera Abadi", brandName: "GlowNat" }, targetDeadline: "2026-06-01" },
    { id: "SMP-002", sampleCode: "SMP-2026-0002", productName: "Moisturizer Green V3", stage: "LAB_TEST", picName: "R&D B", revisionCount: 2, lead: { clientName: "CV Bumi Kosmetik", brandName: "EarthGlow" }, targetDeadline: "2026-05-28" },
    { id: "SMP-003", sampleCode: "SMP-2026-0003", productName: "Face Wash Clean V1", stage: "QUEUE", picName: null, revisionCount: 0, lead: { clientName: "PT Luxcare Indonesia", brandName: "LuxGlow" }, targetDeadline: "2026-06-05" },
    { id: "SMP-004", sampleCode: "SMP-2026-0004", productName: "Toner Glow V1", stage: "WAITING_FINANCE", picName: null, revisionCount: 0, lead: { clientName: "PT Natural Beauty", brandName: "BioEssence" }, targetDeadline: "2026-06-10" },
    { id: "SMP-005", sampleCode: "SMP-2026-0005", productName: "Body Lotion Fresh V2", stage: "READY_TO_SHIP", picName: "R&D A", revisionCount: 3, lead: { clientName: "CV Aroma Indah", brandName: "AromaGlow" }, targetDeadline: "2026-05-25" },
  ],


  "/rnd/repository": () => [
    { id: "F-001", formulaCode: "F-2605-001", productName: "Brightening Serum", status: "PRODUCTION_LOCKED", version: 2, createdAt: "2026-05-01" },
    { id: "F-002", formulaCode: "F-2605-002", productName: "Moisturizer Green", status: "SAMPLE_LOCKED", version: 3, createdAt: "2026-05-05" },
    { id: "F-003", formulaCode: "F-2605-003", productName: "Face Wash Clean", status: "DRAFT", version: 1, createdAt: "2026-05-15" },
    { id: "F-004", formulaCode: "F-2605-004", productName: "Toner Glow", status: "DRAFT", version: 1, createdAt: "2026-05-18" },
  ],


  "/rnd/formulas": () => [
    { id: "F-001", formulaCode: "F-2605-001", productName: "Brightening Serum", status: "PRODUCTION_LOCKED", version: 2, phases: [{ items: [{ materialId: "M-001", materialName: "Niacinamide", qty: 50 }] }] },
    { id: "F-002", formulaCode: "F-2605-002", productName: "Moisturizer Green", status: "SAMPLE_LOCKED", version: 3, phases: [{ items: [{ materialId: "M-002", materialName: "Glycerin", qty: 100 }] }] },
  ],


  // ── LEGALITY ──────────────────────────────────────────────────

  "/legality/dashboard": () => ({
    activeTotal: 18,
    thisMonth: 5,
    onProgress: 12,
    delayed: 3,
    pipeline: { activeTotal: 18, onProgress: 12, blockedByFinance: 2, scmBlocked: 1, prodBlocked: 3 },
    bpomStats: { avgTime: "45 Days", labTest: 4, govEval: 3 },
    hkiStats: { avgTime: "120 Days", docPrep: 2, govProcess: 1 },
    riskMonitor: { expired: 0, under90Days: 3, criticalAction: 0 },
    recentActivity: [
      { action: "BPOM REGISTRATION INITIATED", target: "GlowNat", pic: "Legal A", time: "2 hours ago" },
      { action: "HKI BRAND REGISTRATION INITIATED", target: "BioEssence", pic: "Legal B", time: "1 day ago" },
    ],
  }),

  "/legality/pipeline": () => [
    { id: "RP-001", lead: { clientName: "PT Sejahtera Abadi", brandName: "GlowNat" }, type: "BPOM", currentStage: "EVALUATION", registrationNo: null, legalPic: { fullName: "Legal A" }, expiryDate: null },
    { id: "RP-002", lead: { clientName: "PT Natural Beauty", brandName: "BioEssence" }, type: "HKI_BRAND", currentStage: "PUBLISHED", registrationNo: "HKI-2026-001", legalPic: { fullName: "Legal B" }, expiryDate: "2031-05-22" },
    { id: "RP-003", lead: { clientName: "CV Bumi Kosmetik", brandName: "EarthGlow" }, type: "BPOM", currentStage: "DRAFT", registrationNo: null, legalPic: { fullName: "Legal A" }, expiryDate: null },
    { id: "RP-004", lead: { clientName: "PT Luxcare Indonesia", brandName: "LuxGlow" }, type: "BPOM", currentStage: "SUBMITTED", registrationNo: null, legalPic: { fullName: "Legal C" }, expiryDate: null },
  ],

  "/legality/inbox": () => [
    { id: "INB-001", type: "BPOM", productName: "Brightening Serum", clientName: "PT Sejahtera Abadi", stage: "SUBMITTED", picName: "Legal A", createdAt: "2026-05-15" },
    { id: "INB-002", type: "HKI", productName: "BioEssence", clientName: "PT Natural Beauty", stage: "EVALUATION", picName: "Legal B", createdAt: "2026-05-10" },
  ],

  // ── FULFILLMENT / LOGISTICS ───────────────────────────────────

  "/fulfillment/shipments": () => [
    { id: "SJ-001", status: "SHIPPED", shippedAt: "2026-05-22T11:00:00Z", so: { orderNumber: "SO-2026-0001", lead: { clientName: "PT Natural Beauty" } }, logistics: { fullName: "Logistics A" } },
    { id: "SJ-002", status: "DELIVERED", deliveredAt: "2026-05-21T15:00:00Z", so: { orderNumber: "SO-2026-0002", lead: { clientName: "PT Sejahtera Abadi" } }, logistics: { fullName: "Logistics B" } },
    { id: "SJ-003", status: "PACKING", shippedAt: null, so: { orderNumber: "SO-2026-0003", lead: { clientName: "CV Bumi Kosmetik" } }, logistics: null },
  ],


  "/logistics/delivery-orders": () => [
    { id: "DO-001", doNumber: "DO-2026-0001", status: "SHIPPED", clientName: "PT Natural Beauty", address: "Jakarta", items: 2, shippedAt: "2026-05-22" },
    { id: "DO-002", doNumber: "DO-2026-0002", status: "DELIVERED", clientName: "PT Sejahtera Abadi", address: "Bandung", items: 1, shippedAt: "2026-05-20" },
  ],

  "/logistics/fleet": () => [
    { id: "FL-001", vehicleNo: "B 1234 XYZ", driver: "Driver A", status: "ON_DELIVERY", todayTrips: 3, capacity: "5 Ton" },
    { id: "FL-002", vehicleNo: "B 5678 ABC", driver: "Driver B", status: "IDLE", todayTrips: 1, capacity: "3 Ton" },
  ],

  // ── QC ────────────────────────────────────────────────────────

  "/production/qc/stats": () => ({
    totalInspections: 45,
    lastMonthInspections: 38,
    passRate: 94.2,
    totalReject: 4,
    lastMonthReject: 7,
    activeQuarantine: 2,
    totalLoss: "Rp 14.5M",
  }),

  "/qc/analytics/phase-breakdown": () => ({
    phases: [
      { phase: "INBOUND", totalAudits: 12, passCount: 11, rejectCount: 1, passRate: 91.7, topDefect: "Kemasan rusak" },
      { phase: "MIXING", totalAudits: 14, passCount: 13, rejectCount: 1, passRate: 92.9, topDefect: "Viskositas off-spec" },
      { phase: "FILLING", totalAudits: 16, passCount: 15, rejectCount: 1, passRate: 93.8, topDefect: "Berat isi tidak akurat" },
      { phase: "PACKING", totalAudits: 13, passCount: 13, rejectCount: 0, passRate: 100, topDefect: "—" },
    ],
    overall: { totalPass: 52, totalReject: 3, overallPassRate: 94.5 },
  }),

  "/qc/report": () => [
    { id: "QC-001", phase: "MIXING", material: "Brightening Serum", inspector: "Rina", status: "PASS", createdAt: "2026-08-12T09:30:00Z", notes: "pH & viskositas OK" },
    { id: "QC-002", phase: "FILLING", material: "Moisturizer Green", inspector: "Bayu", status: "REJECT", createdAt: "2026-08-12T10:15:00Z", notes: "Berat isi 2g kurang" },
    { id: "QC-003", phase: "PACKING", material: "Face Wash Clean", inspector: "Rina", status: "PASS", createdAt: "2026-08-11T14:00:00Z", notes: "Label & seal sesuai" },
    { id: "QC-004", phase: "INBOUND", material: "Niacinamide", inspector: "Bayu", status: "PASS", createdAt: "2026-08-11T08:45:00Z", notes: "CoA diverifikasi" },
    { id: "QC-005", phase: "MIXING", material: "Body Lotion SPF", inspector: "Rina", status: "PASS", createdAt: "2026-08-10T11:20:00Z", notes: "Homogenitas baik" },
    { id: "QC-006", phase: "FILLING", material: "Serum Retinol", inspector: "Bayu", status: "PASS", createdAt: "2026-08-09T13:50:00Z", notes: "Crimping sempurna" },
  ],

  "/production/qc/pending": () => [
    { id: "P-001", woNumber: "WO-2026-001", stage: "MIXING", material: "Brightening Serum", priority: "HIGH" },
    { id: "P-002", woNumber: "WO-2026-002", stage: "FILLING", material: "Moisturizer Green", priority: "MEDIUM" },
    { id: "P-003", woNumber: "WO-2026-003", stage: "PACKING", material: "Face Wash Clean", priority: "LOW" },
    { id: "P-004", woNumber: "WO-2026-004", stage: "INBOUND", material: "Niacinamide", priority: "HIGH" },
    { id: "P-005", woNumber: "WO-2026-005", stage: "BULK", material: "Body Lotion SPF", priority: "MEDIUM" },
  ],

  "/qc/dashboard": () => ({
    totalInspections: 45,
    passed: 38,
    failed: 4,
    pending: 3,
    passRate: 84.4,
    recentInspections: [
      { id: "QC-001", material: "Niacinamide Batch A", result: "PASS", inspector: "QC A", date: "2026-05-22" },
      { id: "QC-002", material: "Botol Pump 250ml", result: "PASS", inspector: "QC B", date: "2026-05-21" },
      { id: "QC-003", material: "Glycerin Batch B", result: "FAIL", inspector: "QC A", date: "2026-05-20" },
    ],
  }),

  "/qc/inspections": () => [
    { id: "INS-001", materialName: "Niacinamide Batch A", type: "INBOUND", result: "PASS", inspectedBy: "QC A", inspectedAt: "2026-05-22", notes: "Clear, no impurities" },
    { id: "INS-002", materialName: "Botol Pump 250ml", type: "INBOUND", result: "PASS", inspectedBy: "QC B", inspectedAt: "2026-05-21", notes: "Dimension OK" },
    { id: "INS-003", materialName: "Brightening Serum Bulk", type: "PRODUCTION", result: "PASS", inspectedBy: "QC A", inspectedAt: "2026-05-20", notes: "Viscosity within spec" },
    { id: "INS-004", materialName: "Moisturizer Green Bulk", type: "PRODUCTION", result: "PASS", inspectedBy: "QC B", inspectedAt: "2026-05-19", notes: "pH 5.5, OK" },
  ],


  // ── MARKETING ───────────────────────────────────────────────────

  "/marketing/dashboard": () => ({
    totalLeadsGenerated: 450,
    leadsThisMonth: 38,
    conversionRate: 12.5,
    costPerLead: 45000,
    campaigns: [
      { name: "Instagram Ads Q2", leads: 120, budget: 5000000, spent: 4800000, roas: 3.2 },
      { name: "TikTok Viral Campaign", leads: 85, budget: 3000000, spent: 2900000, roas: 4.1 },
      { name: "Google Ads Branding", leads: 65, budget: 4000000, spent: 3200000, roas: 2.8 },
    ],
    dailyMetrics: [
      { date: "2026-05-22", leads: 5, impressions: 12500, clicks: 320, cost: 450000 },
      { date: "2026-05-21", leads: 3, impressions: 9800, clicks: 245, cost: 320000 },
    ],
  }),

  "/marketing/analytics": () => ({
    acquisition: { revenue: 3185000000, clientsAcquired: 42, avgCpa: 84500 },
    funnel: { leadsQualified: 1284, leadToSampleRate: 21.4, prospects: 276, closingRate: 15.2 },
    budget: { totalAdSpend: 1248000000, budgetUsagePercent: 92, costPerLead: 97352, costPerSample: 315000 },
    trends: [
      { month: "Jan", leads: 74, cpl: 92, closing: 44, cpa: 98 },
      { month: "Feb", leads: 81, cpl: 89, closing: 48, cpa: 101 },
      { month: "Mar", leads: 88, cpl: 85, closing: 55, cpa: 97 },
      { month: "Apr", leads: 95, cpl: 84, closing: 62, cpa: 103 },
      { month: "May", leads: 102, cpl: 79, closing: 66, cpa: 100 },
      { month: "Jun", leads: 108, cpl: 76, closing: 72, cpa: 96 },
      { month: "Jul", leads: 116, cpl: 74, closing: 68, cpa: 105 },
      { month: "Aug", leads: 123, cpl: 72, closing: 74, cpa: 102 },
      { month: "Sep", leads: 129, cpl: 70, closing: 79, cpa: 106 },
      { month: "Oct", leads: 134, cpl: 68, closing: 81, cpa: 110 },
      { month: "Nov", leads: 141, cpl: 67, closing: 86, cpa: 108 },
      { month: "Dec", leads: 148, cpl: 65, closing: 90, cpa: 111 },
    ],
    productPerformance: [
      { cat: "Skincare Premium", leads: 384, sample: 124, deal: 39 },
      { cat: "Bodycare Harian", leads: 297, sample: 101, deal: 31 },
      { cat: "Haircare Repair", leads: 236, sample: 77, deal: 26 },
      { cat: "Packaging Custom", leads: 182, sample: 58, deal: 19 },
      { cat: "Maklon Trial Kit", leads: 144, sample: 43, deal: 14 },
    ],
    topContent: [
      { title: "Retinol Reels Launch", engagement: 6.8 },
      { title: "Behind The Brand Story", engagement: 6.1 },
      { title: "Packaging Before After", engagement: 5.7 },
      { title: "Founder FAQ Carousel", engagement: 5.3 },
      { title: "UGC Testimonial Cut", engagement: 5.1 },
    ],
    leadSourceRanking: [
      { name: "Meta Ads", leads: 428 },
      { name: "TikTok Ads", leads: 311 },
      { name: "Google Organic", leads: 222 },
      { name: "Instagram Organic", leads: 176 },
      { name: "Referral", leads: 89 },
    ],
  }),

  // ── EXECUTIVE ───────────────────────────────────────────────────

  "/executive/dashboard": () => ({
    totalRevenue: 3240000000,
    totalExpense: 2100000000,
    netProfit: 1140000000,
    revenueGrowth: 15.8,
    activeProjects: 24,
    onTimeDelivery: 87,
    qualityScore: 94,
    employeeCount: 128,
    departmentPerformance: [
      { dept: "BusDev", revenue: 3200000000, target: 3500000000, achievement: 91 },
      { dept: "Production", output: 45000, target: 50000, achievement: 90 },
      { dept: "R&D", samplesCompleted: 8, target: 10, achievement: 80 },
    ],
    revenueByDivision: [
      { division: "Maklon", amount: 1850000000, percentage: 57 },
      { division: "Branded", amount: 950000000, percentage: 29 },
      { division: "Repeat Order", amount: 440000000, percentage: 14 },
    ],
  }),

  "/executive/metrics": () => ({
    revenue: { mtd: 3240000000, target: 4000000000, achievement: 81, projection: 3860000000, growth: 15.8 },
    pipeline: { total: 48, deal: 12, prospect: 14, hot: 22 },
    production: { activeOrders: 24, overdue: 3, onProd: 11, qcFlow: 7, ready: 6 },
    cashflow: { totalAR: 680000000, aging: { "0-30": 310000000, "31-60": 240000000, "60+": 130000000 } },
    lost: { totalVal: 520000000, churnRate: 12.4 },
    repeatOrder: { rate: 48.2, revenue: 1560000000, readyToRepeat: 9 },
  }),

  "/executive/alerts": () => ({
    production: { overdue: 3 },
    cashflow: { overdueInvoices: 2 },
    sales: { unfollowed: 14 },
  }),

  // ── HR ──────────────────────────────────────────────────────────

  "/hr/dashboard": () => ({
    totalEmployees: 128,
    present: 112,
    onLeave: 8,
    absent: 5,
    sick: 3,
    attendanceRate: 87.5,
    departments: [
      { name: "Production", count: 45, head: "Manager A" },
      { name: "BusDev", count: 12, head: "Manager B" },
      { name: "R&D", count: 15, head: "Manager C" },
      { name: "Finance", count: 10, head: "Manager D" },
      { name: "Warehouse", count: 18, head: "Manager E" },
      { name: "SCM", count: 8, head: "Manager F" },
      { name: "QC", count: 10, head: "Manager G" },
      { name: "Marketing", count: 6, head: "Manager H" },
      { name: "Legal", count: 4, head: "Manager I" },
    ],
  }),

  "/hr/executive-summary": () => ({
    stabilityIndex: 86.4,
    avgKpi: 84,
    totalEmployees: 128,
    presentToday: 112,
    onLeave: 8,
    hiringThisMonth: 3,
    attritionRate: 4.2,
  }),

  "/hr/department-scores": () => [
    { division: "PRODUCTION", employees: [
      { id: "E-001", name: "Panca", position: "Formulator", joinedAt: "2021-03-15", kpi: 88, disiplin: 92, output: "Sesuai target", attitude: 90, contractEnd: "2027-03-15" },
      { id: "E-002", name: "Yaya", position: "Lab R&D", joinedAt: "2022-06-01", kpi: 91, disiplin: 89, output: "Melampaui target", attitude: 93, contractEnd: "2026-12-01" },
      { id: "E-003", name: "Amira", position: "Lead Formulator", joinedAt: "2019-08-20", kpi: 94, disiplin: 95, output: "Melampaui target", attitude: 96, contractEnd: "2028-08-20" },
    ]},
    { division: "QC", employees: [
      { id: "E-101", name: "Rina", position: "QC Analyst", joinedAt: "2020-02-10", kpi: 89, disiplin: 93, output: "Sesuai target", attitude: 91, contractEnd: "2027-02-10" },
      { id: "E-102", name: "Bayu", position: "QC Inspector", joinedAt: "2021-11-05", kpi: 85, disiplin: 88, output: "Sesuai target", attitude: 87, contractEnd: "2026-11-05" },
    ]},
    { division: "WAREHOUSE", employees: [
      { id: "E-201", name: "Joko", position: "Warehouse Supervisor", joinedAt: "2018-04-01", kpi: 82, disiplin: 90, output: "Sesuai target", attitude: 88, contractEnd: "2026-09-01" },
    ]},
    { division: "BD", employees: [
      { id: "E-301", name: "Andi Pratama", position: "BD Executive", joinedAt: "2019-05-12", kpi: 92, disiplin: 94, output: "Melampaui target", attitude: 90, contractEnd: "2027-05-12" },
      { id: "E-302", name: "Citra Kirana", position: "BD Executive", joinedAt: "2020-09-23", kpi: 87, disiplin: 91, output: "Sesuai target", attitude: 92, contractEnd: "2026-10-23" },
    ]},
    { division: "RND", employees: [
      { id: "E-401", name: "Amira", position: "R&D Manager", joinedAt: "2019-08-20", kpi: 94, disiplin: 95, output: "Melampaui target", attitude: 96, contractEnd: "2028-08-20" },
    ]},
    { division: "SCM", employees: [
      { id: "E-501", name: "Bagus", position: "SCM Supervisor", joinedAt: "2020-03-16", kpi: 86, disiplin: 89, output: "Sesuai target", attitude: 85, contractEnd: "2026-07-16" },
    ]},
    { division: "FINANCE", employees: [
      { id: "E-601", name: "Sari", position: "Finance Manager", joinedAt: "2017-01-09", kpi: 90, disiplin: 96, output: "Melampaui target", attitude: 89, contractEnd: "2027-01-09" },
    ]},
    { division: "MANAGEMENT", employees: [
      { id: "E-701", name: "Luthfi", position: "General Manager", joinedAt: "2016-10-01", kpi: 95, disiplin: 97, output: "Melampaui target", attitude: 98, contractEnd: "2029-10-01" },
    ]},
  ],

  // ── MASTER DATA ────────────────────────────────────────────────

  "/master/customers": () => [
    { id: "C-001", name: "PT Sejahtera Abadi", email: "info@sejahtera.com", phone: "021-5551001", city: "Jakarta", type: "CORPORATE", status: "ACTIVE" },
    { id: "C-002", name: "CV Bumi Kosmetik", email: "info@bumi.com", phone: "022-5552002", city: "Bandung", type: "CORPORATE", status: "ACTIVE" },
    { id: "C-003", name: "PT Natural Beauty", email: "info@naturalbeauty.com", phone: "031-5553003", city: "Surabaya", type: "CORPORATE", status: "ACTIVE" },
  ],

  "/master/suppliers": () => [
    { id: "S-001", name: "PT Bahan Baku Utama", email: "info@bahanbaku.com", phone: "021-5557001", city: "Jakarta", category: "RAW_MATERIAL", status: "ACTIVE" },
    { id: "S-002", name: "CV Kemasan Indah", email: "info@kemasanindah.com", phone: "022-5558002", city: "Bandung", category: "PACKAGING", status: "ACTIVE" },
  ],

  "/master/materials": () => [
    { id: "M-001", name: "Niacinamide", unit: "kg", category: "BAHAN BAKU", currentStock: 150, minStock: 100 },
    { id: "M-002", name: "Glycerin", unit: "kg", category: "BAHAN BAKU", currentStock: 320, minStock: 200 },
    { id: "M-003", name: "Botol Kaca 30ml", unit: "pcs", category: "KEMASAN", currentStock: 2500, minStock: 1000 },
  ],

  "/master/products": () => [
    { id: "P-001", name: "Brightening Serum", sku: "SER-001", category: "SKINCARE", price: 45000, status: "ACTIVE" },
    { id: "P-002", name: "Moisturizer Green", sku: "MST-001", category: "SKINCARE", price: 35000, status: "ACTIVE" },
    { id: "P-003", name: "Face Wash Clean", sku: "FWH-001", category: "SKINCARE", price: 22000, status: "ACTIVE" },
  ],

  // ── CREATIVE ──────────────────────────────────────────────────

  "/creative/tasks": () => [
    { id: "CR-001", title: "Desain Kemasan GlowNat", status: "INBOX", brand: "GlowNat", lead: { clientName: "PT Sejahtera Abadi" }, dueDate: "2026-06-01" },
    { id: "CR-002", title: "Mockup Label BioEssence", status: "IN_PROGRESS", brand: "BioEssence", lead: { clientName: "PT Natural Beauty" }, dueDate: "2026-05-28" },
    { id: "CR-003", title: "Revisi Artwork EarthGlow", status: "WAITING_CLIENT", brand: "EarthGlow", lead: { clientName: "CV Bumi Kosmetik" }, dueDate: "2026-06-05" },
  ],

  // ── USER ────────────────────────────────────────────────────────

  "/user/todo": () => [
    { id: "TD-001", title: "Follow up PT Sejahtera Abadi", priority: "HIGH", dueDate: "2026-05-23", status: "PENDING" },
    { id: "TD-002", title: "Upload SPK PT Natural Beauty", priority: "HIGH", dueDate: "2026-05-24", status: "PENDING" },
    { id: "TD-003", title: "Review sample CV Bumi Kosmetik", priority: "MEDIUM", dueDate: "2026-05-25", status: "PENDING" },
    { id: "TD-004", title: "Prepare quotation PT Luxcare", priority: "LOW", dueDate: "2026-05-28", status: "COMPLETED" },
  ],

  // ── SALES ORDERS ─────────────────────────────────────────────────

  "/commercial/sales-orders": () => [
    { id: "SO-001", orderNumber: "SO-2026-0001", brandName: "GlowNat", totalAmount: 150000000, quantity: 5000, status: "LOCKED_ACTIVE", clientName: "PT Sejahtera Abadi", createdAt: "2026-05-10" },
    { id: "SO-002", orderNumber: "SO-2026-0002", brandName: "BioEssence", totalAmount: 500000000, quantity: 20000, status: "PENDING_DP", clientName: "PT Natural Beauty", createdAt: "2026-05-15" },
    { id: "SO-003", orderNumber: "SO-2026-0003", brandName: "LuxGlow", totalAmount: 350000000, quantity: 15000, status: "COMPLETED", clientName: "PT Luxcare Indonesia", createdAt: "2026-05-05" },
  ],

  // ── SYSTEM ──────────────────────────────────────────────────────

  "/system/audit-log": () => [
    { id: "AL-001", action: "USER_LOGIN", userId: "admin", timestamp: "2026-05-22T08:00:00Z", details: "Login from IP 192.168.1.1" },
    { id: "AL-002", action: "LEAD_CREATED", userId: "budi", timestamp: "2026-05-21T16:45:00Z", details: "Lead L-004 created" },
    { id: "AL-003", action: "PAYMENT_VERIFIED", userId: "finance", timestamp: "2026-05-22T09:15:00Z", details: "DP verified for L-003" },
  ],

  // ── CATCH-ALL ──────────────────────────────────────────────────

  default: () => ({
    message: "Mock data active",
    data: [],
    total: 0,
    success: true,
  }),
};

export function getMockData(url: string): any {
  const cleanUrl = url.split("?")[0].replace(/\/+$/, "");

  // Paling spesifik (path terpanjang) dicocokkan dulu, supaya
  // mis. `/finance/dashboard/advanced` tidak ketuker data
  // `/finance/dashboard`.
  const patterns = Object.keys(MOCK_DATA)
    .filter((pattern) => pattern !== "default")
    .sort((a, b) => b.length - a.length);

  for (const pattern of patterns) {
    if (cleanUrl === pattern || cleanUrl.startsWith(pattern)) {
      return (MOCK_DATA[pattern] as (url?: string) => any)(url);
    }
  }

  return MOCK_DATA.default();
}
