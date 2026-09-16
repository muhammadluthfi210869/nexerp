const fs = require('fs');
const path = require('path');

const rootDir = 'c:/GAWE/Web Dev/Porto Aureon/ERP FROM ZERO';
const envText = fs.readFileSync(path.join(rootDir, 'backend/.env'), 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) {
    env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const { Pool } = require(path.join(rootDir, 'backend/node_modules/pg'));
const { PrismaPg } = require(path.join(rootDir, 'backend/node_modules/@prisma/adapter-pg'));
const { PrismaClient } = require(path.join(rootDir, 'backend/node_modules/@prisma/client'));

async function main() {
  console.log('🚀 Starting FASE 2 COMMERCIAL, CRM & BUSSDEV SEEDER...');
  console.log('Target DB:', env.DATABASE_URL);

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  await prisma.$connect();
  console.log('✅ Connected to PostgreSQL!');

  try {
    // 1. Ensure Commercial Users exist
    const commercialUsers = await prisma.user.findMany({
      where: {
        roles: { hasSome: ['COMMERCIAL', 'SUPER_ADMIN', 'HEAD_OPS', 'DIRECTOR'] }
      }
    });
    console.log(`Found ${commercialUsers.length} commercial/admin users.`);
    let primaryUser = commercialUsers[0];
    if (!primaryUser) {
      primaryUser = await prisma.user.findFirst();
    }

    // 2. BUSSDEV STAFF
    console.log('📌 Seeding BussdevStaff...');
    const staffNames = [
      { name: 'Irma Safarina', role: 'Head BusDev & Purchasing', target: 1500000000 },
      { name: 'Fadilah Syahab', role: 'Senior Commercial Lead', target: 1200000000 },
      { name: 'Keviana', role: 'BusDev Maklon Skincare', target: 800000000 },
      { name: 'Vira', role: 'BusDev Maklon Bodycare', target: 750000000 },
      { name: 'Desy', role: 'BusDev Private Label & OEM', target: 700000000 },
      { name: 'Salfa Delia Fernanda', role: 'Account Executive', target: 600000000 },
    ];

    const staffMap = {};
    for (let i = 0; i < staffNames.length; i++) {
      const s = staffNames[i];
      const assignedUser = commercialUsers[i % commercialUsers.length] || primaryUser;
      let staff = await prisma.bussdevStaff.findFirst({ where: { name: s.name } });
      if (!staff) {
        staff = await prisma.bussdevStaff.create({
          data: {
            name: s.name,
            targetRevenue: s.target,
            isActive: true,
            avgClosingDays: 24.5,
            totalLeads: 15,
            totalWon: 8,
            totalLost: 3,
            userId: assignedUser.id,
          }
        });
      }
      staffMap[s.name] = staff;
    }
    console.log(`✅ BussdevStaff seeded: ${Object.keys(staffMap).length} staffs.`);

    const defaultStaff = Object.values(staffMap)[0];

    // 3. GUEST LOGS (Buku Tamu Kunjungan)
    console.log('📌 Seeding GuestLog...');
    const existingGuests = await prisma.guestLog.count();
    if (existingGuests === 0) {
      const guestEntries = [
        { clientName: 'Ibu Amanda Putri', instansi: 'Glow & Shine Co', phoneNo: '0812-9988-7711', city: 'Jakarta Selatan', purpose: 'Konsultasi Maklon Serum Retinol Encapsulated', productInterest: 'Serum Retinol 30ml', moqPlan: 1000, targetMarket: 'Wanita 25-45 Karir', category: 'BRANDED', launchingPlan: 'Q4 2026' },
        { clientName: 'dr. Hendra Pratama', instansi: 'Dermalife Aesthetic Clinic', phoneNo: '0811-2233-4455', city: 'Surabaya', purpose: 'Review Sample Batch 2 Hybrid Sunscreen SPF 50', productInterest: 'Sunscreen Gel 50ml', moqPlan: 2500, targetMarket: 'Pasien Klinik Kecantikan', category: 'BRANDED', launchingPlan: 'Q1 2027' },
        { clientName: 'Bapak Surya Wijaya', instansi: 'Kharisma Herbal Nusantara', phoneNo: '0813-5566-7788', city: 'Bandung', purpose: 'Audit Fasilitas Pabrik CPKB & Konsultasi Minyak Kemiri', productInterest: 'Hair Oil 100ml', moqPlan: 5000, targetMarket: 'Mass Market E-Commerce', category: 'BRANDED', launchingPlan: 'Q4 2026' },
        { clientName: 'Ibu Cindy Claudia', instansi: 'Beauty Glow ID', phoneNo: '0817-8899-0011', city: 'Semarang', purpose: 'Riset Formula Moisturizer Barrier Ceramide', productInterest: 'Moisturizer Gel 30g', moqPlan: 1000, targetMarket: 'Remaja & Dewasa Muda', category: 'PEMULA', launchingPlan: 'Q1 2027' },
        { clientName: 'dr. Melissa Anggraini', instansi: 'Aura Derma Aesthetic', phoneNo: '0812-3344-5566', city: 'Malang', purpose: 'Diskusi Kontrak Maklon Facial Wash Acne Series', productInterest: 'Facial Wash Tea Tree 100ml', moqPlan: 3000, targetMarket: 'Kulit Berjerawat', category: 'BRANDED', launchingPlan: 'Q4 2026' },
        { clientName: 'Bapak Rian Hidayat', instansi: 'Nature Skin Botanica', phoneNo: '0856-7788-9900', city: 'Yogyakarta', purpose: 'Konsultasi Sertifikasi BPOM & Halal untuk Deodorant Roll-On', productInterest: 'Natural Deodorant 50ml', moqPlan: 1000, targetMarket: 'Eco-conscious', category: 'PEMULA', launchingPlan: 'Q2 2027' },
        { clientName: 'Ibu Felicia Tan', instansi: 'Velvet Glow Beauty', phoneNo: '0819-2233-4411', city: 'Tangerang', purpose: 'Uji Organoleptik Body Lotion Instant Whitening', productInterest: 'Body Lotion Tone Up 250ml', moqPlan: 2000, targetMarket: 'Wanita 18-35', category: 'BRANDED', launchingPlan: 'Q4 2026' },
        { clientName: 'Bapak David Susanto', instansi: 'Alpha Men Grooming', phoneNo: '0813-4455-6677', city: 'Jakarta Utara', purpose: 'Maklon Hair Clay Matte Pomade untuk Pria', productInterest: 'Matte Clay Pomade 80g', moqPlan: 1500, targetMarket: 'Pria Dewasa Urban', category: 'BRANDED', launchingPlan: 'Q1 2027' },
      ];

      for (const ge of guestEntries) {
        await prisma.guestLog.create({
          data: {
            clientName: ge.clientName,
            instansi: ge.instansi,
            phoneNo: ge.phoneNo,
            city: ge.city,
            purpose: ge.purpose,
            productInterest: ge.productInterest,
            moqPlan: ge.moqPlan,
            targetMarket: ge.targetMarket,
            category: ge.category,
            launchingPlan: ge.launchingPlan,
            bdId: primaryUser.id,
          }
        });
      }
      console.log(`✅ GuestLog seeded: ${guestEntries.length} entries.`);
    }

    // 4. SALES LEADS & PIPELINE DEALS (dari Client_Sample_Busdev.csv)
    console.log('📌 Seeding SalesLead & Pipeline...');
    const existingLeads = await prisma.salesLead.count();
    if (existingLeads === 0) {
      const csvData = [
        { client: 'M. Setyo', brand: 'Anasera', domisili: 'Situbondo', phone: '085748470142', product: 'Message Cream', moq: 500, budget: 35000000, status: 'SAMPLE_REQUESTED', hki: 'SUDAH ADA', notes: 'Klien pengen produk message cream yg fokus ke cedera & relaksasi spa.' },
        { client: 'Rizka', brand: 'Skin Haven', domisili: 'Sidoarjo', phone: '081230066663', product: 'Soothing Gel Aloe', moq: 1000, budget: 28000000, status: 'SAMPLE_APPROVED', hki: 'BELUM ADA HKI', notes: 'Formula disetujui, sedang pilih kemasan jar 50g.' },
        { client: 'Nurul Hidayati', brand: 'Glow Secret', domisili: 'Surabaya', phone: '081333445566', product: 'Brightening Serum 20ml', moq: 2000, budget: 56000000, status: 'SPK_SIGNED', hki: 'SUDAH ADA', notes: 'SPK ditandatangani, menunggu transfer DP 50%.' },
        { client: 'dr. Farah Diba', brand: 'Farah Derma Clinic', domisili: 'Malang', phone: '082155667788', product: 'Acne Day Cream SPF 30', moq: 3000, budget: 84000000, status: 'DP_PAID', hki: 'SUDAH ADA', notes: 'DP lunas masuk BCA Operasional, lanjut pengadaan bahan baku.' },
        { client: 'Bapak Kevin Ardiansyah', brand: 'K-Skin Men', domisili: 'Jakarta Barat', phone: '081899001122', product: 'Men Facial Cleanser Charcoal', moq: 5000, budget: 125000000, status: 'PRODUCTION_PLAN', hki: 'SUDAH ADA', notes: 'Jadwal mixing batch 1 sudah masuk PPIC tanggal 25.' },
        { client: 'Ibu Maya Safitri', brand: 'Maya Botanicals', domisili: 'Bandung', phone: '081223344556', product: 'Rose Hydrating Toner', moq: 1000, budget: 32000000, status: 'FOLLOW_UP_2', hki: 'PROSES DAFTAR', notes: 'Follow up feedback aroma sample revisi 1.' },
        { client: 'Hendra Gunawan', brand: 'Luminous Touch', domisili: 'Semarang', phone: '087811223344', product: 'Tone Up Sunscreen SPF 50', moq: 2000, budget: 64000000, status: 'NEGOTIATION', hki: 'SUDAH ADA', notes: 'Negosiasi payment term DP 40% dan pelunasan sebelum DO.' },
        { client: 'dr. Anita Wijaya', brand: 'Anita Aesthetics', domisili: 'Denpasar', phone: '081399887766', product: 'Peeling Serum AHA BHA', moq: 1500, budget: 48000000, status: 'WON_DEAL', hki: 'SUDAH ADA', notes: 'Deal tuntas, repeat order pertama dalam antrean.' },
        { client: 'Bapak Tommy Lee', brand: 'Alpha Haircare', domisili: 'Surabaya', phone: '085733445511', product: 'Anti Dandruff Scalp Tonic', moq: 1000, budget: 30000000, status: 'LOST', hki: 'TIDAK ADA', notes: 'Lost: Klien hanya butuh konsultasi formula gratis lalu ghosting.' },
        { client: 'Ibu Citra Kirana', brand: 'Citra Glow Nusantara', domisili: 'Yogyakarta', phone: '081266778899', product: 'Kojic Body Scrub 200g', moq: 2500, budget: 62500000, status: 'SAMPLE_APPROVED', hki: 'SUDAH ADA', notes: 'Sample approved, persiapan MoU kontrak maklon eksklusif.' },
      ];

      for (let i = 0; i < csvData.length; i++) {
        const item = csvData[i];
        const assignedStaff = Object.values(staffMap)[i % Object.values(staffMap).length] || defaultStaff;

        const lead = await prisma.salesLead.create({
          data: {
            clientName: item.client,
            brandName: item.brand,
            brandCode: `BRD-${String(i + 1).padStart(4, '0')}`,
            contactInfo: item.phone,
            source: 'INSTAGRAM_ADS',
            productInterest: item.product,
            estimatedValue: item.budget,
            status: item.status,
            picId: assignedStaff.id,
            bdId: primaryUser.id,
            city: item.domisili,
            moq: item.moq,
            planOmset: item.budget,
            hkiProgress: item.hki,
            notes: item.notes,
            targetMarket: 'Cosmetics Consumers',
          }
        });

        // 5. SAMPLE REQUESTS
        const sampleCode = `SMP-2026-${String(i + 1).padStart(3, '0')}`;
        const sampleStage = item.status === 'SAMPLE_APPROVED' || item.status === 'SPK_SIGNED' || item.status === 'DP_PAID' || item.status === 'PRODUCTION_PLAN' || item.status === 'WON_DEAL'
          ? 'APPROVED'
          : item.status === 'LOST'
          ? 'REJECTED'
          : 'FORMULATING';

        const sample = await prisma.sampleRequest.create({
          data: {
            sampleCode: sampleCode,
            leadId: lead.id,
            productName: item.product,
            targetFunction: `Solusi formulasi maklon ${item.product}`,
            textureReq: 'Lightweight, non-sticky, cepat meresap',
            colorReq: 'Natural aesthetic',
            aromaReq: 'Lembut mewah non-alergenik',
            version: 1,
            stage: sampleStage,
            revisionCount: 1,
            revisionStatus: sampleStage === 'APPROVED' ? 'DONE' : 'IN_PROGRESS',
            targetHpp: item.budget / item.moq * 0.4,
            feedback: item.notes,
          }
        });

        // 6. SALES ORDERS (Untuk deal yang sudah masuk DP / Produksi / Won)
        if (item.status === 'DP_PAID' || item.status === 'PRODUCTION_PLAN' || item.status === 'WON_DEAL') {
          const soCode = `SO-202609-${String(i + 1).padStart(6, '0')}`;
          const so = await prisma.salesOrder.create({
            data: {
              orderNumber: soCode,
              leadId: lead.id,
              sampleId: sample.id,
              totalAmount: item.budget,
              quantity: item.moq,
              brandName: item.brand,
              status: item.status === 'PRODUCTION_PLAN' ? 'READY_TO_PRODUCE' : 'ACTIVE',
              salesCategory: 'MAKLON_BARU',
            }
          });

          await prisma.salesOrderItem.create({
            data: {
              soId: so.id,
              sampleId: sample.id,
              productName: item.product,
              netto: 50,
              quantity: item.moq,
              unitPrice: item.budget / item.moq,
              subtotal: item.budget,
            }
          });
        }

        // 7. LOST DEAL
        if (item.status === 'LOST') {
          await prisma.lostDeal.create({
            data: {
              leadId: lead.id,
              bdId: primaryUser.id,
              stageLost: 'SAMPLE',
              reasonType: 'GHOSTING',
              lostValue: item.budget,
              notes: item.notes,
            }
          });
        }
      }
      console.log(`✅ Seeded ${csvData.length} SalesLeads, Samples, SOs, and LostDeals.`);
    }

    console.log('🎉 FASE 2 COMMERCIAL SEEDER COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Seeder error:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
