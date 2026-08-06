import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { existsSync, mkdtempSync } from 'fs';
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
// Rahmat = delegated manager (bukan global manager) — scope {gusti, zarka}.
const RAHMAT = { email: 'rahmat@portoaureon.id', fullName: 'Rahmat', roles: [] };

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

  describe('Link & Notes (BUG-L1/L2/L3/L7) → persistensi field deskripsi & URL', () => {
    it('createTask: brief & link TERSIMPAN (bukan hanya tampilan lokal)', async () => {
      const created = await service.createTask(MANAGER, {
        title: 'Task dengan link',
        pic: 'Aurel',
        brief: 'Deskripsi task',
        link: 'https://drive.google.com/deliverable',
      });
      const fromBundle = (await service.getBundle(MANAGER)).tasks.find((t) => t.id === created.id)!;
      expect(fromBundle.brief).toBe('Deskripsi task');
      expect(fromBundle.link).toBe('https://drive.google.com/deliverable');
    });

    it('createTask: `notes` (klien lama) diterima sebagai alias `brief`', async () => {
      const created = await service.createTask(MANAGER, { title: 'Notes alias', pic: 'Aurel', notes: 'Isi catatan lama' });
      const fromBundle = (await service.getBundle(MANAGER)).tasks.find((t) => t.id === created.id)!;
      expect(fromBundle.brief).toBe('Isi catatan lama');
    });

    it('updateTask: PATCH `link` tersimpan (sebelumnya tidak ada field ini)', async () => {
      const created = await service.createTask(MANAGER, { title: 'Update link', pic: 'Aurel' });
      await service.updateTask(MANAGER, created.id, { link: 'https://example.com/asset' });
      const fromBundle = (await service.getBundle(MANAGER)).tasks.find((t) => t.id === created.id)!;
      expect(fromBundle.link).toBe('https://example.com/asset');
    });

    it('updateTask: PATCH `notes` (alias) mengisi `brief` — BUG-L1 diperbaiki', async () => {
      const created = await service.createTask(MANAGER, { title: 'Notes ke brief', pic: 'Aurel' });
      await service.updateTask(MANAGER, created.id, { notes: 'https://link-yang-ditempel-user' });
      const fromBundle = (await service.getBundle(MANAGER)).tasks.find((t) => t.id === created.id)!;
      expect(fromBundle.brief).toBe('https://link-yang-ditempel-user');
    });

    it('updateTask: PATCH `status` tersimpan untuk manager & completedAt terisi saat Done (BUG-L4)', async () => {
      const created = await service.createTask(MANAGER, { title: 'Status via drawer', pic: 'Aurel', status: 'Working on it' });
      const done = await service.updateTask(MANAGER, created.id, { status: 'Done' });
      expect(done?.status).toBe('Done');
      expect(done?.completedAt).toBeDefined(); // sync completedAt jalan
      expect(done?.checklistDone).toBe(done?.checklistTotal);
    });

    it('normalizeState: task lama tanpa field `link` di-backfill menjadi "" (BUG-L7)', async () => {
      const state = JSON.parse(await readFile(join(tempDir, 'state.json'), 'utf8'));
      state.tasks.push({
        id: 'OLD-NO-LINK',
        title: 'Task produksi lama',
        projectId: 'PRJ-2401',
        project: 'Q3 Acquisition Sprint',
        channel: 'General',
        category: 'general_operations',
        brand: 'Dreamlab',
        assignedBy: 'Revi',
        pic: 'Aurel',
        reviewer: 'Revi',
        priority: 'Medium',
        startDate: daysFromNow(-1),
        dueDate: daysFromNow(-1),
        status: 'Done',
        completedAt: `${daysFromNow(-1)}T08:00:00.000Z`,
        sla: 'Healthy',
        estimatedHours: 4,
        actualHours: 4,
        revisionCount: 0,
        checklistDone: 4,
        checklistTotal: 4,
        brief: 'brief lama',
        tags: [],
        comments: [],
        history: [{ at: new Date().toISOString(), by: 'Revi', to: 'Done', note: 'assigned' }],
        attachments: [],
      });
      await writeFile(join(tempDir, 'state.json'), JSON.stringify(state, null, 2), 'utf8');

      const bundle = await service.getBundle(MANAGER);
      const oldTask = bundle.tasks.find((t) => t.id === 'OLD-NO-LINK')!;
      expect(oldTask.link).toBe('');
      expect(oldTask.brief).toBe('brief lama'); // data lama tetap utuh
    });
  });

  describe('Task Attachment (gambar & dokumen — PLAN-TASK-ATTACHMENTS.md)', () => {
    it('addAttachment menyimpan metadata & history (path relatif uploads)', async () => {
      const created = await service.createTask(MANAGER, { title: 'Task attachment', pic: 'Aurel' });
      const filePath = join(tempDir, 'draft.pdf');
      await writeFile(filePath, Buffer.from('%PDF-1.4 test body'));

      const updated = await service.addAttachment(MANAGER, created.id, {
        originalname: 'draft.pdf',
        mimetype: 'application/pdf',
        size: 2048,
        path: filePath,
      });

      expect(updated?.attachments).toHaveLength(1);
      const att = updated!.attachments[0];
      expect(att.id).toMatch(/^ATT-/);
      expect(att.name).toBe('draft.pdf');
      expect(att.type).toBe('application/pdf');
      expect(att.sizeKb).toBe(2);
      expect(att.uploadedBy).toBe('Revi');
      expect(att.createdAt).toBeTruthy();
      // path disimpan relatif ke uploads root (bukan path absolut temp)
      expect(att.path.length).toBeGreaterThan(0);
      expect(att.path).not.toBe(filePath);
      expect(updated?.history.some((h) => h.note.includes('Attachment added'))).toBe(true);
    });

    it('addAttachment menerima gambar PNG valid (magic-byte cocok)', async () => {
      const created = await service.createTask(MANAGER, { title: 'PNG valid', pic: 'Aurel' });
      const filePath = join(tempDir, 'photo.png');
      // Signature PNG: 89 50 4E 47 0D 0A 1A 0A
      await writeFile(filePath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]));

      const updated = await service.addAttachment(MANAGER, created.id, {
        originalname: 'photo.png',
        mimetype: 'image/png',
        size: 128,
        path: filePath,
      });

      expect(updated?.attachments[0].type).toBe('image/png');
      expect(updated?.attachments[0].sizeKb).toBe(0);
    });

    it('addAttachment MENOLAK gambar dengan isi tidak sesuai & file dihapus (BUG-B-03)', async () => {
      const created = await service.createTask(MANAGER, { title: 'Gambar palsu', pic: 'Aurel' });
      const filePath = join(tempDir, 'fake.png');
      await writeFile(filePath, Buffer.from('ini bukan png sebenarnya'));

      await expect(
        service.addAttachment(MANAGER, created.id, {
          originalname: 'fake.png',
          mimetype: 'image/png',
          size: 100,
          path: filePath,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(existsSync(filePath)).toBe(false); // file yang gagal dihapus
      const task = await service.getBundle(MANAGER).then((b) => b.tasks.find((t) => t.id === created.id));
      expect(task?.attachments).toHaveLength(0);
    });

    it('addAttachment untuk task tidak ada → NotFound & file dihapus (BUG-A-05)', async () => {
      const filePath = join(tempDir, 'orphan.pdf');
      await writeFile(filePath, Buffer.from('x'));

      await expect(
        service.addAttachment(MANAGER, 'TSK-NOPE', {
          originalname: 'x.pdf',
          mimetype: 'application/pdf',
          size: 1,
          path: filePath,
        }),
      ).rejects.toThrow(NotFoundException);
      expect(existsSync(filePath)).toBe(false); // tidak ada orphan file
    });

    it('deleteAttachment menghapus metadata + idempotent (BUG-C-05)', async () => {
      const created = await service.createTask(MANAGER, { title: 'Hapus att', pic: 'Aurel' });
      const filePath = join(tempDir, 'doc.pdf');
      await writeFile(filePath, Buffer.from('%PDF'));
      const withAtt = await service.addAttachment(MANAGER, created.id, {
        originalname: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 512,
        path: filePath,
      });
      const attId = withAtt!.attachments[0].id;

      const removed = await service.deleteAttachment(MANAGER, created.id, attId);
      expect(removed?.attachments).toHaveLength(0);
      expect(removed?.history.some((h) => h.note.includes('Attachment removed'))).toBe(true);

      // Idempotent: delete lagi tidak error
      const again = await service.deleteAttachment(MANAGER, created.id, attId);
      expect(again?.attachments).toHaveLength(0);
    });

    it('non-manager TIDAK bisa hapus attachment milik orang lain (Forbidden)', async () => {
      const created = await service.createTask(MANAGER, { title: 'Punya manager', pic: 'Aurel' });
      const filePath = join(tempDir, 'mgr.png');
      await writeFile(filePath, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      const withAtt = await service.addAttachment(MANAGER, created.id, {
        originalname: 'mgr.png',
        mimetype: 'image/png',
        size: 64,
        path: filePath,
      });
      const attId = withAtt!.attachments[0].id;

      await expect(service.deleteAttachment(AUREL, created.id, attId)).rejects.toThrow(ForbiddenException);
    });

    it('pengunggah (non-manager) BISA hapus upload-nya sendiri', async () => {
      const created = await service.createTask(AUREL, { title: 'Punya Aurel', pic: 'Aurel' });
      const filePath = join(tempDir, 'own.pdf');
      await writeFile(filePath, Buffer.from('%PDF'));
      const withAtt = await service.addAttachment(AUREL, created.id, {
        originalname: 'own.pdf',
        mimetype: 'application/pdf',
        size: 64,
        path: filePath,
      });
      const attId = withAtt!.attachments[0].id;

      const removed = await service.deleteAttachment(AUREL, created.id, attId);
      expect(removed?.attachments).toHaveLength(0);
    });

    it('updateTask PATCH `attachments` DIABAIKAN (BUG-A-02)', async () => {
      const created = await service.createTask(MANAGER, { title: 'Jangan timpa', pic: 'Aurel' });
      const updated = await service.updateTask(MANAGER, created.id, {
        attachments: [
          { id: 'ATT-X', name: 'fake.pdf', type: 'application/pdf', sizeKb: 1, path: 'tasks/x/y.pdf', uploadedBy: 'Hacker', createdAt: '' },
        ] as any,
      });
      expect(updated?.attachments ?? []).toHaveLength(0);
    });

    it('createTask selalu attachments: [] walau klien mengirim (BUG-A-02)', async () => {
      const created = await service.createTask(MANAGER, {
        title: 'Injeksi att',
        pic: 'Aurel',
        attachments: [
          { id: 'ATT-X', name: 'x', type: 'x', sizeKb: 1, path: 'x', uploadedBy: 'x', createdAt: '' },
        ] as any,
      });
      expect(created.attachments).toEqual([]);
    });

    it('normalizeState: attachment legacy di-backfill id DETERMINISTIK & path "" (BUG-A-03)', async () => {
      const state = JSON.parse(await readFile(join(tempDir, 'state.json'), 'utf8'));
      state.tasks[0].attachments = [{ name: 'brief.pdf', type: 'application/pdf', sizeKb: 244 }];
      await writeFile(join(tempDir, 'state.json'), JSON.stringify(state, null, 2), 'utf8');

      const bundle1 = await service.getBundle(MANAGER);
      const bundle2 = await service.getBundle(MANAGER);
      const a1 = bundle1.tasks.find((t) => t.id === state.tasks[0].id)!.attachments[0];
      const a2 = bundle2.tasks.find((t) => t.id === state.tasks[0].id)!.attachments[0];
      expect(a1.id).toMatch(/^ATT-legacy-/);
      expect(a1.id).toBe(a2.id); // deterministik antar-read (tidak berubah)
      expect(a1.path).toBe('');
      expect(a1.uploadedBy).toBe('System');
      expect(a1.createdAt).toBe('');
    });
  });

  describe('Delegated Manager — Rahmat → Gusti & Zarkasi (PLAN-RAHMAT-DELEGATED-MANAGER.md)', () => {
    it('bundle Rahmat: viewer.managedMembers = [gusti, zarka], isManager = false', async () => {
      const bundle = await service.getBundle(RAHMAT);
      expect(bundle.viewer.name).toBe('Rahmat');
      expect(bundle.viewer.isManager).toBe(false);
      expect(bundle.viewer.managedMembers).toEqual(['gusti', 'zarka']);
    });

    it('Rahmat dikenali lewat email rahmat@... walau fullName kosong (C-01)', async () => {
      const bundle = await service.getBundle({ email: 'rahmat@portoaureon.id', roles: [] });
      expect(bundle.viewer.name).toBe('Rahmat');
      expect(bundle.viewer.managedMembers).toEqual(['gusti', 'zarka']);
    });

    it('Rahmat BISA membuat task untuk Gusti (delegated create)', async () => {
      const created = await service.createTask(RAHMAT, { title: 'Task untuk Gusti', pic: 'Gusti' });
      expect(created.pic).toBe('Gusti');
      expect(created.assignedBy).toBe('Rahmat');
      expect(created.reviewer).toBe('Revi'); // reviewer tetap head of marketing
    });

    it('Rahmat BISA membuat task untuk Zarkasi (alias → scope zarka)', async () => {
      const created = await service.createTask(RAHMAT, { title: 'Task untuk Zarkasi', pic: 'Zarkasi' });
      expect(created.pic).toBe('Zarkasi');
    });

    it('Rahmat TIDAK bisa membuat task untuk Aurel (di luar scope) → 403', async () => {
      await expect(
        service.createTask(RAHMAT, { title: 'Coba Aurel', pic: 'Aurel' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Rahmat melihat task Gusti & Zarka, tetapi TIDAK melihat task Aurel', async () => {
      await service.createTask(MANAGER, { title: 'Punya Gusti', pic: 'Gusti' });
      await service.createTask(MANAGER, { title: 'Punya Zarka', pic: 'Zarka' });
      await service.createTask(MANAGER, { title: 'Punya Aurel', pic: 'Aurel' });
      const bundle = await service.getBundle(RAHMAT);
      const titles = bundle.tasks.map((t) => t.title);
      expect(titles).toContain('Punya Gusti');
      expect(titles).toContain('Punya Zarka');
      expect(titles).not.toContain('Punya Aurel');
    });

    it('Rahmat bisa FULL-EDIT task Gusti (title/dueDate/brief/link tersimpan)', async () => {
      const gustiTask = await service.createTask(MANAGER, { title: 'Judul lama', pic: 'Gusti' });
      const updated = await service.updateTask(RAHMAT, gustiTask.id, {
        title: 'Judul baru oleh Rahmat',
        dueDate: daysFromNow(5),
        brief: 'Deskripsi baru',
        link: 'https://drive.google.com/deliverable',
      });
      expect(updated?.title).toBe('Judul baru oleh Rahmat');
      expect(updated?.dueDate).toBe(daysFromNow(5));
      expect(updated?.brief).toBe('Deskripsi baru');
      expect(updated?.link).toBe('https://drive.google.com/deliverable');
    });

    it('Rahmat TIDAK bisa full-edit task Aurel (title diabaikan — di luar scope)', async () => {
      const aurelTask = await service.createTask(MANAGER, { title: 'Judul Aurel', pic: 'Aurel' });
      const updated = await service.updateTask(RAHMAT, aurelTask.id, { title: 'Coba ganti' } as any);
      expect(updated?.title).toBe('Judul Aurel');
    });

    it('Rahmat TIDAK bisa memindahkan pic task Gusti ke Aurel (scope leak guard) → 403', async () => {
      const gustiTask = await service.createTask(MANAGER, { title: 'Task Gusti', pic: 'Gusti' });
      await expect(service.updateTask(RAHMAT, gustiTask.id, { pic: 'Aurel' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('Rahmat tetap member biasa untuk task SENDIRI (title tidak bisa diubah)', async () => {
      const own = await service.createTask(RAHMAT, { title: 'Task sendiri', pic: 'Rahmat' });
      const updated = await service.updateTask(RAHMAT, own.id, { title: 'Ganti judul sendiri' } as any);
      expect(updated?.title).toBe('Task sendiri');
    });

    it('Rahmat BISA hapus task Gusti (delegated delete)', async () => {
      const gustiTask = await service.createTask(MANAGER, { title: 'Hapus oleh Rahmat', pic: 'Gusti' });
      const result = await service.deleteTask(RAHMAT, gustiTask.id);
      expect(result).toBe(true);
    });

    it('Rahmat TIDAK bisa hapus task Aurel → 403', async () => {
      const aurelTask = await service.createTask(MANAGER, { title: 'Jangan hapus', pic: 'Aurel' });
      await expect(service.deleteTask(RAHMAT, aurelTask.id)).rejects.toThrow(ForbiddenException);
    });

    it('Rahmat BISA hapus attachment pada task Gusti (delegated attachment)', async () => {
      const gustiTask = await service.createTask(MANAGER, { title: 'Att Gusti', pic: 'Gusti' });
      const filePath = join(tempDir, 'gusti-doc.pdf');
      await writeFile(filePath, Buffer.from('%PDF'));
      const withAtt = await service.addAttachment(MANAGER, gustiTask.id, {
        originalname: 'gusti-doc.pdf',
        mimetype: 'application/pdf',
        size: 64,
        path: filePath,
      });
      const attId = withAtt!.attachments[0].id;
      const removed = await service.deleteAttachment(RAHMAT, gustiTask.id, attId);
      expect(removed?.attachments).toHaveLength(0);
    });

    it('Rahmat melihat notifikasi task Gusti yang ia buat (recipient dalam scope)', async () => {
      await service.createTask(RAHMAT, { title: 'Notif gusti', pic: 'Gusti' });
      const bundle = await service.getBundle(RAHMAT);
      expect(bundle.notifications.some((n) => n.recipient === 'Gusti')).toBe(true);
    });

    it('REGRESI: Aurel tetap TIDAK bisa create/hapus task Gusti → 403', async () => {
      await expect(
        service.createTask(AUREL, { title: 'Coba Gusti', pic: 'Gusti' }),
      ).rejects.toThrow(ForbiddenException);
      const gustiTask = await service.createTask(MANAGER, { title: 'Gusti punya', pic: 'Gusti' });
      await expect(service.deleteTask(AUREL, gustiTask.id)).rejects.toThrow(ForbiddenException);
    });
  });
});

