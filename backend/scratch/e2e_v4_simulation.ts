import { PrismaClient, PipelineStage, Division, StreamEventType, SampleStage, SOStatus, WorkOrderStage, LegalStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function runSimulation() {
  console.log('🚀 Starting Dreamlab V4 E2E Activity Stream Simulation...');

  // --- PREPARATION ---
  // Ensure we have a staff record for Busdev
  let bdStaff = await prisma.bussdevStaff.findFirst();
  if (!bdStaff) {
    bdStaff = await prisma.bussdevStaff.create({
      data: { name: 'Fina', targetRevenue: 1000000000 }
    });
  }

  const clientName = 'Klien X (Whitening Series)';
  
  // --- FASE 1: AKUISISI & NEGOSIASI ---
  console.log('\n--- Fase 1: Akuisisi & Negosiasi ---');
  
  const lead = await prisma.salesLead.create({
    data: {
      clientName,
      productInterest: 'Whitening Series',
      contactInfo: '08123456789 (WhatsApp)',
      source: 'Meta Ads',
      picId: bdStaff.id,
      stage: PipelineStage.NEW_LEAD,
      planOmset: 50000000,
      moq: 5000,
    }
  });

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.SYSTEM,
      eventType: StreamEventType.STATE_CHANGE,
      notes: 'Leads baru masuk dari Meta Ads (Campaign: Whitening Series). Dashboard CPL Updated.',
      loggedBy: 'SYSTEM'
    }
  });
  console.log('[SYSTEM] Leads created');

  await prisma.salesLead.update({
    where: { id: lead.id },
    data: { stage: PipelineStage.CONTACTED }
  });

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.BD,
      eventType: StreamEventType.STATE_CHANGE,
      notes: 'Mengubah status menjadi Contacted. Catatan: Klien tertarik maklon 5000 pcs.',
      loggedBy: 'FINA'
    }
  });
  console.log('[BUSDEV] Stage changed to Contacted');

  await prisma.salesLead.update({
    where: { id: lead.id },
    data: { stage: PipelineStage.NEGOTIATION }
  });

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.BD,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Mengunggah Penawaran Harga (Quotation). Status: Negotiation.',
      payload: { quotationFile: 'quotation_v1.pdf', value: 50000000 },
      loggedBy: 'FINA'
    }
  });
  console.log('[BUSDEV] Quotation uploaded');

  // --- FASE 2: PENGEMBANGAN SAMPEL ---
  console.log('\n--- Fase 2: Pengembangan Sampel ---');

  const sample = await prisma.sampleRequest.create({
    data: {
      leadId: lead.id,
      productName: 'Whitening Cream V1',
      targetFunction: 'Whitening',
      textureReq: 'Creamy',
      colorReq: 'White',
      aromaReq: 'Rose',
      stage: SampleStage.QUEUE,
      pnfFileUrl: 'pnf_whitening.pdf'
    }
  });

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.BD,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Mengunggah berkas PNF & Bukti Transfer Biaya Sampel (Rp 500.000).',
      payload: { pnfFile: 'pnf_whitening.pdf', transferProof: 'tf_sample_500k.jpg' },
      loggedBy: 'FINA'
    }
  });
  console.log('[BUSDEV] PNF & Transfer Proof uploaded');

  await prisma.sampleRequest.update({
    where: { id: sample.id },
    data: { 
        isPaymentVerified: true, 
        stage: SampleStage.FORMULATING,
        financialStatus: 'DP_PAID'
    }
  });

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.FINANCE,
      eventType: StreamEventType.GATE_OPENED,
      notes: 'VERIFIED. Dana masuk (Kas BCA). Gembok R&D terbuka.',
      loggedBy: 'ZAKI'
    }
  });
  console.log('[FINANCE] Sample payment verified');

  await prisma.formula.create({
    data: {
      id: `F-SIM-${Date.now()}`,
      sampleRequestId: sample.id,
      targetYieldGram: 100,
      status: 'DRAFT',
    }
  });

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.RND,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Mengunggah Formula v1. Status: Sample Development.',
      payload: { formulaId: '#F-102-V1' },
      loggedBy: 'ADI'
    }
  });
  console.log('[R&D] Formula V1 uploaded');

  await prisma.sampleRequest.update({
    where: { id: sample.id },
    data: { feedback: 'Aroma kurang kuat, minta tekstur lebih cair', revisionCount: 1 }
  });

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.BD,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Input Revisi 1: "Aroma kurang kuat, minta tekstur lebih cair".',
      loggedBy: 'FINA'
    }
  });
  console.log('[BUSDEV] Revision input');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.RND,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Mengunggah Formula v2 (Revised).',
      payload: { formulaId: '#F-102-V2' },
      loggedBy: 'ADI'
    }
  });
  console.log('[R&D] Formula V2 uploaded');

  await prisma.sampleRequest.update({
    where: { id: sample.id },
    data: { stage: SampleStage.APPROVED }
  });
  
  await prisma.salesLead.update({
      where: { id: lead.id },
      data: { stage: PipelineStage.SAMPLE_APPROVED }
  });

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.BD,
      eventType: StreamEventType.STATE_CHANGE,
      notes: 'Menandai Sample Approved. Mengunci ID Formula #F-102.',
      loggedBy: 'FINA'
    }
  });
  console.log('[BUSDEV] Sample Approved');

  // --- FASE 3: LEGALITAS & ESTETIKA ---
  console.log('\n--- Fase 3: Legalitas & Estetika ---');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.LEGAL,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Input Progres BPOM: Pengajuan Akun Klien & HKI Merek. Status: Waiting BPOM.',
      loggedBy: 'IRMA'
    }
  });
  console.log('[LEGAL] BPOM Progress input');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.SYSTEM, // Simulating Designer log
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Mengunggah Mockup Kemasan v1 (Layout BPOM Ready).',
      payload: { mockupUrl: 'mockup_v1.png' },
      loggedBy: 'RIO'
    }
  });
  console.log('[DESIGNER] Mockup uploaded');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.LEGAL,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Input Nomor Notifikasi BPOM (NA182xxxx). Legal Release Approved.',
      loggedBy: 'IRMA'
    }
  });
  console.log('[LEGAL] BPOM Number input');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.SYSTEM,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Finalisasi Desain dengan Nomor NA. Mengunggah Desain Approved.',
      payload: { designUrl: 'final_design.pdf' },
      loggedBy: 'RIO'
    }
  });
  console.log('[DESIGNER] Final Design uploaded');

  // --- FASE 4: KONTRAK & PERSIAPAN MATERIAL ---
  console.log('\n--- Fase 4: Kontrak & Persiapan Material ---');

  const so = await prisma.salesOrder.create({
      data: {
          id: `SO-${Date.now()}`,
          leadId: lead.id,
          sampleId: sample.id,
          totalAmount: 50000000,
          quantity: 5000,
          status: SOStatus.PENDING_DP,
          paymentProofUrl: 'tf_dp_25m.jpg'
      }
  });

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.BD,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Mengunggah berkas SPK Signed & Bukti Transfer DP 50%.',
      payload: { spkFile: 'spk_signed.pdf', transferProof: 'tf_dp_25m.jpg' },
      loggedBy: 'FINA'
    }
  });
  console.log('[BUSDEV] SPK & DP uploaded');

  await prisma.salesOrder.update({
      where: { id: so.id },
      data: { isPaymentVerified: true, status: SOStatus.ACTIVE }
  });

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.FINANCE,
      eventType: StreamEventType.GATE_OPENED,
      notes: 'VERIFIED. Dana masuk Rp 25.000.000. Membuka gembok SCM & Gudang.',
      loggedBy: 'ZAKI'
    }
  });
  console.log('[FINANCE] DP Verified');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.WAREHOUSE,
      eventType: StreamEventType.STATE_CHANGE,
      notes: 'Menjalankan Stock Availability Check (BOM #F-102). Status: Bahan Baku Kurang.',
      loggedBy: 'BUDI'
    }
  });
  console.log('[WAREHOUSE] Stock Check - Shortage');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.SYSTEM,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Menerbitkan Purchase Request (PR) otomatis ke SCM.',
      loggedBy: 'SYSTEM'
    }
  });
  console.log('[SYSTEM] PR Generated');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.SCM,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Membuat Purchase Order (PO) ke Supplier Material & Kemasan.',
      loggedBy: 'TATA'
    }
  });
  console.log('[SCM] PO Created');

  // --- FASE 5: EKSEKUSI PRODUKSI ---
  console.log('\n--- Fase 5: Eksekusi Produksi ---');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.QC,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Menginput Incoming QC: PASSED untuk bahan baku dari Supplier. Stok masuk Gudang Utama.',
      loggedBy: 'LALA'
    }
  });
  console.log('[QC] Incoming QC Passed');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.PRODUCTION,
      eventType: StreamEventType.STATE_CHANGE,
      notes: 'Mencetak Batch Record. Status: Production - Mixing Phase.',
      loggedBy: 'EKO'
    }
  });
  console.log('[PRODUCTION] Mixing Phase');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.QC,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Menginput Hasil QC Mixing: RELEASED.',
      loggedBy: 'LALA'
    }
  });
  console.log('[QC] Mixing QC Released');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.PRODUCTION,
      eventType: StreamEventType.STATE_CHANGE,
      notes: 'Status: Production - Filling & Packing Phase.',
      loggedBy: 'EKO'
    }
  });
  console.log('[PRODUCTION] Filling & Packing Phase');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.QC,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Menginput Hasil QC Packing: PASSED. Total 5.050 pcs Finish Good tercatat.',
      loggedBy: 'LALA'
    }
  });
  console.log('[QC] Packing QC Passed');

  // --- FASE 6: PENGIRIMAN & CLOSING ---
  console.log('\n--- Fase 6: Pengiriman & Closing ---');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.LEGAL, // Simulating APJ
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Menandatangani Digital Product Release. Status: Ready to Ship.',
      loggedBy: 'IRMA'
    }
  });
  console.log('[APJ] Product Release Signed');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.FINANCE,
      eventType: StreamEventType.GATE_OPENED,
      notes: 'Mengonfirmasi Pelunasan 50%. Membuka gembok Surat Jalan.',
      loggedBy: 'ZAKI'
    }
  });
  console.log('[FINANCE] Final Payment Verified');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.WAREHOUSE,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Mencetak Surat Jalan & Input Ekspedisi. Barang Keluar.',
      loggedBy: 'BUDI'
    }
  });
  console.log('[WAREHOUSE] Item Shipped');

  await prisma.salesLead.update({
      where: { id: lead.id },
      data: { stage: PipelineStage.WON_DEAL }
  });

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.SYSTEM,
      eventType: StreamEventType.STATE_CHANGE,
      notes: 'Mengubah status SO menjadi Won Deal. Omset tercatat di Dashboard Executive.',
      loggedBy: 'SYSTEM'
    }
  });
  console.log('[SYSTEM] Won Deal');

  // --- FASE 7: RETENSI & REPEAT ORDER ---
  console.log('\n--- Fase 7: Retensi & Repeat Order ---');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.SYSTEM,
      eventType: StreamEventType.SLA_BREACH, // Simulating RO Notification
      notes: '(45 Hari Kemudian) - NOTIFIKASI REPEAT ORDER: Estimasi stok Klien X tersisa 15% (Berdasarkan tren penjualan).',
      loggedBy: 'SYSTEM'
    }
  });
  console.log('[SYSTEM] RO Notification');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.BD,
      eventType: StreamEventType.MANUAL_LOG,
      notes: 'Melakukan Follow Up. Klien meminta penawaran baru dengan kenaikan Qty menjadi 10.000 pcs.',
      loggedBy: 'FINA'
    }
  });
  console.log('[BUSDEV] Follow Up RO');

  await prisma.activityStream.create({
    data: {
      leadId: lead.id,
      senderDivision: Division.SYSTEM,
      eventType: StreamEventType.STATE_CHANGE,
      notes: 'Membuat SO Baru (Repeat Order) dengan referensi Formula #F-102. Siklus berulang dari Fase 4.',
      loggedBy: 'SYSTEM'
    }
  });
  console.log('[SYSTEM] Repeat Order SO Created');

  console.log('\n✅ Simulation Completed Successfully!');
  console.log(`Simulation Lead ID: ${lead.id}`);
}

runSimulation()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
