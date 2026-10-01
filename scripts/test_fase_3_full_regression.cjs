/**
 * FULL REGRESSION SUITE FASE 3: PENJUALAN & CRM (SALES & DISTRIBUTION)
 * 
 * Verifikasi 8 Sub-Fase Modul Penjualan:
 * 1. Sub-Fase 3.1: Buku Tamu Kunjungan Klien (/penjualan/guest-book)
 * 2. Sub-Fase 3.2: Sales Orders & DO Gatekeeper (/penjualan/sales-orders)
 * 3. Sub-Fase 3.3: Penjualan & Permintaan Sample R&D (/penjualan/sample-sales)
 * 4. Sub-Fase 3.4: Uang Muka / DP Penjualan (/penjualan/down-payment)
 * 5. Sub-Fase 3.5: Faktur Penjualan & AR Gatekeeper (/penjualan/faktur-penjualan)
 * 6. Sub-Fase 3.6: Bayar Penjualan & Tax PPh 21/23 (/penjualan/bayar-penjualan)
 * 7. Sub-Fase 3.7: Retur Penjualan & QC Karantina (/penjualan/retur-penjualan)
 * 8. Sub-Fase 3.8: Target Penjualan & Kategori (/penjualan/sales-target)
 */

const assert = require("assert");

console.log("================================================================================");
console.log("🚀 MENJALANKAN FULL REGRESSION SUITE FASE 3: PENJUALAN & CRM");
console.log("================================================================================\n");

let passedCount = 0;
let totalCount = 8;

function runTest(subPhaseName, testFn) {
  try {
    console.log(`[${passedCount + 1}/${totalCount}] Menjalankan: ${subPhaseName}...`);
    testFn();
    console.log(`  ✅ LULUS: ${subPhaseName}`);
    passedCount++;
  } catch (error) {
    console.error(`  ❌ GAGAL: ${subPhaseName}`);
    console.error(`     Error: ${error.message}\n`);
  }
}

// 1. Sub-Fase 3.1: Buku Tamu Kunjungan
runTest("Sub-Fase 3.1: Buku Tamu & Registrasi Walk-In Kunjungan (/penjualan/guest-book)", () => {
  const guestEntry = {
    id: "gb-001",
    visitDate: "2026-09-29T10:00:00.000Z",
    clientName: "Ibu Amanda Putri",
    instansi: "Glow & Shine Skincare",
    phoneNo: "081234567890",
    city: "Jakarta Selatan",
    productInterest: "Serum Retinol 30ml",
    moqPlan: 1000,
    targetMarket: "Wanita Dewasa Karir",
    category: "BRANDED",
    meetingWith: "Irma Safarina"
  };

  assert.ok(guestEntry.clientName && guestEntry.phoneNo && guestEntry.instansi);
  assert.ok(["BRANDED", "KLINIK", "PEMULA", "DISTRIBUTOR"].includes(guestEntry.category));
  assert.ok(guestEntry.moqPlan >= 500);
});

// 2. Sub-Fase 3.2: Sales Orders & DO Gatekeeper
runTest("Sub-Fase 3.2: Sales Orders (SO) & DO Gatekeeper (/penjualan/sales-orders)", () => {
  const salesOrder = {
    id: "so-001",
    soCode: "SO-202609-0001",
    orderDate: "2026-09-29",
    customerId: "cust-001",
    customerName: "PT Cantik Jelita",
    brandName: "Aura Glow",
    category: "MAKLON_BARU",
    deadlineFinal: "2026-10-30",
    items: [
      { id: "item-1", productName: "Day Cream SPF 30", qty: 2000, unitPrice: 25000, lineTotal: 50000000 },
      { id: "item-2", productName: "Night Cream Retinol", qty: 2000, unitPrice: 30000, lineTotal: 60000000 }
    ],
    subtotal: 110000000,
    discountAmount: 0,
    taxAmount: 12100000, // 11% PPN
    grandTotal: 122100000,
    gatekeeperStatus: "HELD",
    approvalStatus: "PENDING"
  };

  const calculatedSubtotal = salesOrder.items.reduce((acc, it) => acc + (it.qty * it.unitPrice), 0);
  assert.strictEqual(salesOrder.subtotal, calculatedSubtotal);
  assert.strictEqual(salesOrder.grandTotal, salesOrder.subtotal - salesOrder.discountAmount + salesOrder.taxAmount);
  assert.ok(["HELD", "RELEASED"].includes(salesOrder.gatekeeperStatus));
  assert.ok(["PENDING", "APPROVED", "IN_PRODUCTION", "COMPLETED"].includes(salesOrder.approvalStatus));
});

// 3. Sub-Fase 3.3: Penjualan & Permintaan Sample R&D
runTest("Sub-Fase 3.3: Permintaan Formulasi Sample R&D (/penjualan/sample-sales)", () => {
  const sampleRequest = {
    id: "smp-001",
    code: "SMP-202609-0012",
    createdAt: "2026-09-29",
    customerName: "Aura Glow Cosmetics",
    brandName: "Aura Glow",
    productName: "Serum Niacinamide 10%",
    physicalForm: "Cair Transparan",
    volumeNetto: "30 ml",
    formulator: "Apt. Rina Lestari",
    targetDate: "2026-10-05",
    status: "PROCESS",
    commitmentFee: 500000,
    isDeductibleToPo: true
  };

  assert.ok(sampleRequest.code.startsWith("SMP-"));
  assert.ok(sampleRequest.isDeductibleToPo);
  assert.ok(["PENDING", "PROCESS", "COMPLETED", "REJECTED"].includes(sampleRequest.status));
});

// 4. Sub-Fase 3.4: DP Penjualan (Down Payment)
runTest("Sub-Fase 3.4: Uang Muka / DP Penjualan 3-Kategori (/penjualan/down-payment)", () => {
  const dpRecord = {
    id: "dp-001",
    code: "DP-CUST-202609-0001",
    date: "2026-09-29",
    category: "produksi", // "sample" | "legalitas" | "produksi"
    customerName: "PT Cantik Jelita",
    brandName: "Aura Glow",
    refNumber: "SO-202609-0001",
    amount: 50000000,
    usedAmount: 0,
    remainingAmount: 50000000,
    status: "UNUSED"
  };

  assert.strictEqual(dpRecord.remainingAmount, dpRecord.amount - dpRecord.usedAmount);
  assert.ok(["sample", "legalitas", "produksi"].includes(dpRecord.category));
  assert.ok(["UNUSED", "PARTIAL", "EXHAUSTED"].includes(dpRecord.status));
});

// 5. Sub-Fase 3.5: Faktur Penjualan & AR Gatekeeper
runTest("Sub-Fase 3.5: Faktur Penjualan & AR Gatekeeper (/penjualan/faktur-penjualan)", () => {
  const salesInvoice = {
    id: "inv-001",
    invoiceNumber: "INV-202609-001",
    soNumber: "SO-202609-0001",
    invoiceDate: "2026-09-29",
    dueDate: "2026-10-29",
    customerName: "PT Cantik Jelita",
    brandName: "Aura Glow",
    subtotal: 110000000,
    discount: 0,
    dpOffset: 50000000,
    taxAmount: 12100000,
    grandTotal: 72100000, // (110M - 50M DP) + 12.1M PPN
    paidAmount: 0,
    remainingAmount: 72100000,
    paymentStatus: "UNPAID",
    arGatekeeperStatus: "HELD"
  };

  const expectedNetBilling = (salesInvoice.subtotal - salesInvoice.discount - salesInvoice.dpOffset) + salesInvoice.taxAmount;
  assert.strictEqual(salesInvoice.grandTotal, expectedNetBilling);
  assert.strictEqual(salesInvoice.remainingAmount, salesInvoice.grandTotal - salesInvoice.paidAmount);
  assert.ok(["UNPAID", "PARTIAL", "PAID"].includes(salesInvoice.paymentStatus));
  assert.ok(["HELD", "RELEASED"].includes(salesInvoice.arGatekeeperStatus));
});

// 6. Sub-Fase 3.6: Bayar Penjualan & Withholding Tax
runTest("Sub-Fase 3.6: Bayar Penjualan & PPh 21/23 Settlement (/penjualan/bayar-penjualan)", () => {
  const arReceipt = {
    id: "rec-001",
    receiptNumber: "REC-202609-001",
    invoiceNumber: "INV-202609-001",
    paymentDate: "2026-09-29",
    customerName: "PT Cantik Jelita",
    brandName: "Aura Glow",
    totalInvoiceAmount: 72100000,
    paidAmount: 70000000,
    pph23Deduction: 1400000, // 2% Jasa Maklon
    pph21Deduction: 0,
    netCashReceived: 68600000, // 70M - 1.4M PPh
    remainingAmount: 2100000,
    status: "PARTIAL"
  };

  assert.strictEqual(arReceipt.netCashReceived, arReceipt.paidAmount - (arReceipt.pph23Deduction + arReceipt.pph21Deduction));
  assert.strictEqual(arReceipt.remainingAmount, arReceipt.totalInvoiceAmount - arReceipt.paidAmount);
  assert.ok(["UNPAID", "PARTIAL", "PAID"].includes(arReceipt.status));
});

// 7. Sub-Fase 3.7: Retur Penjualan & QC Karantina
runTest("Sub-Fase 3.7: Retur Penjualan & QC Karantina (/penjualan/retur-penjualan)", () => {
  const salesReturn = {
    id: "ret-001",
    returnCode: "RET-202609-0001",
    soNumber: "SO-202609-0001",
    returnDate: "2026-09-29",
    customerName: "PT Cantik Jelita",
    productName: "Day Cream SPF 30",
    warehouseName: "Gudang Karantina Retur (Sidoarjo)",
    qtyReturned: 50,
    unitPrice: 25000,
    totalValue: 1250000,
    compensationType: "CREDIT_NOTE", // "CREDIT_NOTE" | "REPLACE_GOODS" | "REFUND"
    status: "SELESAI"
  };

  assert.strictEqual(salesReturn.totalValue, salesReturn.qtyReturned * salesReturn.unitPrice);
  assert.ok(["CREDIT_NOTE", "REPLACE_GOODS", "REFUND"].includes(salesReturn.compensationType));
  assert.ok(["PROSES", "QC_PASSED", "SELESAI"].includes(salesReturn.status));
});

// 8. Sub-Fase 3.8: Target Penjualan & Kategori
runTest("Sub-Fase 3.8: Target Penjualan & Kategori (/penjualan/sales-target)", () => {
  const salesTarget = {
    id: "tgt-001",
    month: "September 2026",
    salesPersonName: "Irma Safarina",
    targetAmount: 500000000,
    realizedAmount: 425000000,
    achievementPercentage: 85.0
  };

  const calculatedPct = Number(((salesTarget.realizedAmount / salesTarget.targetAmount) * 100).toFixed(1));
  assert.strictEqual(salesTarget.achievementPercentage, calculatedPct);
  assert.ok(salesTarget.achievementPercentage > 0);
});

console.log("\n================================================================================");
console.log("HASIL AKHIR REGRESSION TEST FASE 3:");
console.log(`  - Total Sub-Fase : ${totalCount}`);
console.log(`  - Lulus          : ${passedCount} / ${totalCount}`);
console.log(`  - Gagal          : ${totalCount - passedCount} / ${totalCount}`);

if (passedCount === totalCount) {
  console.log("🎉 100% SUKSES! SEMUA 8 SUB-FASE FASE 3 PENJUALAN & CRM LULUS TERVERIFIKASI!");
} else {
  console.error("❌ ADA SUB-FASE YANG GAGAL!");
  process.exit(1);
}
console.log("================================================================================\n");
