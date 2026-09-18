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

async function seedFase6() {
  console.log('--- START SEEDING FASE 6: PRODUKSI PABRIK, SPK & JADWAL PRODUKSI ---');
  console.log('Target DB:', env.DATABASE_URL);

  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const leads = await prisma.salesLead.findMany({ take: 5 });
    if (leads.length === 0) {
      throw new Error('No sales leads found');
    }
    const defaultLead = leads[0];

    const users = await prisma.user.findMany({ take: 5 });
    const defaultUser = users[0];

    // 1. Seed Machines
    console.log('Seeding Machines...');
    const machineData = [
      { name: 'Bejana Homogenizer 500L (MIX-01)', type: 'MIXING_MACHINE', capacityPerBatch: 500, costPerHour: 150000 },
      { name: 'Semi-Auto Piston Filler 4-Nozzle (FIL-01)', type: 'FILLING_MACHINE', capacityPerBatch: 1200, costPerHour: 85000 },
      { name: 'Shrink Tunnel & Auto Sealer (PKG-01)', type: 'PACKING_MACHINE', capacityPerBatch: 2000, costPerHour: 65000 }
    ];

    const machines = [];
    for (const m of machineData) {
      let existing = await prisma.machine.findFirst({ where: { name: m.name } });
      if (!existing) {
        existing = await prisma.machine.create({ data: m });
        console.log(`  + Created Machine ${m.name}`);
      }
      machines.push(existing);
    }

    const mixMachine = machines.find(m => m.type === 'MIXING_MACHINE') || machines[0];
    const filMachine = machines.find(m => m.type === 'FILLING_MACHINE') || machines[0];
    const pkgMachine = machines.find(m => m.type === 'PACKING_MACHINE') || machines[0];

    // 2. Seed WorkOrders
    console.log('Seeding Work Orders...');
    const woData = [
      {
        woNumber: 'WO-2026-0001',
        leadId: defaultLead.id,
        targetQty: 3000,
        stage: 'MIXING',
        targetCompletion: new Date('2026-09-20T17:00:00Z'),
        targetHpp: 28000
      },
      {
        woNumber: 'WO-2026-0002',
        leadId: leads[1]?.id || defaultLead.id,
        targetQty: 5000,
        stage: 'WAITING_MATERIAL',
        targetCompletion: new Date('2026-09-25T17:00:00Z'),
        targetHpp: 25000
      },
      {
        woNumber: 'WO-2026-0003',
        leadId: leads[2]?.id || defaultLead.id,
        targetQty: 1500,
        stage: 'FILLING',
        targetCompletion: new Date('2026-09-28T17:00:00Z'),
        targetHpp: 32000
      }
    ];

    const workOrders = [];
    for (const w of woData) {
      let existing = await prisma.workOrder.findUnique({ where: { woNumber: w.woNumber } });
      if (!existing) {
        existing = await prisma.workOrder.create({ data: w });
        console.log(`  + Created WorkOrder ${w.woNumber}`);
      }
      workOrders.push(existing);
    }

    // 3. Seed Production Schedules (Mixing, Filling, Packaging)
    console.log('Seeding Production Schedules...');
    const scheduleData = [
      {
        scheduleNumber: 'SCH-MIX-2026-0001',
        workOrderId: workOrders[0].id,
        machineId: mixMachine.id,
        stage: 'MIXING',
        startTime: new Date('2026-09-17T08:00:00Z'),
        endTime: new Date('2026-09-17T14:00:00Z'),
        targetQty: 3000,
        resultQty: 3000,
        upscalePercent: 10,
        upscaleResult: 330,
        notes: 'Formula Day Cream SPF 30, homogenizer speed 3200 RPM',
        status: 'SCHEDULED'
      },
      {
        scheduleNumber: 'SCH-MIX-2026-0002',
        workOrderId: workOrders[1].id,
        machineId: mixMachine.id,
        stage: 'MIXING',
        startTime: new Date('2026-09-18T08:00:00Z'),
        endTime: new Date('2026-09-18T16:00:00Z'),
        targetQty: 5000,
        resultQty: 5000,
        upscalePercent: 8,
        upscaleResult: 540,
        notes: 'Formula Facial Foam Charcoal, pemanasan fasa minyak 75C',
        status: 'SCHEDULED'
      },
      {
        scheduleNumber: 'SCH-FIL-2026-0001',
        workOrderId: workOrders[0].id,
        machineId: filMachine.id,
        stage: 'FILLING',
        startTime: new Date('2026-09-19T08:30:00Z'),
        endTime: new Date('2026-09-19T13:30:00Z'),
        targetQty: 3000,
        resultQty: 2980,
        notes: 'Filling botol dropper amber 20ml steril',
        status: 'SCHEDULED'
      },
      {
        scheduleNumber: 'SCH-FIL-2026-0002',
        workOrderId: workOrders[1].id,
        machineId: filMachine.id,
        stage: 'FILLING',
        startTime: new Date('2026-09-20T08:30:00Z'),
        endTime: new Date('2026-09-20T15:30:00Z'),
        targetQty: 5000,
        resultQty: 5000,
        notes: 'Filling tube 100ml ultrasonik seal',
        status: 'SCHEDULED'
      },
      {
        scheduleNumber: 'SCH-PKG-2026-0001',
        workOrderId: workOrders[0].id,
        machineId: pkgMachine.id,
        stage: 'PACKING',
        startTime: new Date('2026-09-21T09:00:00Z'),
        endTime: new Date('2026-09-21T16:00:00Z'),
        targetQty: 3000,
        resultQty: 2980,
        notes: 'Packing inner box + segel hologram BPOM',
        status: 'SCHEDULED'
      },
      {
        scheduleNumber: 'SCH-PKG-2026-0002',
        workOrderId: workOrders[1].id,
        machineId: pkgMachine.id,
        stage: 'PACKING',
        startTime: new Date('2026-09-22T09:00:00Z'),
        endTime: new Date('2026-09-22T17:00:00Z'),
        targetQty: 5000,
        resultQty: 5000,
        notes: 'Packing master box isi 24 pcs per karton',
        status: 'SCHEDULED'
      }
    ];

    for (const s of scheduleData) {
      const existing = await prisma.productionSchedule.findUnique({
        where: { scheduleNumber: s.scheduleNumber }
      });
      if (!existing) {
        await prisma.productionSchedule.create({ data: s });
        console.log(`  + Created ProductionSchedule ${s.scheduleNumber} (${s.stage})`);
      } else {
        console.log(`  = Exists ProductionSchedule ${s.scheduleNumber}`);
      }
    }

    // 4. Seed Production Logs (Realisasi Produksi)
    console.log('Seeding Production Logs...');
    const logData = [
      {
        logNumber: 'LOG-MIX-2026-0001',
        workOrderId: workOrders[0].id,
        stage: 'MIXING',
        inputQty: 330,
        goodQty: 326.5,
        quarantineQty: 0,
        rejectQty: 0,
        shrinkageQty: 3.5,
        machineId: mixMachine.id,
        operatorId: defaultUser?.id,
        notes: 'Realisasi mixing batch 1: homogenitas lolos uji viskositas lab QC'
      },
      {
        logNumber: 'LOG-FIL-2026-0001',
        workOrderId: workOrders[0].id,
        stage: 'FILLING',
        inputQty: 3000,
        goodQty: 2980,
        quarantineQty: 0,
        rejectQty: 15,
        shrinkageQty: 5,
        machineId: filMachine.id,
        operatorId: defaultUser?.id,
        notes: 'Realisasi filling batch 1: 15 botol reject lecet nozzle'
      },
      {
        logNumber: 'LOG-PKG-2026-0001',
        workOrderId: workOrders[0].id,
        stage: 'PACKING',
        inputQty: 2980,
        goodQty: 2980,
        quarantineQty: 0,
        rejectQty: 0,
        shrinkageQty: 0,
        machineId: pkgMachine.id,
        operatorId: defaultUser?.id,
        notes: 'Realisasi packing batch 1: 100% lolos segel shrink wrap'
      }
    ];

    for (const l of logData) {
      const existing = await prisma.productionLog.findUnique({
        where: { logNumber: l.logNumber }
      });
      if (!existing) {
        await prisma.productionLog.create({ data: l });
        console.log(`  + Created ProductionLog ${l.logNumber}`);
      } else {
        console.log(`  = Exists ProductionLog ${l.logNumber}`);
      }
    }

    console.log('--- SEEDING FASE 6 COMPLETE SUCCESSFULLY ---');
  } catch (err) {
    console.error('Error during Fase 6 seeding:', err);
    throw err;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seedFase6().catch(e => {
  console.error(e);
  process.exit(1);
});
