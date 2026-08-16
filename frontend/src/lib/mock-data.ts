import {
  marketingProjects,
  marketingTasks,
  marketingPerformance,
} from "@/components/marketing/project-management-prototype-data";
import {
  marketingNotifications,
  marketingReportInsights,
  marketingSettings,
  marketingProfiles,
  marketingTeamSummary,
} from "@/components/marketing/project-management-prototype-extra-data";

export const MOCK_DATA: any = {
  // ── MARKETING PROTOTYPE BUNDLE ───────────────────────────────
  // Dipakai halaman Management Task (tab team/leaderboard/kpi/dll).
  // Tanpa mock ini, query bundle resolve jadi [] → tab kosong.

  "/marketing/prototype/bundle": () => {
    const activeProjects = marketingProjects.filter((item: any) => item.status !== "Completed").length;
    const openTasks = marketingTasks.filter((item: any) => !["Done", "Cancelled"].includes(item.status)).length;
    const waitingApproval = marketingTasks.filter((item: any) => item.status === "Waiting Approval").length;
    const averageKpi = Math.round(
      marketingPerformance.reduce((sum: number, item: any) => sum + item.overallKpi, 0) /
        Math.max(marketingPerformance.length, 1),
    );
    return {
      summary: { activeProjects, openTasks, waitingApproval, averageKpi },
      projects: marketingProjects,
      tasks: marketingTasks,
      performance: marketingPerformance,
      notifications: marketingNotifications,
      settings: {
        weights: {
          completion: marketingSettings[0]?.value ?? 40,
          discipline: marketingSettings[1]?.value ?? 30,
          quality: marketingSettings[2]?.value ?? 15,
          productivity: marketingSettings[3]?.value ?? 15,
        },
        workingHours: { start: "08:00", end: "17:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
      },
      profiles: marketingProfiles,
      insights: marketingReportInsights,
      reports: {
        averageKpi: marketingTeamSummary.averageKpi,
        teamSize: marketingTeamSummary.totalMembers,
        kpiHistory: marketingPerformance.map((member: any) => ({
          name: member.name,
          history: [
            { period: "W1", kpi: Math.max(member.overallKpi - 8, 0), discipline: Math.max(member.disciplineScore - 6, 0) },
            { period: "W2", kpi: Math.max(member.overallKpi - 4, 0), discipline: Math.max(member.disciplineScore - 3, 0) },
            { period: "W3", kpi: Math.max(member.overallKpi - 1, 0), discipline: Math.max(member.disciplineScore - 1, 0) },
            { period: "W4", kpi: Math.min(member.overallKpi + 2, 100), discipline: Math.min(member.disciplineScore + 2, 100) },
            { period: "W5", kpi: Math.min(member.overallKpi + 4, 100), discipline: Math.min(member.disciplineScore + 4, 100) },
            { period: "W6", kpi: member.overallKpi, discipline: member.disciplineScore },
          ],
        })),
      },
    };
  },

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
    { id: "INV-001", invoiceNumber: "INV-2026-0001", kode: "INV-2026-0001", category: "RECEIVABLE", type: "RECEIVABLE", clientName: "PT Natural Beauty", customerName: "PT Natural Beauty", customer: "PT Natural Beauty", pelanggan: "PT Natural Beauty", amountDue: 500000000, totalAmount: 500000000, amount: 500000000, outstandingAmount: 0, remainingAmount: 0, paidAmount: 500000000, sisa: 0, status: "PAID", dueDate: "2026-06-15", tanggal: "2026-06-15", createdAt: "2026-05-01", produk: "Brightening Serum", source: "PENJUALAN" },
    { id: "INV-002", invoiceNumber: "INV-2026-0002", kode: "INV-2026-0002", category: "RECEIVABLE", type: "RECEIVABLE", clientName: "PT Sejahtera Abadi", customerName: "PT Sejahtera Abadi", customer: "PT Sejahtera Abadi", pelanggan: "PT Sejahtera Abadi", amountDue: 150000000, totalAmount: 150000000, amount: 150000000, outstandingAmount: 75000000, remainingAmount: 75000000, paidAmount: 75000000, sisa: 75000000, status: "PARTIAL", dueDate: "2026-06-20", tanggal: "2026-06-20", createdAt: "2026-05-05", produk: "Moisturizer Green", source: "PENJUALAN" },
    { id: "INV-003", invoiceNumber: "INV-2026-0003", kode: "INV-2026-0003", category: "PAYABLE", type: "PAYABLE", clientName: "PT Bahan Baku", customerName: "PT Bahan Baku", customer: "PT Bahan Baku", pelanggan: "PT Bahan Baku", amountDue: 340000000, totalAmount: 340000000, amount: 340000000, outstandingAmount: 340000000, remainingAmount: 340000000, paidAmount: 0, sisa: 340000000, status: "UNPAID", dueDate: "2026-06-10", tanggal: "2026-06-10", createdAt: "2026-05-10", produk: "Niacinamide", source: "PEMBELIAN" },
    { id: "INV-004", invoiceNumber: "INV-2026-0004", kode: "INV-2026-0004", category: "RECEIVABLE", type: "RECEIVABLE", clientName: "PT Luxcare Indonesia", customerName: "PT Luxcare Indonesia", customer: "PT Luxcare Indonesia", pelanggan: "PT Luxcare Indonesia", amountDue: 350000000, totalAmount: 350000000, amount: 350000000, outstandingAmount: 350000000, remainingAmount: 350000000, paidAmount: 0, sisa: 350000000, status: "UNPAID", dueDate: "2026-07-01", tanggal: "2026-07-01", createdAt: "2026-05-15", produk: "Body Lotion SPF", source: "PENJUALAN" },
    { id: "INV-005", invoiceNumber: "INV-2026-0005", kode: "INV-2026-0005", category: "PAYABLE", type: "PAYABLE", clientName: "CV Kemasan Indah", customerName: "CV Kemasan Indah", customer: "CV Kemasan Indah", pelanggan: "CV Kemasan Indah", amountDue: 120000000, totalAmount: 120000000, amount: 120000000, outstandingAmount: 120000000, remainingAmount: 120000000, paidAmount: 0, sisa: 120000000, status: "UNPAID", dueDate: "2026-06-25", tanggal: "2026-06-25", createdAt: "2026-05-18", produk: "Botol Kaca 30ml", source: "PEMBELIAN" },
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
    { id: "WO-001", woNumber: "WO-2026-0001", batchNo: "BATCH-2026-0001", product: "Brightening Serum", qty: 5000, targetQty: 5000, status: "IN_PROGRESS", stage: "MIXING", progress: 60, dueDate: "2026-05-25", picName: "Production A", createdAt: "2026-05-10", lead: { brandName: "GlowNat", productInterest: "Serum" } },
    { id: "WO-002", woNumber: "WO-2026-0002", batchNo: "BATCH-2026-0002", product: "Moisturizer Green", qty: 3000, targetQty: 3000, status: "MIXING", stage: "MIXING", progress: 25, dueDate: "2026-05-28", picName: "Production B", createdAt: "2026-05-12", lead: { brandName: "EarthGlow", productInterest: "Moisturizer" } },
    { id: "WO-003", woNumber: "WO-2026-0003", batchNo: "BATCH-2026-0003", product: "Face Wash Clean", qty: 10000, targetQty: 10000, status: "PACKING", stage: "PACKING", progress: 85, dueDate: "2026-05-24", picName: "Production A", createdAt: "2026-05-08", lead: { brandName: "LuxGlow", productInterest: "Face Wash" } },
    { id: "WO-004", woNumber: "WO-2026-0004", batchNo: "BATCH-2026-0004", product: "Toner Glow", qty: 8000, targetQty: 8000, status: "PLANNED", stage: "PLANNED", progress: 0, dueDate: "2026-06-01", picName: "Production C", createdAt: "2026-05-15", lead: { brandName: "BioEssence", productInterest: "Toner" } },
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
    { id: "C-001", name: "PT Sejahtera Abadi", clientName: "PT Sejahtera Abadi", email: "info@sejahtera.com", phone: "021-5551001", city: "Jakarta", type: "CORPORATE", status: "ACTIVE" },
    { id: "C-002", name: "CV Bumi Kosmetik", clientName: "CV Bumi Kosmetik", email: "info@bumi.com", phone: "022-5552002", city: "Bandung", type: "CORPORATE", status: "ACTIVE" },
    { id: "C-003", name: "PT Natural Beauty", clientName: "PT Natural Beauty", email: "info@naturalbeauty.com", phone: "031-5553003", city: "Surabaya", type: "CORPORATE", status: "ACTIVE" },
    { id: "C-004", name: "PT Luxcare Indonesia", clientName: "PT Luxcare Indonesia", email: "info@luxcare.com", phone: "021-5554004", city: "Tangerang", type: "CORPORATE", status: "ACTIVE" },
    { id: "C-005", name: "PT Indo Beauty", clientName: "PT Indo Beauty", email: "info@indobeauty.com", phone: "031-5555005", city: "Surabaya", type: "CORPORATE", status: "INACTIVE" },
  ],

  "/master/categories": () => [
    { id: "CAT-001", name: "CORPORATE", type: "CUSTOMER", status: "ACTIVE" },
    { id: "CAT-002", name: "RETAIL", type: "CUSTOMER", status: "ACTIVE" },
    { id: "CAT-003", name: "DISTRIBUTOR", type: "CUSTOMER", status: "ACTIVE" },
    { id: "CAT-004", name: "BAHAN BAKU", type: "GOODS", status: "ACTIVE" },
    { id: "CAT-005", name: "KEMASAN", type: "GOODS", status: "ACTIVE" },
    { id: "CAT-006", name: "BAHAN PENUNJANG", type: "GOODS", status: "ACTIVE" },
    { id: "CAT-007", name: "RAW_MATERIAL", type: "SUPPLIER", status: "ACTIVE" },
    { id: "CAT-008", name: "PACKAGING", type: "SUPPLIER", status: "ACTIVE" },
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
    { id: "SO-001", orderNumber: "SO-2026-0001", brandName: "GlowNat", totalAmount: 150000000, quantity: 5000, status: "LOCKED_ACTIVE", clientName: "PT Sejahtera Abadi", createdAt: "2026-05-10", invoices: [{ id: "INV-001", invoiceNumber: "INV-2026-0001", status: "PAID", amount: 150000000 }] },
    { id: "SO-002", orderNumber: "SO-2026-0002", brandName: "BioEssence", totalAmount: 500000000, quantity: 20000, status: "PENDING_DP", clientName: "PT Natural Beauty", createdAt: "2026-05-15", invoices: [{ id: "INV-004", invoiceNumber: "INV-2026-0004", status: "UNPAID", amount: 500000000 }] },
    { id: "SO-003", orderNumber: "SO-2026-0003", brandName: "LuxGlow", totalAmount: 350000000, quantity: 15000, status: "COMPLETED", clientName: "PT Luxcare Indonesia", createdAt: "2026-05-05", invoices: [] },
  ],

  "/analytics/executive": () => ({
    acquisition: { revenue_mtd: 3240000000, target: 4000000000, revenue: 3240000000, deal: 12, avg: 78000000 },
    funnel: { leads: 1284, samples: 276, closing: 15.2, closing_rate: 15.2 },
    budget: { total: 1248000000, budget: 1500000000, cost: 97352, cpl: 97352, total_spend: 1248000000, budget_limit: 1500000000, cost_per_sample: 315000 },
    trends: [
      { month: "Jan", leads: 74, cpl: 92, closing: 44 },
      { month: "Feb", leads: 81, cpl: 89, closing: 48 },
      { month: "Mar", leads: 88, cpl: 85, closing: 55 },
      { month: "Apr", leads: 95, cpl: 84, closing: 62 },
      { month: "May", leads: 102, cpl: 79, closing: 66 },
      { month: "Jun", leads: 108, cpl: 76, closing: 72 },
    ],
    content: [
      { id: "CT-1", title: "Retinol Reels Launch", category: "REELS", engagement: 6.8, engagement_rate: 6.8, views: 24000 },
      { id: "CT-2", title: "Behind The Brand Story", category: "REELS", engagement: 6.1, engagement_rate: 6.1, views: 18500 },
      { id: "CT-3", title: "Packaging Before After", category: "CAROUSEL", engagement: 5.7, engagement_rate: 5.7, views: 15200 },
    ],
    lead_ranking: [
      { source: "Meta Ads", count: 428 },
      { source: "TikTok Ads", count: 311 },
      { source: "Google Organic", count: 222 },
      { source: "Instagram Organic", count: 176 },
      { source: "Referral", count: 89 },
    ],
    vitality: { followers: 184200, growth: 4.8, total: 18, total_likes: 24800, total_comments: 2140, total_shares: 3890, total_saves: 4620 },
    platform: { name: "INSTAGRAM", followers: "98.4K", growth: "+4.8%" },
    platform_audit: [
      { platform: "Instagram", spend: 4800000, leads: 428, cpl: 11215, cpc: 890 },
      { platform: "TikTok", spend: 2900000, leads: 311, cpl: 9325, cpc: 760 },
      { platform: "Google", spend: 3200000, leads: 222, cpl: 14414, cpc: 1050 },
      { platform: "Meta", spend: 1580000, leads: 176, cpl: 8977, cpc: 640 },
    ],
  }),

  // ── SYSTEM ──────────────────────────────────────────────────────

  "/system/audit-log": () => [
    { id: "AL-001", action: "USER_LOGIN", entityId: "USR-001", entityType: "USER", reason: "Login sukses", userId: "admin", timestamp: "2026-05-22T08:00:00Z", details: "Login from IP 192.168.1.1" },
    { id: "AL-002", action: "LEAD_CREATED", entityId: "L-004", entityType: "LEAD", reason: "Lead baru dari website", userId: "budi", timestamp: "2026-05-21T16:45:00Z", details: "Lead L-004 created" },
    { id: "AL-003", action: "PAYMENT_VERIFIED", entityId: "INV-001", entityType: "INVOICE", reason: "DP diverifikasi finance", userId: "finance", timestamp: "2026-05-22T09:15:00Z", details: "DP verified for L-003" },
    { id: "AL-004", action: "WORK_ORDER_UPDATED", entityId: "WO-001", entityType: "WORK_ORDER", reason: "Update progress produksi", userId: "panca", timestamp: "2026-05-22T10:00:00Z", details: "WO-2026-0001 progress 60%" },
  ],

  // ── FINANCE REPORTS ───────────────────────────────────────────

  "/finance/reports/balance-sheet": () => ({
    assets: {
      total: 4280000000,
      currentAssets: 2350000000,
      fixedAssets: 1930000000,
      isBalanced: true,
      items: [
        { id: "A-1", parentId: null, code: "1101", name: "Kas & Bank", reportGroup: "AKTIVA_LANCAR", amount: 850000000 },
        { id: "A-2", parentId: null, code: "1102", name: "Piutang Usaha", reportGroup: "AKTIVA_LANCAR", amount: 680000000 },
        { id: "A-3", parentId: null, code: "1103", name: "Persediaan", reportGroup: "AKTIVA_LANCAR", amount: 820000000 },
        { id: "A-4", parentId: null, code: "1201", name: "Aset Tetap", reportGroup: "AKTIVA_TETAP", amount: 1930000000 },
      ],
    },
    liabilities: {
      total: 1740000000,
      isBalanced: true,
      items: [
        { id: "L-1", parentId: null, code: "2101", name: "Hutang Usaha", reportGroup: "KEWAJIBAN_JANGKA_PENDEK", amount: 940000000 },
        { id: "L-2", parentId: null, code: "2102", name: "Hutang Bank", reportGroup: "KEWAJIBAN_JANGKA_PANJANG", amount: 800000000 },
      ],
    },
    equity: { total: 2540000000, isBalanced: true, items: [{ id: "E-1", parentId: null, code: "3101", name: "Modal", reportGroup: "MODAL", amount: 2540000000 }] },
    totalLiabilitiesAndEquity: 4280000000,
    isBalanced: true,
  }),

  "/finance/reports/trial-balance/detailed": () => ({
    data: [
      { accountCode: "1101", accountName: "Kas Utama", akhirDebit: 850000000, akhirCredit: 0, debit: 850000000, credit: 0 },
      { accountCode: "1102", accountName: "Bank BCA", akhirDebit: 420000000, akhirCredit: 0, debit: 420000000, credit: 0 },
      { accountCode: "1201", accountName: "Piutang Usaha", akhirDebit: 680000000, akhirCredit: 0, debit: 680000000, credit: 0 },
      { accountCode: "1301", accountName: "Persediaan", akhirDebit: 820000000, akhirCredit: 0, debit: 820000000, credit: 0 },
      { accountCode: "2101", accountName: "Hutang Usaha", akhirDebit: 0, akhirCredit: 940000000, debit: 0, credit: 940000000 },
      { accountCode: "3101", accountName: "Modal", akhirDebit: 0, akhirCredit: 2540000000, debit: 0, credit: 2540000000 },
    ],
    totals: { akhirDebit: 2770000000, akhirCredit: 3480000000 },
    isBalanced: false,
  }),

  "/finance/reports/general-ledger": () => ({
    account: { id: "ACC-001", code: "1101", name: "Kas Utama", normalBalance: "DEBIT", type: "AKTIVA" },
    beginningBalance: 50000000,
    endingBalance: 850000000,
    transactions: [
      { id: "GL-1", date: "2026-05-01", description: "Setoran modal awal", debit: 50000000, credit: 0 },
      { id: "GL-2", date: "2026-05-10", description: "Penerimaan DP PT Natural Beauty", debit: 250000000, credit: 0 },
      { id: "GL-3", date: "2026-05-15", description: "Pembelian bahan baku", debit: 0, credit: 120000000 },
      { id: "GL-4", date: "2026-05-20", description: "Pelunasan piutang PT Sejahtera", debit: 75000000, credit: 0 },
    ],
  }),

  "/finance/reports/project-budgeting": () => ({
    totalBudget: 1500000000,
    totalSpent: 980000000,
    remaining: 520000000,
    projects: [
      { id: "PJ-1", name: "Launch GlowNat Serum", budget: 500000000, spent: 320000000, status: "ON_TRACK" },
      { id: "PJ-2", name: "Rebranding EarthGlow", budget: 400000000, spent: 410000000, status: "OVER_BUDGET" },
      { id: "PJ-3", name: "Marketing Q3", budget: 600000000, spent: 250000000, status: "ON_TRACK" },
    ],
  }),

  "/finance/reports/profit-loss": () => ({
    operatingRevenue: { total: 3240000000, items: [{ id: "R-1", name: "Penjualan Maklon", amount: 1850000000 }, { id: "R-2", name: "Penjualan Branded", amount: 950000000 }, { id: "R-3", name: "Repeat Order", amount: 440000000 }] },
    otherIncome: { total: 50000000, items: [{ id: "OI-1", name: "Pendapatan Lain-lain", amount: 50000000 }] },
    cogs: { total: 1750000000, items: [{ id: "C-1", name: "Bahan Baku", amount: 1250000000 }, { id: "C-2", name: "Kemasan", amount: 350000000 }, { id: "C-3", name: "Tenaga Kerja Produksi", amount: 150000000 }] },
    operatingExpenses: { total: 550000000, items: [{ id: "E-1", name: "Gaji & Tunjangan", amount: 350000000 }, { id: "E-2", name: "Operasional Kantor", amount: 120000000 }, { id: "E-3", name: "Marketing", amount: 80000000 }] },
    otherExpenses: { total: 30000000, items: [{ id: "OE-1", name: "Beban Lain-lain", amount: 30000000 }] },
    grossProfit: 1490000000,
    operatingIncome: 940000000,
    netProfit: 940000000,
  }),

  // ── FINANCE LANGSUNG ──────────────────────────────────────────

  "/finance/accounts": () => [
    { id: "ACC-001", accountCode: "1101", accountName: "Kas Utama", type: "ASSET", balance: 850000000, category: "CURRENT_ASSET" },
    { id: "ACC-002", accountCode: "1102", accountName: "Bank BCA", type: "ASSET", balance: 420000000, category: "CURRENT_ASSET" },
    { id: "ACC-003", accountCode: "2101", accountName: "Hutang Usaha", type: "LIABILITY", balance: 940000000, category: "CURRENT_LIABILITY" },
    { id: "ACC-004", accountCode: "4101", accountName: "Pendapatan Penjualan", type: "REVENUE", balance: 3240000000, category: "REVENUE" },
  ],

  "/finance/coa": () => [
    { id: "COA-001", code: "1101", name: "Kas Utama", type: "AKTIVA", parent: null },
    { id: "COA-002", code: "1102", name: "Bank BCA", type: "AKTIVA", parent: null },
    { id: "COA-003", code: "2101", name: "Hutang Usaha", type: "KEWAJIBAN", parent: null },
    { id: "COA-004", code: "4101", name: "Pendapatan Penjualan", type: "PENDAPATAN", parent: null },
  ],

  "/finance/bills": () => [
    { id: "BILL-001", billNumber: "BL-2026-0001", supplier: "PT Bahan Baku", amount: 340000000, status: "UNPAID", dueDate: "2026-06-10", category: "PAYABLE" },
    { id: "BILL-002", billNumber: "BL-2026-0002", supplier: "CV Kemasan Indah", amount: 120000000, status: "PARTIAL", dueDate: "2026-06-25", category: "PAYABLE" },
  ],

  "/finance/fund-requests": () => [
    { id: "FR-001", requestNumber: "FR-2026-0001", requester: "Rina", department: "QC", purpose: "Pembelian reagen lab", amount: 25000000, status: "PENDING", createdAt: "2026-05-20" },
    { id: "FR-002", requestNumber: "FR-2026-0002", requester: "Bagus", department: "SCM", purpose: "DP supplier kemasan", amount: 48000000, status: "APPROVED", createdAt: "2026-05-18" },
  ],

  "/finance/journal": () => [
    { id: "JRN-001", journalNumber: "JR-2026-0001", date: "2026-05-22", description: "Penerimaan DP PT Natural Beauty", accountCode: "1101", debit: 250000000, credit: 0, lines: [{ account: { code: "1101", name: "Kas Utama" }, debit: 250000000, credit: 0 }, { account: { code: "4101", name: "Pendapatan" }, debit: 0, credit: 250000000 }] },
    { id: "JRN-002", journalNumber: "JR-2026-0002", date: "2026-05-21", description: "Pembelian bahan baku", accountCode: "5101", debit: 120000000, credit: 0, lines: [{ account: { code: "5101", name: "Biaya Bahan Baku" }, debit: 120000000, credit: 0 }, { account: { code: "1101", name: "Kas Utama" }, debit: 0, credit: 120000000 }] },
    { id: "JRN-003", journalNumber: "JR-2026-0003", date: "2026-05-20", description: "Penerimaan pelunasan PT Sejahtera", accountCode: "1101", debit: 75000000, credit: 0, lines: [{ account: { code: "1101", name: "Kas Utama" }, debit: 75000000, credit: 0 }, { account: { code: "1201", name: "Piutang Usaha" }, debit: 0, credit: 75000000 }] },
    { id: "JRN-004", journalNumber: "JR-2026-0004", date: "2026-05-18", description: "Pembayaran gaji karyawan", accountCode: "5102", debit: 85000000, credit: 0, lines: [{ account: { code: "5102", name: "Biaya Gaji" }, debit: 85000000, credit: 0 }, { account: { code: "1101", name: "Kas Utama" }, debit: 0, credit: 85000000 }] },
  ],

  "/finance/journals": () => [
    { id: "JRN-001", journalNumber: "JR-2026-0001", date: "2026-05-22", description: "Penerimaan DP PT Natural Beauty", entries: [{ accountCode: "1101", debit: 250000000, credit: 0 }] },
    { id: "JRN-002", journalNumber: "JR-2026-0002", date: "2026-05-21", description: "Pembelian bahan baku", entries: [{ accountCode: "5101", debit: 120000000, credit: 0 }] },
  ],

  "/finance/cogs-requests": () => [
    { id: "COGS-001", requestNumber: "COGS-2026-0001", product: "Brightening Serum", qty: 5000, unitCost: 18000, totalCost: 90000000, status: "PENDING" },
    { id: "COGS-002", requestNumber: "COGS-2026-0002", product: "Moisturizer Green", qty: 3000, unitCost: 21000, totalCost: 63000000, status: "APPROVED" },
  ],

  // ── BUSSDEV LANJUTAN ──────────────────────────────────────────

  "/bussdev/sales-returns": () => [
    { id: "SR-001", returnNumber: "SR-2026-0001", client: "PT Sejahtera Abadi", brand: "GlowNat", qty: 120, reason: "Produk rusak", status: "PENDING", total: 5400000 },
  ],

  "/bussdev/sales-targets": () => [
    { id: "ST-001", period: "2026-05", target: 3500000000, achieved: 3240000000, achievement: 92.6 },
    { id: "ST-002", period: "2026-06", target: 4000000000, achieved: 0, achievement: 0 },
  ],

  "/bussdev/samples": () => [
    { id: "SMP-001", noSample: "SS-202606-0001", client: "PT Sejahtera Abadi", brand: "GlowNat", product: "Serum Brightening", status: "APPROVED", date: "2026-06-01" },
    { id: "SMP-002", noSample: "SS-202606-0002", client: "CV Bumi Kosmetik", brand: "EarthGlow", product: "Moisturizer", status: "QUEUE", date: "2026-06-03" },
  ],

  "/bussdev/lead": () => [
    { id: "L-001", clientName: "PT Sejahtera Abadi", brandName: "GlowNat", productInterest: "Serum", estimatedValue: 150000000, status: "SAMPLE_APPROVED", stage: "SAMPLE_APPROVED", picName: "Andi Pratama", moq: 5000, unitPrice: 45000, notes: "" },
    { id: "L-002", clientName: "CV Bumi Kosmetik", brandName: "EarthGlow", productInterest: "Moisturizer", estimatedValue: 250000000, status: "NEGOTIATION", stage: "NEGOTIATION", picName: "Citra Kirana", moq: 10000, unitPrice: 35000, notes: "" },
  ],

  // ── LEGALITY ──────────────────────────────────────────────────

  "/legality/inbox/tasks": () => [
    { id: "LK-001", taskType: "FORMULA_VALIDATION", pipelineId: "PPL-2026-0001", brand: "GlowNat", product: "Serum Brightening", status: "PENDING", priority: "HIGH", category: "BPOM", requester: "R&D", createdAt: "2026-05-20T09:00:00Z", updatedAt: "2026-05-20T09:00:00Z" },
    { id: "LK-002", taskType: "ARTWORK_REVIEW", pipelineId: "PPL-2026-0002", brand: "EarthGlow", product: "Moisturizer", status: "PENDING", priority: "MEDIUM", category: "HALAL", requester: "Creative", createdAt: "2026-05-19T14:30:00Z", updatedAt: "2026-05-19T14:30:00Z" },
    { id: "LK-003", taskType: "HKI_CHECK", pipelineId: "PPL-2026-0003", brand: "BioEssence", product: "Toner", status: "PENDING", priority: "LOW", category: "HKI", requester: "R&D", createdAt: "2026-05-18T10:15:00Z", updatedAt: "2026-05-18T10:15:00Z" },
  ],

  "/legality/apj-releases": () => [
    { id: "APJ-001", apjNumber: "APJ-2026-0001", brand: "GlowNat", product: "Serum Brightening", status: "RELEASED", date: "2026-05-15", pic: "Amira" },
    { id: "APJ-002", apjNumber: "APJ-2026-0002", brand: "EarthGlow", product: "Moisturizer", status: "DRAFT", date: "", pic: "Amira" },
  ],

  "/legality/ckpb-audits": () => [
    { id: "CK-001", auditNumber: "CKPB-2026-0001", brand: "GlowNat", status: "PASS", date: "2026-05-10", inspector: "Legal" },
  ],

  "/legality/permits": () => [
    { id: "PRM-001", permitNumber: "PRM-2026-0001", type: "BPOM", brand: "GlowNat", status: "ACTIVE", expiry: "2028-05-01" },
    { id: "PRM-002", permitNumber: "PRM-2026-0002", type: "HALAL", brand: "GlowNat", status: "PENDING", expiry: "" },
  ],

  "/legality/hki": () => [
    { id: "HKI-001", hkiNumber: "HKI-2026-0001", brand: "GlowNat", type: "MEREK", status: "PUBLISHED", date: "2026-04-20", pic: { name: "Legal", role: "Legal Officer" } },
    { id: "HKI-002", hkiNumber: "HKI-2026-0002", brand: "EarthGlow", type: "MEREK", status: "EVALUATION", date: "2026-05-01", pic: { name: "Legal", role: "Legal Officer" } },
  ],

  "/legality/bpom": () => [
    { id: "BP-001", bpomNumber: "BPOM-2026-0001", product: "Serum Brightening", brand: "GlowNat", status: "PUBLISHED", date: "2026-03-15", pic: { name: "Legal", role: "Legal Officer" } },
  ],

  "/legality/halal": () => [
    { id: "HL-001", halalNumber: "HL-2026-0001", product: "Serum Brightening", brand: "GlowNat", status: "PENDING", date: "2026-05-01", pic: { name: "Legal", role: "Legal Officer" } },
  ],

  "/legality/master-inci": () => [
    { id: "INCI-001", inciName: "Niacinamide", function: "Skin Conditioning", casNo: "59-67-6", status: "APPROVED" },
    { id: "INCI-002", inciName: "Glycerin", function: "Humectant", casNo: "56-81-5", status: "APPROVED" },
  ],

  "/legality/records": () => [
    { id: "REC-001", recordNumber: "REC-2026-0001", type: "BPOM", brand: "GlowNat", status: "ACTIVE", date: "2026-03-15" },
    { id: "REC-002", recordNumber: "REC-2026-0002", type: "HALAL", brand: "EarthGlow", status: "EXPIRED", date: "2026-01-01" },
  ],

  // ── RND ───────────────────────────────────────────────────────

  "/rnd/inbox": () => [
    { id: "RB-001", noNpf: "SS-202606-0001", projectSample: "Serum Brightening", pic: "Panca", status: "PENDING", date: "2026-06-01" },
    { id: "RB-002", noNpf: "SS-202606-0002", projectSample: "Moisturizer Plumpy", pic: "Yaya", status: "IN_PROGRESS", date: "2026-06-02" },
  ],

  "/rnd/lab-test-results": () => [
    { id: "LT-001", formulaId: "F-001", sampleName: "Serum Brightening", testType: "pH", result: "5.5", status: "PASS", date: "2026-05-20" },
    { id: "LT-002", formulaId: "F-002", sampleName: "Moisturizer", testType: "Viskositas", result: "12.400 cps", status: "PASS", date: "2026-05-19" },
  ],

  "/rnd/revisions": () => [
    { id: "RV-001", revisionNumber: "RV-2026-0001", formulaId: "F-001", sampleCode: "SMP-001", productName: "Serum Brightening", reason: "Viskositas berubah", status: "IN_PROGRESS", revisionStatus: "IN_PROGRESS", formulas: [{ id: "F-001", version: 2 }], createdBy: "Panca", date: "2026-05-18", latestRevisionDate: "2026-05-18", completedAt: null },
    { id: "RV-002", revisionNumber: "RV-2026-0002", formulaId: "F-003", sampleCode: "SMP-002", productName: "Moisturizer Green", reason: "Peningkatan aroma", status: "DONE", revisionStatus: "DONE", formulas: [{ id: "F-003", version: 1 }], createdBy: "Yaya", date: "2026-05-15", latestRevisionDate: "2026-05-15", completedAt: "2026-05-16" },
    { id: "RV-003", revisionNumber: "RV-2026-0003", formulaId: "F-005", sampleCode: "SMP-003", productName: "Face Wash Clean", reason: "Penyesuaian pH", status: "NOT_STARTED", revisionStatus: "NOT_STARTED", formulas: [{ id: "F-005", version: 1 }], createdBy: "Amira", date: "2026-05-20", latestRevisionDate: "2026-05-20", completedAt: null },
  ],

  "/rnd/revisions/history": () => [
    { id: "RV-001", revisionNumber: "RV-2026-0001", formulaId: "F-001", sampleCode: "SMP-001", productName: "Serum Brightening", reason: "Viskositas berubah", status: "DONE", revisionStatus: "DONE", formulas: [{ id: "F-001", version: 2 }], createdBy: "Panca", date: "2026-05-18", latestRevisionDate: "2026-05-18", completedAt: "2026-05-19", version: 2 },
  ],

  // ── SCM LANJUTAN ──────────────────────────────────────────────

  "/scm/purchase-requests": () => [
    { id: "PR-001", prNumber: "PR-2026-0001", requester: "Production", priority: "HIGH", warehouse: { id: "W-001", name: "Gudang Utama" }, items: [{ materialId: "M-001", materialName: "Niacinamide", material: { name: "Niacinamide" }, qty: 500, qtyRequired: 500, uom: "kg", estimatedPrice: 250000 }], status: "PENDING_APPROVAL_SCM", totalEstimate: 150000000, createdAt: "2026-05-20", notes: "Auto-PR: Stock shortage detected" },
    { id: "PR-002", prNumber: "PR-2026-0002", requester: "Warehouse", priority: "MEDIUM", warehouse: { id: "W-001", name: "Gudang Utama" }, items: [{ materialId: "M-003", materialName: "Botol Kaca 30ml", material: { name: "Botol Kaca 30ml" }, qty: 2000, qtyRequired: 2000, uom: "pcs", estimatedPrice: 3200 }], status: "APPROVED", totalEstimate: 85000000, createdAt: "2026-05-18", notes: "Routine restock" },
    { id: "PR-003", prNumber: "PR-2026-0003", requester: "Production", priority: "HIGH", warehouse: { id: "W-002", name: "Gudang Bahan Baku" }, items: [{ materialId: "M-002", materialName: "Glycerin", material: { name: "Glycerin" }, qty: 300, qtyRequired: 300, uom: "kg", estimatedPrice: 45000 }], status: "PENDING_APPROVAL_DIRECTOR", totalEstimate: 42000000, createdAt: "2026-05-22", notes: "New product line" },
  ],

  "/scm/goods-requirements": () => [
    { id: "GR-001", material: "Niacinamide", required: 500, available: 120, shortage: 380, priority: "URGENT", date: "2026-05-20" },
    { id: "GR-002", material: "Botol Kaca 30ml", required: 2000, available: 1500, shortage: 500, priority: "URGENT", date: "2026-05-20" },
  ],

  "/scm/purchase-returns": () => [
    { id: "RTN-001", returnNumber: "RTN-2026-0001", supplier: "PT Bahan Baku", material: "Niacinamide", qty: 50, reason: "Kualitas tidak sesuai", status: "PENDING", date: "2026-05-19" },
  ],

  "/scm/inbounds": () => [
    { id: "INB-001", receivingNumber: "RCV-2026-0001", poNumber: "PO-2026-0001", supplier: "PT Bahan Baku", status: "RECEIVED", date: "2026-05-18" },
  ],

  "/scm/vendors": () => [
    { id: "V-001", name: "PT Bahan Baku Utama", category: "RAW_MATERIAL", rating: 4.5, onTimePct: 92, status: "ACTIVE" },
    { id: "V-002", name: "CV Kemasan Indah", category: "PACKAGING", rating: 4.2, onTimePct: 88, status: "ACTIVE" },
  ],

  "/scm/requirements/summary": () => ({
    totalItems: 12,
    urgentItems: 4,
    totalValue: 480000000,
    rows: [
      { material: "Niacinamide", qty: 380, uom: "kg", estValue: 190000000, priority: "URGENT" },
      { material: "Botol Kaca 30ml", qty: 500, uom: "pcs", estValue: 12500000, priority: "URGENT" },
    ],
  }),

  // ── WAREHOUSE LANJUTAN ────────────────────────────────────────

  "/warehouse/adjustments": () => [
    { id: "ADJ-001", adjustmentNumber: "ADJ-2026-0001", type: "OPNAME", material: "Niacinamide", materialName: "Niacinamide", qtyChange: -15, reason: "Penyusutan timbangan", status: "PENDING", createdAt: "2026-05-20", items: [{ material: { name: "Niacinamide" }, qtySystem: 120, qtyActual: 105 }] },
    { id: "ADJ-002", adjustmentNumber: "ADJ-2026-0002", type: "KOREKSI", material: "Botol Kaca 30ml", materialName: "Botol Kaca 30ml", qtyChange: 200, reason: "Koreksi stok masuk", status: "APPROVED", createdAt: "2026-05-18", items: [{ material: { name: "Botol Kaca 30ml" }, qtySystem: 1300, qtyActual: 1500 }] },
  ],

  "/warehouse/catalog": () => [
    { id: "M-001", code: "M-001", name: "Niacinamide", category: "BAHAN BAKU", unit: "kg", stock: 120, minStock: 100, location: "A1-01" },
    { id: "M-003", code: "M-003", name: "Botol Kaca 30ml", category: "KEMASAN", unit: "pcs", stock: 1500, minStock: 1000, location: "B2-03" },
  ],

  "/warehouse/locations": () => [
    { id: "LOC-001", code: "A1-01", zone: "A", shelf: "1", bin: "01", type: "RAW_MATERIAL", capacity: 1000, used: 680 },
    { id: "LOC-002", code: "B2-03", zone: "B", shelf: "2", bin: "03", type: "PACKAGING", capacity: 2000, used: 1500 },
  ],

  "/warehouse/warehouses": () => [
    { id: "W-001", name: "Gudang Utama", location: "Jl. Raya Industri 1", manager: "Joko", capacity: 5000, used: 3200, status: "ACTIVE" },
    { id: "W-002", name: "Gudang Bahan Baku", location: "Jl. Raya Industri 2", manager: "Joko", capacity: 2000, used: 1400, status: "ACTIVE" },
  ],

  "/warehouse/transfers": () => [
    { id: "TRF-001", transferNumber: "TRF-2026-0001", material: "Niacinamide", fromWarehouse: "Gudang Utama", toWarehouse: "Gudang Bahan Baku", qty: 200, status: "PENDING", date: "2026-05-20" },
  ],

  "/warehouse/opname": () => [
    { id: "OP-001", opnameNumber: "OP-2026-0001", material: "Niacinamide", systemQty: 120, actualQty: 118, difference: -2, status: "PENDING", date: "2026-05-21" },
  ],

  "/warehouse/release-requests": () => [
    { id: "RL-001", releaseNumber: "RL-2026-0001", woNumber: "WO-2026-0001", material: "Niacinamide", qty: 500, status: "PENDING", date: "2026-05-20" },
  ],

  "/warehouse/inbounds": () => [
    { id: "INB-001", receivingNumber: "RCV-2026-0001", poNumber: "PO-2026-0001", supplier: "PT Bahan Baku", status: "RECEIVED", date: "2026-05-18" },
  ],

  "/warehouse/stats": () => ({
    totalSku: 1248,
    totalStock: 48200,
    lowStock: 7,
    expiredSoon: 3,
    accuracy: 98.4,
    warehouseCount: 2,
  }),

  // ── PRODUCTION LANJUTAN ───────────────────────────────────────

  "/production-plans": () => [
    { id: "PP-001", batch_no: "BATCH-2026-0001", status: "READY", wo_id: "WO-2026-0001", so: { lead: { client_name: "PT Sejahtera Abadi", brand_name: "GlowNat" } }, stepLogs: [{ id: "SL-001", stage: "BATCHING", qty_result: 100, qcAudits: [{ status: "PASS" }] }] },
    { id: "PP-002", batch_no: "BATCH-2026-0002", status: "ON_PROGRESS", wo_id: "WO-2026-0002", so: { lead: { client_name: "PT Natural Beauty", brand_name: "BioEssence" } }, stepLogs: [{ id: "SL-002", stage: "MIXING", qty_result: 250, qcAudits: [{ status: "PASS" }] }] },
    { id: "PP-003", batch_no: "BATCH-2026-0003", status: "READY", wo_id: "WO-2026-0003", so: { lead: { client_name: "PT Luxcare", brand_name: "LuxGlow" } }, stepLogs: [{ id: "SL-003", stage: "BATCHING", qty_result: 0, qcAudits: [] }] },
  ],

  "/production/batch-records": () => [
    { id: "BR-001", batchNo: "BATCH-2026-0001", product: "Serum Brightening", qty: 5000, targetQty: 5000, status: "COMPLETED", stage: "PACKING", date: "2026-05-15", pic: "Panca", lead: { brandName: "GlowNat", productInterest: "Serum" } },
    { id: "BR-002", batchNo: "BATCH-2026-0002", product: "Moisturizer Green", qty: 3000, targetQty: 3000, status: "IN_PROGRESS", stage: "MIXING", date: "2026-05-20", pic: "Yaya", lead: { brandName: "EarthGlow", productInterest: "Moisturizer" } },
    { id: "BR-003", batchNo: "BATCH-2026-0003", product: "Face Wash Clean", qty: 10000, targetQty: 10000, status: "COMPLETED", stage: "PACKING", date: "2026-05-12", pic: "Panca", lead: { brandName: "LuxGlow", productInterest: "Face Wash" } },
  ],

  "/production/audit": () => [
    { id: "PRDA-001", auditNumber: "PRD-2026-0001", batchNo: "BATCH-2026-0001", action: "FORMULA_CHECK", status: "PASS", date: "2026-05-15" },
  ],

  "/production/formula-adjustments": () => [
    { id: "FA-001", formulaId: "F-001", product: "Serum Brightening", adjustment: "+2% Niacinamide", reason: "Efektivitas", status: "PENDING", date: "2026-05-18" },
  ],

  "/production/machines": () => [
    { id: "MC-001", name: "Mixing Tank 500L", status: "OPERATIONAL", utilization: 82, lastMaintenance: "2026-04-20" },
    { id: "MC-002", name: "Filling Line A", status: "OPERATIONAL", utilization: 91, lastMaintenance: "2026-05-01" },
  ],

  "/production/requisitions": () => [
    { id: "PRQ-001", requisitionNumber: "REQ-2026-0001", material: "Niacinamide", qty: 500, warehouse: "Gudang Utama", status: "PENDING", date: "2026-05-20" },
  ],

  "/production/step-logs": () => [
    { id: "SL-001", batchNo: "BATCH-2026-0001", stage: "MIXING", qtyResult: 250, qcStatus: "PASS", date: "2026-05-16" },
  ],

  // ── MASTER LANJUTAN ───────────────────────────────────────────

  "/master/warehouses": () => [
    { id: "W-001", name: "Gudang Utama", location: "Jl. Raya Industri 1", manager: "Joko", status: "ACTIVE" },
    { id: "W-002", name: "Gudang Bahan Baku", location: "Jl. Raya Industri 2", manager: "Joko", status: "ACTIVE" },
  ],

  "/master/warehouses/active": () => [
    { id: "W-001", name: "Gudang Utama" },
    { id: "W-002", name: "Gudang Bahan Baku" },
  ],

  "/master/departments": () => [
    { id: "D-001", name: "Production", head: "Manager A", employeeCount: 45 },
    { id: "D-002", name: "QC", head: "Manager G", employeeCount: 10 },
  ],

  "/master/goods": () => [
    { id: "G-001", name: "Niacinamide", sku: "M-001", category: "BAHAN BAKU", unit: "kg", stock: 120, price: 450000 },
    { id: "G-002", name: "Botol Kaca 30ml", sku: "M-003", category: "KEMASAN", unit: "pcs", stock: 1500, price: 2500 },
  ],

  // ── HR LANJUTAN ───────────────────────────────────────────────

  "/hr/tickets": () => [
    { id: "TKT-001", type: "LEAVE", status: "PENDING", reason: "Cuti Tahunan 2026", startDate: "2026-06-01", endDate: "2026-06-05", amount: null, employeeName: "Budi Santoso", createdAt: "2026-05-25T08:00:00Z" },
    { id: "TKT-002", type: "OVERTIME", status: "APPROVED", reason: "Lembur Project Akhir Bulan", startDate: "2026-05-24", endDate: null, amount: null, employeeName: "Siti Rahayu", createdAt: "2026-05-24T16:30:00Z" },
    { id: "TKT-003", type: "REIMBURSE", status: "PENDING", reason: "Biaya Transportasi Meeting Client", startDate: "2026-05-23", endDate: null, amount: 250000, employeeName: "Ahmad Fauzi", createdAt: "2026-05-23T09:15:00Z" },
    { id: "TKT-004", type: "LEAVE", status: "REJECTED", reason: "Izin tidak mendesak", startDate: "2026-05-20", endDate: "2026-05-21", amount: null, employeeName: "Dewi Lestari", createdAt: "2026-05-19T10:00:00Z" },
  ],

  "/hr/employees": () => [
    { id: "E-001", name: "Panca", position: "Formulator", department: "RND", status: "ACTIVE", joinedAt: "2021-03-15" },
    { id: "E-002", name: "Yaya", position: "Lab R&D", department: "RND", status: "ACTIVE", joinedAt: "2022-06-01" },
  ],

  // ── MARKETING LANJUTAN ────────────────────────────────────────

  "/marketing/metrics": () => ({
    totalLeads: 1284,
    conversion: 15.2,
    totalSpend: 1248000000,
    costPerLead: 97352,
    roas: 3.2,
  }),

  "/marketing/targets": () => [
    { id: "MT-001", period: "2026-05", target: 4500000000, achieved: 3185000000, achievement: 70.8 },
  ],

  "/marketing/landing-tracker/stats": () => ({
    totalVisits: 48200,
    totalConversions: 1284,
    conversionRate: 2.66,
    totalSales: 3185000000,
  }),

  "/marketing/landing-tracker/conversions": () => [
    { id: "CV-001", name: "Andi Pratama", phone: "0812-3456-7890", source: "IG Ads", product: "Serum", status: "NEW", date: "2026-05-20" },
    { id: "CV-002", name: "Citra Kirana", phone: "0821-9876-5432", source: "TikTok", product: "Moisturizer", status: "CONTACTED", date: "2026-05-20" },
  ],

  "/marketing/landing-tracker/visits": () => [
    { id: "VS-001", page: "/landing/serum", visits: 1240, date: "2026-05-20" },
    { id: "VS-002", page: "/landing/moisturizer", visits: 890, date: "2026-05-20" },
  ],

  "/marketing/landing-tracker/sales": () => [
    { id: "SL-001", client: "PT Sejahtera Abadi", value: 150000000, status: "PAID", date: "2026-05-18" },
  ],

  "/marketing/landing-tracker/recent": () => [
    { id: "RC-001", name: "Dewi", phone: "0812-1111-2222", status: "NEW", date: "2026-05-20" },
  ],

  "/marketing/logs/organic": () => [
    { id: "ML-001", platform: "Instagram", action: "POST", content: "Reels Launch", date: "2026-05-20", by: "Aurel" },
  ],

  "/marketing/logs/ads": () => [
    { id: "ADL-001", platform: "Meta", campaign: "IG Ads Q2", action: "SPEND", amount: 2500000, date: "2026-05-20" },
  ],

  // ── SYSTEM & NOTIFIKASI ───────────────────────────────────────

  "/system/change-requests": () => [
    { id: "CR-001", requestNumber: "CR-2026-0001", title: "Ubah format label", requestedBy: "Rina", department: "QC", status: "PENDING", date: "2026-05-20" },
    { id: "CR-002", requestNumber: "CR-2026-0002", title: "Tambah mesin filling", requestedBy: "Panca", department: "Production", status: "APPROVED", date: "2026-05-18" },
  ],

  "/system/errors/summary": () => ({
    totalErrors: 12,
    critical: 2,
    warning: 8,
    info: 2,
    byRoute: [
      { hour: "2026-05-20T08:00", route: "/api/wa-webhook", errors: 4 },
      { hour: "2026-05-20T09:00", route: "/api/toribio", errors: 2 },
      { hour: "2026-05-20T10:00", route: "/api/lead-capture", errors: 3 },
      { hour: "2026-05-20T11:00", route: "/api/marketing", errors: 1 },
    ],
  }),

  "/system/errors/timeline": () => [
    { id: "ERR-001", level: "ERROR", message: "Webhook WA timeout", timestamp: "2026-05-20T08:30:00Z", source: "wa-webhook" },
    { id: "ERR-002", level: "WARNING", message: "Rate limit Google Sheets", timestamp: "2026-05-20T09:00:00Z", source: "toribio" },
  ],

  "/system/change-request": () => [
    { id: "CR-001", requestNumber: "CR-2026-0001", title: "Ubah format label", requestedBy: "Rina", department: "QC", status: "PENDING", date: "2026-05-20" },
  ],

  "/notifications": () => [
    { id: "NTF-001", title: "PR-2026-0001 butuh approval", message: "Purchase request dari Production menunggu approval", type: "APPROVAL", isRead: false, createdAt: "2026-05-20T08:00:00Z" },
    { id: "NTF-002", title: "Invoice jatuh tempo", message: "INV-2026-0002 jatuh tempo 20 Juni", type: "FINANCE", isRead: false, createdAt: "2026-05-20T07:00:00Z" },
  ],

  "/my-dashboard/stats": () => ({
    totalTasks: 12,
    completed: 5,
    pendingApproval: 3,
    overdue: 2,
    myScore: 88,
  }),

  // ── CREATIVE, DOKUMEN, LOGISTIK, FULFILLMENT ─────────────────

  "/creative/board": () => [
    { id: "CR-001", title: "Desain Kemasan GlowNat", status: "INBOX", brand: "GlowNat", lead: { clientName: "PT Sejahtera Abadi" }, dueDate: "2026-06-01", assignee: "Aurel" },
    { id: "CR-002", title: "Mockup Label BioEssence", status: "IN_PROGRESS", brand: "BioEssence", lead: { clientName: "PT Natural Beauty" }, dueDate: "2026-05-28", assignee: "Aurel" },
  ],

  "/creative/task": () => [
    { id: "CR-001", title: "Desain Kemasan GlowNat", status: "INBOX", brand: "GlowNat", lead: { clientName: "PT Sejahtera Abadi" }, dueDate: "2026-06-01", versions: [{ id: "V-1", status: "INBOX" }] },
  ],

  "/document-automation/drafts": () => [
    { id: "DR-001", draftNumber: "DR-2026-0001", title: "Draft PO Bahan Baku", type: "PURCHASE_ORDER", status: "DRAFT", createdBy: "Bagus", date: "2026-05-20" },
    { id: "DR-002", draftNumber: "DR-2026-0002", title: "Draft Invoice", type: "INVOICE", status: "PENDING_APPROVAL", createdBy: "Sari", date: "2026-05-19" },
  ],

  "/document-automation/drafts/stats": () => ({
    drafts: 8,
    total: 8,
    pending: 3,
    approved: 4,
    rejected: 1,
  }),

  "/commercial/invoices": () => [
    { id: "INV-001", invoiceNumber: "INV-2026-0001", client: "PT Natural Beauty", amount: 500000000, status: "PAID", date: "2026-05-01" },
  ],

  "/commercial/payments": () => [
    { id: "PM-001", paymentNumber: "PM-2026-0001", client: "PT Natural Beauty", amount: 250000000, status: "CONFIRMED", date: "2026-05-10" },
  ],

  "/commercial/retention/radar": () => [
    { id: "RT-001", client_name: "PT Sejahtera Abadi", lead: { client_name: "PT Sejahtera Abadi", brand_name: "GlowNat" }, est_depletion_date: "2026-06-15", risk_level: "HIGH", lastOrderDate: "2026-03-10", repeatCount: 2, revenue: 150000000 },
    { id: "RT-002", client_name: "CV Bumi Kosmetik", lead: { client_name: "CV Bumi Kosmetik", brand_name: "EarthGlow" }, est_depletion_date: "2026-07-01", risk_level: "MEDIUM", lastOrderDate: "2026-04-01", repeatCount: 1, revenue: 95000000 },
    { id: "RT-003", client_name: "PT Natural Beauty", lead: { client_name: "PT Natural Beauty", brand_name: "BioEssence" }, est_depletion_date: "2026-08-01", risk_level: "LOW", lastOrderDate: "2026-05-01", repeatCount: 3, revenue: 500000000 },
  ],

  "/executive/audit-logs": () => [
    { id: "AUD-001", action: "LEAD_CREATED", user: { name: "Budi Santoso", email: "budi@dreamlab.id" }, entityId: "L-004", timestamp: "2026-05-20T08:00:00Z", details: "Lead L-004 dibuat" },
    { id: "AUD-002", action: "PAYMENT_VERIFIED", user: { name: "Sari", email: "sari@dreamlab.id" }, entityId: "L-003", timestamp: "2026-05-20T09:00:00Z", details: "DP diverifikasi L-003" },
    { id: "AUD-003", action: "USER_LOGIN", user: { name: "Luthfi", email: "luthfi@dreamlab.id" }, entityId: "USR-001", timestamp: "2026-05-20T10:00:00Z", details: "Login dari IP 192.168.1.1" },
  ],

  // ── CATCH-ALL ──────────────────────────────────────────────────
  // Fallback pintar: array kosong yang JUGA punya properti
  // data/total/items/rows/list — jadi kompatibel dengan halaman yang
  // membaca `res.data.map()` (array) maupun `res.data.data` (paginated),
  // sehingga halaman tidak crash walau endpoint belum di-mock spesifik.

  default: () => smartEmptyList(),
};

function smartEmptyList(): any[] {
  const arr: any[] = [];
  const list = arr as any;
  list.data = list;      // paginated: res.data.data → []
  list.items = list;     // res.data.items → []
  list.rows = list;      // res.data.rows → []
  list.list = list;      // res.data.list → []
  list.total = 0;        // res.data.total → 0
  list.count = 0;        // res.data.count → 0
  list.success = true;   // res.data.success → true
  return list as any[];
}

/**
 * Enrich item dengan field umum yang sering diakses halaman.
 * Additive-only (field asli tidak ditimpa) dan DETERMINISTIK
 * (tanpa Math.random) supaya tidak memicu hydration mismatch.
 * Ini mencegah crash `undefined.toLowerCase/startsWith/charAt/dll`
 * saat mock belum punya field yang diharapkan halaman.
 */
function enrichRow(item: any, index: number): any {
  if (!item || typeof item !== "object" || Array.isArray(item)) return item;
  const base: Record<string, any> = {
    id: item.id ?? `ID-${String(index + 1).padStart(3, "0")}`,
    name: item.name ?? item.accountName ?? item.clientName ?? item.customerName ?? item.client ?? item.customer ?? item.supplier ?? item.materialName ?? item.productName ?? item.title ?? item.employeeName ?? `Item ${index + 1}`,
    code: item.code ?? item.accountCode ?? item.kode ?? item.number ?? item.invoiceNumber ?? item.prNumber ?? item.doNumber ?? item.poNumber ?? item.batchNo ?? `CODE-${String(index + 1).padStart(3, "0")}`,
    accountName: item.accountName ?? item.name ?? item.clientName ?? "",
    accountCode: item.accountCode ?? item.code ?? "",
    status: item.status ?? "ACTIVE",
    type: item.type ?? item.category ?? "GENERAL",
    category: item.category ?? item.type ?? "GENERAL",
    date: item.date ?? item.createdAt ?? item.tanggal ?? "2026-05-20",
    createdAt: item.createdAt ?? item.date ?? item.tanggal ?? "2026-05-20T08:00:00Z",
    updatedAt: item.updatedAt ?? item.date ?? item.tanggal ?? "2026-05-20T08:00:00Z",
    amount: item.amount ?? item.totalAmount ?? item.total ?? item.value ?? 0,
    totalAmount: item.totalAmount ?? item.total ?? item.amount ?? 0,
    total: item.total ?? item.totalAmount ?? item.amount ?? 0,
    qty: item.qty ?? item.quantity ?? item.targetQty ?? item.qtyRequired ?? 0,
    quantity: item.quantity ?? item.qty ?? item.targetQty ?? 0,
    note: item.note ?? item.notes ?? "",
    notes: item.notes ?? item.note ?? item.reason ?? "",
    description: item.description ?? item.notes ?? item.reason ?? item.purpose ?? "",
    client: item.client ?? item.clientName ?? item.customer ?? item.customerName ?? "",
    clientName: item.clientName ?? item.client ?? item.customer ?? item.customerName ?? "",
    customer: item.customer ?? item.customerName ?? item.clientName ?? item.client ?? "",
    customerName: item.customerName ?? item.customer ?? item.clientName ?? item.client ?? "",
    supplier: item.supplier ?? item.supplierName ?? "",
    supplierName: item.supplierName ?? item.supplier ?? "",
    material: item.material ?? item.materialName ?? item.product ?? "",
    materialName: item.materialName ?? item.material ?? item.product ?? "",
    product: item.product ?? item.productName ?? item.material ?? "",
    productName: item.productName ?? item.product ?? item.material ?? item.projectSample ?? "",
    projectSample: item.projectSample ?? item.productName ?? item.product ?? "",
    brand: item.brand ?? item.brandName ?? "",
    brandName: item.brandName ?? item.brand ?? "",
    unit: item.unit ?? item.uom ?? "",
    uom: item.uom ?? item.unit ?? "",
    priority: item.priority ?? "NORMAL",
    pic: item.pic ?? item.picName ?? item.by ?? item.assignee ?? "",
    picName: item.picName ?? item.pic ?? item.by ?? "",
    assignee: item.assignee ?? item.pic ?? item.picName ?? "",
    department: item.department ?? item.division ?? "",
    division: item.division ?? item.department ?? "",
    items: item.items ?? [],
    rows: item.rows ?? item.items ?? [],
    payload: item.payload ?? { items: [] },
    details: item.details ?? item.items ?? [],
    reason: item.reason ?? item.notes ?? item.note ?? "",
    batch: item.batch ?? item.batchNo ?? item.batch_no ?? item.code ?? "",
    batchNo: item.batchNo ?? item.batch ?? item.batch_no ?? "",
    pelanggan: item.pelanggan ?? item.customerName ?? item.clientName ?? item.client ?? "",
    produk: item.produk ?? item.productName ?? item.product ?? "",
    formulas: item.formulas ?? [],
    revisionStatus: item.revisionStatus ?? item.status ?? "IN_PROGRESS",
    lead: item.lead ?? {},
    entityId: item.entityId ?? item.id ?? "",
    risk_level: item.risk_level ?? "LOW",
    hour: item.hour ?? item.createdAt ?? item.timestamp ?? "2026-05-20T08:00:00Z",
    phone: item.phone ?? item.phoneNo ?? item.telp ?? "",
    phoneNo: item.phoneNo ?? item.phone ?? "",
    materials: item.materials ?? [],
    inventories: item.inventories ?? [],
    stockQty: item.stockQty ?? item.qty ?? item.stock ?? 0,
    minLevel: item.minLevel ?? item.minStock ?? 0,
    parentId: item.parentId ?? null,
    email: item.email ?? "",
    address: item.address ?? item.city ?? "",
    city: item.city ?? item.address ?? "",
    active: item.active ?? true,
    createdBy: item.createdBy ?? item.requestedBy ?? item.requester ?? item.user?.name ?? "System",
    requestedBy: item.requestedBy ?? item.createdBy ?? item.requester ?? "System",
    requester: item.requester ?? item.createdBy ?? item.requestedBy ?? "System",
    sampleCode: item.sampleCode ?? item.code ?? item.id ?? "",
    stage: item.stage ?? item.status ?? "ACTIVE",
    reportGroup: item.reportGroup ?? "GENERAL",
    hash: item.hash ?? `HASH-${item.id ?? String(index + 1)}`,
    moq: item.moq ?? item.qty ?? 0,
    views: item.views ?? 0,
    closing_rate: item.closing_rate ?? item.closing ?? 0,
    total_spend: item.total_spend ?? item.total ?? 0,
    budget_limit: item.budget_limit ?? item.budget ?? 0,
    total_likes: item.total_likes ?? 0,
    awalDebit: item.awalDebit ?? 0,
    awalCredit: item.awalCredit ?? 0,
    perubahanDebit: item.perubahanDebit ?? item.debit ?? 0,
    perubahanCredit: item.perubahanCredit ?? item.credit ?? 0,
    qcStatus: item.qcStatus ?? "PASS",
  };
  return { ...base, ...item };
}

function enrichResult(result: any): any {
  if (Array.isArray(result)) {
    return result.map((item, i) => enrichRow(item, i));
  }
  if (result && typeof result === "object") {
    const out: Record<string, any> = { ...result };
    if (Array.isArray(out.data)) out.data = out.data.map((item: any, i: number) => enrichRow(item, i));
    if (Array.isArray(out.items)) out.items = out.items.map((item: any, i: number) => enrichRow(item, i));
    if (Array.isArray(out.rows)) out.rows = out.rows.map((item: any, i: number) => enrichRow(item, i));
    if (Array.isArray(out.list)) out.list = out.list.map((item: any, i: number) => enrichRow(item, i));
    if (Array.isArray(out.departments)) out.departments = out.departments.map((item: any, i: number) => enrichRow(item, i));
    if (Array.isArray(out.employees)) out.employees = out.employees.map((item: any, i: number) => enrichRow(item, i));
    return out;
  }
  return result;
}

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
      return enrichResult((MOCK_DATA[pattern] as (url?: string) => any)(url));
    }
  }

  return enrichResult(MOCK_DATA.default());
}
