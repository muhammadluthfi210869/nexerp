import { ForbiddenException } from '@nestjs/common';
import { mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFile, rm, writeFile } from 'fs/promises';
import { MarketingPrototypeService } from '../marketing-prototype.service';
import { toLocalDateString } from '../sla.util';

/**
 * Unit test SERVICE (JSON-store) — ditulis ulang menggantikan test lama yang
 * meng-mock Prisma (service sekarang menyimpan ke file JSON — lihat
 * docs/REMEDIATION-MANAGEMENT-TASK.md T2/P6.1). Setiap test memakai file state
 * TEMPORER (stateFilePathOverride) supaya file produksi tidak tersentuh.
 *
 * Tanggal dibuat RELATIF terhadap hari ini (kalender lokal) karena service
 * menghitung SLA dengan `new Date()` — ini membuat test stabil di mesin mana pun.
 */

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}

const MANAGER = { email: 'admin@nexerp.id', roles: ['SUPER_ADMIN'] };
const AUREL = { email: 'aurel@nexerp.id', fullName: 'Aurel', roles: ['DIGIMAR'] };

describe('MarketingPrototypeService (JSON store)', () => {
  let service: MarketingPrototypeService;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = mkdtempSync(join(tmpdir(), 'mkt-proto-test-'));
    service = new MarketingPrototypeService();
    service.useStatePath(join(tempDir, 'state.json'));
    await service.resetState(MANAGER);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  describe('createTask', () => {
    it('member (DIGIMAR) BISA membuat task untuk dirinya sendiri', async () => {
      const created = await service.createTask(AUREL, { title: 'Task member sendiri', pic: 'Aurel' });
      expect(created.id).toMatch(/^TSK-/);
      expect(created.pic).toBe('Aurel'); // pic = dirinya
      expect(created.assignedBy).toBe('Aurel'); // assignedBy = dirinya
      expect(created.reviewer).toBe('Revi'); // reviewer dipaksa ke manager
    });

    it('member TIDAK bisa membuat task untuk orang lain (ForbiddenException)', async () => {
      await expect(
        service.createTask(AUREL, { title: 'Coba untuk Revi', pic: 'Revi' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('orang tanpa identitas member/manager tetap ditolak (ForbiddenException)', async () => {
      await expect(
        service.createTask({ email: 'unknown@nexerp.id', roles: [] }, { title: 'X' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('mengabaikan id `local-*` dari klien dan memakai id server (BUG-S3/P4.3)', async () => {
      const created = await service.createTask(MANAGER, { id: 'local-123', title: 'Test id', pic: 'Aurel' });
      expect(created.id).toBeDefined();
      expect(created.id).not.toBe('local-123');
      expect(created.id).toMatch(/^TSK-/);
      const bundle = await service.getBundle(MANAGER);
      expect(bundle.tasks.some((t) => t.id === 'local-123')).toBe(false);
      expect(bundle.tasks.some((t) => t.id === created.id)).toBe(true);
    });

    it('default startDate/dueDate = tanggal LOKAL hari ini (BUG-D1/P1.1)', async () => {
      const created = await service.createTask(MANAGER, { title: 'Tanggal lokal', pic: 'Aurel' });
      expect(created.startDate).toBe(toLocalDateString());
      expect(created.dueDate).toBe(toLocalDateString());
    });

    it('tidak crash saat state.projects KOSONG (project fallback)', async () => {
      // Kosongkan projects (kasus state produksi kosong).
      const state = JSON.parse(await readFile(join(tempDir, 'state.json'), 'utf8'));
      state.projects = [];
      await writeFile(join(tempDir, 'state.json'), JSON.stringify(state, null, 2), 'utf8');

      const created = await service.createTask(MANAGER, { title: 'Tanpa project', pic: 'Aurel' });
      expect(created.id).toBeDefined();
      expect(created.project).toBe('Marketing');
      expect(created.projectId).toBe('PRJ-LOCAL');
    });
  });

  describe('updateTaskStatus → completedAt', () => {
    it('mengisi completedAt saat status berubah ke Done (P1.2)', async () => {
      const created = await service.createTask(MANAGER, { title: 'Selesai', pic: 'Aurel', status: 'Working on it' });
      const done = await service.updateTaskStatus(MANAGER, created.id, 'Done');
      expect(done?.status).toBe('Done');
      expect(done?.completedAt).toBeDefined();
      expect(new Date(done!.completedAt!).getTime()).not.toBeNaN();
    });

    it('menghapus completedAt saat task keluar dari Done', async () => {
      const created = await service.createTask(MANAGER, { title: 'Keluar Done', pic: 'Aurel' });
      await service.updateTaskStatus(MANAGER, created.id, 'Done');
      const reopened = await service.updateTaskStatus(MANAGER, created.id, 'Working on it');
      expect(reopened?.status).toBe('Working on it');
      expect(reopened?.completedAt).toBeUndefined();
    });

    it('SLA task Done dihitung dari completedAt, bukan hari ini (akar masalah BUG-D2)', async () => {
      // Task selesai 30 hari lalu tepat di due → harus tetap Healthy walau
      // "hari ini" sudah jauh. Simulasi: tulis task dengan completedAt = dueDate.
      const due = daysFromNow(-30);
      const state = JSON.parse(await readFile(join(tempDir, 'state.json'), 'utf8'));
      state.tasks.push({
        id: 'HISTORIC-1',
        title: 'Selesai historis',
        projectId: 'PRJ-2401',
        project: 'Q3 Acquisition Sprint',
        channel: 'General',
        category: 'general_operations',
        brand: 'Dreamlab',
        assignedBy: 'Revi',
        pic: 'Aurel',
        reviewer: 'Revi',
        priority: 'Medium',
        startDate: due,
        dueDate: due,
        status: 'Done',
        completedAt: `${due}T08:00:00.000Z`,
        sla: 'Healthy',
        estimatedHours: 4,
        actualHours: 4,
        revisionCount: 0,
        checklistDone: 4,
        checklistTotal: 4,
        brief: '',
        tags: [],
        comments: [],
        history: [{ at: `${due}T07:00:00.000Z`, by: 'Revi', to: 'Done', note: 'selesai' }],
        attachments: [],
      });
      await writeFile(join(tempDir, 'state.json'), JSON.stringify(state, null, 2), 'utf8');

      const bundle = await service.getBundle(MANAGER);
      const historic = bundle.tasks.find((t) => t.id === 'HISTORIC-1');
      expect(historic?.status).toBe('Done');
      expect(historic?.sla).toBe('Healthy'); // bukan Late walau due sudah lewat
    });
  });

  describe('updateTask → ganti dueDate → SLA recompute (badge real-time)', () => {
    it('open task: due hari ini → diganti kemarin → sla Watch', async () => {
      const created = await service.createTask(MANAGER, { title: 'Open re-due', pic: 'Aurel', dueDate: toLocalDateString() });
      const before = (await service.getBundle(MANAGER)).tasks.find((t) => t.id === created.id)!;
      expect(before.sla).toBe('Healthy'); // due hari ini
      await service.updateTask(MANAGER, created.id, { dueDate: daysFromNow(-1) });
      const after = (await service.getBundle(MANAGER)).tasks.find((t) => t.id === created.id)!;
      expect(after.dueDate).toBe(daysFromNow(-1));
      expect(after.sla).toBe('Watch'); // lewat 1 hari
    });

    it('open task: due diganti jadi +3 hari → sla tetap Healthy (belum lewat)', async () => {
      const created = await service.createTask(MANAGER, { title: 'Open re-due future', pic: 'Aurel', dueDate: daysFromNow(-2) });
      expect((await service.getBundle(MANAGER)).tasks.find((t) => t.id === created.id)!.sla).toBe('Late');
      await service.updateTask(MANAGER, created.id, { dueDate: daysFromNow(3) });
      expect((await service.getBundle(MANAGER)).tasks.find((t) => t.id === created.id)!.sla).toBe('Healthy');
    });

    it('Done task: on-time → due diganti ke masa lalu → sla Late (badge ikut berubah)', async () => {
      const created = await service.createTask(MANAGER, { title: 'Done re-due', pic: 'Aurel', dueDate: daysFromNow(2) });
      await service.updateTaskStatus(MANAGER, created.id, 'Done'); // completedAt = hari ini
      const before = (await service.getBundle(MANAGER)).tasks.find((t) => t.id === created.id)!;
      expect(before.sla).toBe('Healthy'); // selesai lebih awal dari due +2
      await service.updateTask(MANAGER, created.id, { dueDate: daysFromNow(-3) });
      const after = (await service.getBundle(MANAGER)).tasks.find((t) => t.id === created.id)!;
      expect(after.dueDate).toBe(daysFromNow(-3));
      expect(after.sla).toBe('Late'); // selesai 3 hari lewat due yang baru
    });

    it('Done task: due diganti ke masa depan → sla kembali Healthy', async () => {
      const created = await service.createTask(MANAGER, { title: 'Done re-due back', pic: 'Aurel', dueDate: daysFromNow(-3) });
      await service.updateTaskStatus(MANAGER, created.id, 'Done');
      expect((await service.getBundle(MANAGER)).tasks.find((t) => t.id === created.id)!.sla).toBe('Late');
      await service.updateTask(MANAGER, created.id, { dueDate: daysFromNow(5) });
      expect((await service.getBundle(MANAGER)).tasks.find((t) => t.id === created.id)!.sla).toBe('Healthy');
    });
  });

  describe('getBundle → pemisahan late vs overdue (BUG-K2/P2.2)', () => {
    it('open task lewat due masuk `overdue`, bukan `late` (KPI on-time tidak terpotong)', async () => {
      await service.createTask(MANAGER, {
        title: 'Open overdue',
        pic: 'Aurel',
        dueDate: daysFromNow(-3),
        status: 'Not started',
      });
      const bundle = await service.getBundle(MANAGER);
      const aurel = bundle.performance.find((p) => p.name === 'Aurel');
      expect(aurel).toBeDefined();
      // Ada open task lewat due → overdue > 0, tapi `late` TIDAK bertambah
      // (late = hanya Done yang selesai lewat due).
      expect(aurel!.overdue).toBeGreaterThanOrEqual(1);
      const lateCount = bundle.tasks.filter(
        (t) => t.pic === 'Aurel' && t.status === 'Done' && t.sla === 'Late',
      ).length;
      expect(aurel!.late).toBe(lateCount);
    });

    it('task Done yang selesai lewat due masuk `late` (KPI ketepatan)', async () => {
      const doneLate = await service.createTask(MANAGER, {
        title: 'Selesai telat',
        pic: 'Aurel',
        dueDate: daysFromNow(-3),
      });
      await service.updateTaskStatus(MANAGER, doneLate.id, 'Done');
      const bundle = await service.getBundle(MANAGER);
      const aurel = bundle.performance.find((p) => p.name === 'Aurel')!;
      expect(aurel.late).toBeGreaterThanOrEqual(1);
      expect(aurel.onTime).toBe(Math.max(aurel.completed - aurel.late, 0));
    });
  });

  describe('updateTask whitelist (BUG-S2/P4.2)', () => {
    it('manager TIDAK bisa menimpa history/assignedBy lewat PATCH', async () => {
      const created = await service.createTask(MANAGER, { title: 'Whitelist', pic: 'Aurel', assignedBy: 'Revi' });
      const historyLen = created.history.length;
      await service.updateTask(MANAGER, created.id, {
        title: 'Ganti judul',
        assignedBy: 'HACKER',
      } as any);
      const updated = (await service.getBundle(MANAGER)).tasks.find((t) => t.id === created.id)!;
      expect(updated.title).toBe('Ganti judul');
      expect(updated.assignedBy).toBe('Revi'); // tidak berubah
      expect(updated.history.length).toBe(historyLen + 1); // hanya 1 entri baru
    });

    it('non-manager hanya bisa ubah startDate & status (title tidak berubah)', async () => {
      const created = await service.createTask(MANAGER, { title: 'Judul asli', pic: 'Aurel' });
      const before = created.title;
      await service.updateTask(AUREL, created.id, { title: 'Judul curian' } as any);
      const bundle = await service.getBundle(AUREL);
      const task = bundle.tasks.find((t) => t.id === created.id)!;
      expect(task.title).toBe(before);

      const done = await service.updateTaskStatus(AUREL, created.id, 'Done');
      expect(done?.status).toBe('Done');
    });
  });

  describe('Visibility & canonicalMember (BUG-C2/P3.2)', () => {
    it('task ber-pic "Revita" terlihat oleh viewer Revi', async () => {
      const created = await service.createTask(MANAGER, { title: 'Untuk Revita', pic: 'Revita' });
      const bundle = await service.getBundle({ email: 'revita@nexerp.id', fullName: 'Revita', roles: [] });
      expect(bundle.tasks.some((t) => t.id === created.id)).toBe(true);
    });

    it('task ber-pic "Zarkasi" terhitung untuk profil Zarka (canonical)', async () => {
      await service.createTask(MANAGER, { title: 'Zarkasi punya', pic: 'Zarkasi' });
      const bundle = await service.getBundle(MANAGER);
      const zarka = bundle.performance.find((p) => p.name === 'Zarka');
      expect(zarka).toBeDefined();
      expect(zarka!.assigned).toBeGreaterThanOrEqual(1);
    });
  });

  describe('normalizeState → migrasi status & completedAt (FASE 0/3)', () => {
    it('status legacy (Backlog) di-map ke 4 status kanonik & completedAt basi dibuang', async () => {
      const state = JSON.parse(await readFile(join(tempDir, 'state.json'), 'utf8'));
      state.tasks.push({
        id: 'LEGACY-1',
        title: 'Task lama Backlog',
        projectId: 'PRJ-2401',
        project: 'Q3 Acquisition Sprint',
        channel: 'General',
        category: 'general_operations',
        brand: 'Dreamlab',
        assignedBy: 'Revi',
        pic: 'Aurel',
        reviewer: 'Revi',
        priority: 'Medium',
        startDate: daysFromNow(-2),
        dueDate: daysFromNow(-2),
        status: 'Backlog',
        sla: 'Healthy',
        estimatedHours: 4,
        actualHours: 0,
        revisionCount: 0,
        checklistDone: 0,
        checklistTotal: 4,
        brief: '',
        tags: [],
        comments: [],
        history: [{ at: new Date().toISOString(), by: 'Revi', to: 'Backlog', note: 'assigned' }],
        attachments: [],
      });
      await writeFile(join(tempDir, 'state.json'), JSON.stringify(state, null, 2), 'utf8');

      const bundle = await service.getBundle(MANAGER);
      const legacy = bundle.tasks.find((t) => t.id === 'LEGACY-1');
      expect(legacy).toBeDefined();
      expect(legacy!.status).toBe('Not started'); // Backlog → Not started
      expect(legacy!.completedAt).toBeUndefined(); // non-Done tidak simpan completedAt
    });
  });
});

