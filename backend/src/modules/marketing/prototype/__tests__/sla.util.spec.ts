import {
  calcDisciplinePoints,
  calendarDayDiff,
  deriveSla,
  parseLocalDate,
  slaReferenceDate,
  toLocalDateString,
  type SlaTaskShape,
  type SlaStatus,
} from '../sla.util';

/**
 * SEMUA aturan SLA diuji di sini secara deterministik. Setiap kasus memakai
 * `now` eksplisit (5 Agustus 2026, kalender lokal) sehingga hasil test tidak
 * berubah tergantung tanggal server dijalankan.
 *
 * Kasus-kasus di bawah merekam regresi yang pernah terjadi di produksi:
 *  - task Done tepat di due date (komit eaa1f6b, 5d42f87) tidak boleh Late/Watch
 *  - task on-time di masa lalu tidak boleh dinilai ulang sebagai Late/Watch
 *  - status non-kanonik harus defensif (Healthy / 0 poin)
 */
const NOW = new Date(2026, 7, 5); // 5 Agustus 2026 (kalender lokal)
const FIXED_ISO = 'T08:00:00.000Z'; // jam selesai arbitrer — hanya tanggal yang dipakai

/** Tanggal "YYYY-MM-DD" relatif terhadap NOW (kalender lokal). */
function iso(daysFromNow: number): string {
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() + daysFromNow);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function task(partial: Partial<SlaTaskShape> & { dueDate: string }): SlaTaskShape {
  return { status: 'Not started', completedAt: undefined, ...partial };
}

describe('deriveSla — task yang sudah selesai (Done)', () => {
  const cases: Array<{ name: string; task: SlaTaskShape; expected: SlaStatus }> = [
    {
      name: 'selesai jauh SEBELUM due → Healthy',
      task: task({ status: 'Done', dueDate: iso(0), completedAt: `${iso(-5)}${FIXED_ISO}` }),
      expected: 'Healthy',
    },
    {
      name: 'selesai TEPAT di due date → Healthy (regresi 5d42f87)',
      task: task({ status: 'Done', dueDate: iso(0), completedAt: `${iso(0)}${FIXED_ISO}` }),
      expected: 'Healthy',
    },
    {
      name: 'selesai 1 hari lewat due → Watch',
      task: task({ status: 'Done', dueDate: iso(0), completedAt: `${iso(1)}${FIXED_ISO}` }),
      expected: 'Watch',
    },
    {
      name: 'selesai 2 hari lewat due → Late',
      task: task({ status: 'Done', dueDate: iso(0), completedAt: `${iso(2)}${FIXED_ISO}` }),
      expected: 'Late',
    },
    {
      name: 'selesai 10 hari lewat due → Late',
      task: task({ status: 'Done', dueDate: iso(0), completedAt: `${iso(10)}${FIXED_ISO}` }),
      expected: 'Late',
    },
    {
      name: 'task on-time di MASA LALU (completedAt = due 30 hari lalu) tetap Healthy walau now jauh',
      task: task({ status: 'Done', dueDate: iso(-30), completedAt: `${iso(-30)}${FIXED_ISO}` }),
      expected: 'Healthy',
    },
    {
      name: 'task Watch di masa lalu (completedAt 1 hari lewat due) tetap Watch walau now jauh',
      task: task({ status: 'Done', dueDate: iso(-30), completedAt: `${iso(-29)}${FIXED_ISO}` }),
      expected: 'Watch',
    },
    {
      name: 'task Done TANPA completedAt → dinilai dari now vs due',
      task: task({ status: 'Done', dueDate: iso(-1) }),
      expected: 'Watch',
    },
  ];

  it.each(cases)('$name', ({ task: t, expected }) => {
    expect(deriveSla(t, NOW)).toBe(expected);
  });
});

describe('deriveSla — task terbuka (belum Done)', () => {
  const cases: Array<{ name: string; dueDate: string; expected: SlaStatus }> = [
    { name: 'due masih jauh → Healthy', dueDate: iso(5), expected: 'Healthy' },
    { name: 'due HARI INI → Healthy', dueDate: iso(0), expected: 'Healthy' },
    { name: 'lewat due 1 hari → Watch', dueDate: iso(-1), expected: 'Watch' },
    { name: 'lewat due 2 hari → Late', dueDate: iso(-2), expected: 'Late' },
    { name: 'lewat due 7 hari → Late', dueDate: iso(-7), expected: 'Late' },
  ];

  it.each(cases)('$name → $expected', ({ dueDate, expected }) => {
    expect(deriveSla(task({ status: 'Not started', dueDate }), NOW)).toBe(expected);
  });
});

describe('deriveSla — status non-kanonik (defensif)', () => {
  it('status asing apa pun → Healthy, tidak melempar', () => {
    expect(deriveSla(task({ status: 'Cancelled', dueDate: iso(-10) }), NOW)).toBe('Healthy');
    expect(deriveSla(task({ status: 'Backlog', dueDate: iso(-10) }), NOW)).toBe('Healthy');
    expect(deriveSla(task({ status: 'To Do', dueDate: iso(-10) }), NOW)).toBe('Healthy');
  });
});

describe('calcDisciplinePoints', () => {
  const cases: Array<{ name: string; status: SlaTaskShape['status']; dueDate: string; completedAt?: string; expected: number }> = [
    { name: 'Done tepat waktu → 100', status: 'Done', dueDate: iso(0), completedAt: `${iso(0)}${FIXED_ISO}`, expected: 100 },
    { name: 'Done telat 1 hari → 80', status: 'Done', dueDate: iso(0), completedAt: `${iso(1)}${FIXED_ISO}`, expected: 80 },
    { name: 'Done telat 2 hari → 70', status: 'Done', dueDate: iso(0), completedAt: `${iso(2)}${FIXED_ISO}`, expected: 70 },
    { name: 'Done telat 3 hari → 60', status: 'Done', dueDate: iso(0), completedAt: `${iso(3)}${FIXED_ISO}`, expected: 60 },
    { name: 'Done telat 4 hari → 40', status: 'Done', dueDate: iso(0), completedAt: `${iso(4)}${FIXED_ISO}`, expected: 40 },
    { name: 'Open lewat 1 hari → 80', status: 'Working on it', dueDate: iso(-1), expected: 80 },
    { name: 'Open lewat 2 hari → 70', status: 'Working on it', dueDate: iso(-2), expected: 70 },
    { name: 'Open due hari ini → 100', status: 'Working on it', dueDate: iso(0), expected: 100 },
    { name: 'Status non-kanonik → 0', status: 'Cancelled', dueDate: iso(-10), expected: 0 },
  ];

  it.each(cases)('$name → $expected', ({ status, dueDate, completedAt, expected }) => {
    expect(calcDisciplinePoints(task({ status, dueDate, completedAt }), NOW)).toBe(expected);
  });
});

describe('calendarDayDiff — perbandingan HARI KALENDER lokal (bug timezone)', () => {
  const cases: Array<{ name: string; from: string; to: string; expected: number }> = [
    { name: 'hari yang sama → 0', from: '2026-08-05', to: '2026-08-05', expected: 0 },
    { name: 'besok → 1', from: '2026-08-06', to: '2026-08-05', expected: 1 },
    { name: 'kemarin → -1', from: '2026-08-04', to: '2026-08-05', expected: -1 },
    { name: 'lintas bulan (31 Jul → 1 Aug) → 1', from: '2026-08-01', to: '2026-07-31', expected: 1 },
    { name: 'lintas tahun (1 Jan → 31 Des) → 1', from: '2026-01-01', to: '2025-12-31', expected: 1 },
    { name: '7 hari → 7', from: '2026-08-12', to: '2026-08-05', expected: 7 },
  ];

  it.each(cases)('$name', ({ from, to, expected }) => {
    expect(calendarDayDiff(parseLocalDate(from), parseLocalDate(to))).toBe(expected);
  });
});

describe('parseLocalDate — selalu tengah malam LOKAL, bukan UTC', () => {
  it('mengembalikan komponen tanggal lokal yang sama persis', () => {
    const d = parseLocalDate('2026-08-05');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7); // Agustus (0-index)
    expect(d.getDate()).toBe(5);
  });

  it('jamnya nol lokal — membuktikan bukan "new Date(string)" (UTC)', () => {
    const d = parseLocalDate('2026-08-05');
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
});

describe('toLocalDateString', () => {
  it('memformat tanggal lokal menjadi YYYY-MM-DD', () => {
    expect(toLocalDateString(new Date(2026, 7, 5, 23, 59))).toBe('2026-08-05');
    expect(toLocalDateString(new Date(2026, 0, 1))).toBe('2026-01-01');
  });
});

describe('slaReferenceDate', () => {
  it('task Done memakai completedAt (historis) bukan now', () => {
    const t = task({ status: 'Done', dueDate: iso(0), completedAt: `${iso(-3)}${FIXED_ISO}` });
    expect(slaReferenceDate(t, NOW).getDate()).toBe(NOW.getDate() - 3);
  });

  it('task Done tanpa completedAt memakai now', () => {
    const t = task({ status: 'Done', dueDate: iso(0) });
    expect(slaReferenceDate(t, NOW).getTime()).toBe(NOW.getTime());
  });

  it('task terbuka memakai now', () => {
    const t = task({ status: 'Working on it', dueDate: iso(0) });
    expect(slaReferenceDate(t, NOW).getTime()).toBe(NOW.getTime());
  });
});
