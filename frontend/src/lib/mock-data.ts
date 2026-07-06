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
      { brand: "Nature Glow", reason: "Price", bd: "Andi P.", val: "250Jt" },
      { brand: "Zen Skin", reason: "Sample", bd: "Budi S.", val: "120Jt" },
      { brand: "Aqua Pure", reason: "Ghosting", bd: "Andi P.", val: "450Jt" },
    ],
  }),

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
    totalPO: 24,
    pendingPR: 8,
    overduePO: 3,
    totalVendors: 15,
    stockAlerts: 5,
    monthlyProcurement: 890000000,
    purchaseOrders: [
      { id: "PO-001", poNumber: "PO-2026-0001", supplier: "PT Bahan Baku", status: "APPROVED", totalValue: 340000000, items: 5, eta: "2026-06-05" },
      { id: "PO-002", poNumber: "PO-2026-0002", supplier: "CV Kemasan Indah", status: "PENDING", totalValue: 120000000, items: 3, eta: "2026-06-10" },
      { id: "PO-003", poNumber: "PO-2026-0003", supplier: "PT Logistik Global", status: "RECEIVED", totalValue: 89000000, items: 2, eta: "2026-05-25" },
    ],
    purchaseRequests: [
      { id: "PR-001", prNumber: "PR-2026-0001", requester: "Production", status: "PENDING_APPROVAL_SCM", items: 4, totalEstimate: 150000000, createdAt: "2026-05-20" },
      { id: "PR-002", prNumber: "PR-2026-0002", requester: "Warehouse", status: "APPROVED", items: 2, totalEstimate: 85000000, createdAt: "2026-05-18" },
    ],
  }),

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
    passRate: "94.2%",
    totalReject: 4,
    totalLoss: "Rp 14.5M",
  }),

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

  for (const [pattern, handler] of Object.entries(MOCK_DATA)) {
    if (pattern === "default") continue;
    if (cleanUrl === pattern || cleanUrl.startsWith(pattern)) {
      return (handler as (url?: string) => any)(url);
    }
  }

  return MOCK_DATA.default();
}
