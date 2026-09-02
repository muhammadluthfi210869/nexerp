/**
 * Aturan SLA (Healthy / Watch / Late) dan pembantu tanggal kalender lokal.
 *
 * INI SATU-SATUNYA SUMBER KEBENARAN untuk logika SLA — jangan duplikasi ke
 * service, controller, atau frontend. Badge/UI cukup me-render hasil yang
 * sudah dihitung di sini (via deriveSla), bukan menghitung ulang dari tanggal.
 *
 * Semua fungsi menerima `now: Date` opsional supaya bisa ditest secara
 * deterministik. Default `new Date()` → tidak mengubah perilaku produksi.
 */

export type SlaStatus = 'Healthy' | 'Watch' | 'Late';

export const CANONICAL_TASK_STATUS = ['Not started', 'Working on it', 'Revision', 'Done'] as const;

/** Bentuk minimum task yang dibutuhkan untuk penilaian SLA. */
export interface SlaTaskShape {
  status: string;
  /** Tanggal jatuh tempo "YYYY-MM-DD" (kalender lokal). */
  dueDate: string;
  /** ISO timestamp saat task ditandai Done (jika pernah). */
  completedAt?: string;
}

export function isCanonicalStatus(status: string): boolean {
  return (CANONICAL_TASK_STATUS as readonly string[]).includes(status);
}

/** Tanggal lokal "YYYY-MM-DD". JANGAN pakai toISOString() untuk tanggal bisnis —
 * di timezone UTC+x sebelum 07:00 ia mengembalikan tanggal KEMARIN. */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Parse "YYYY-MM-DD" sebagai tengah malam WAKTU LOKAL (bukan UTC).
 * new Date("YYYY-MM-DD") = UTC tengah malam (07:00 WIB) → menggeser batas
 * SLA. Fungsi ini membuat perbandingan hari kalender selalu lokal. */
export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Selisih HARI KALENDER lokal (tanpa rounding pecahan jam). */
export function calendarDayDiff(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

/** Referensi tanggal untuk penilaian SLA: task yang sudah selesai memakai
 * completedAt (bukan "hari ini") agar task on-time di masa lalu tidak dinilai
 * Late/Watch. Task terbuka memakai hari ini. */
export function slaReferenceDate(task: SlaTaskShape, now: Date = new Date()): Date {
  const isDoneState = task.status === 'Done';
  if (isDoneState && task.completedAt) {
    return parseLocalDate(task.completedAt.slice(0, 10));
  }
  return now;
}

/** SLA berbasis hari kalender lokal:
 *   delta <= 0 → Healthy (tepat waktu / belum lewat)
 *   delta === 1 → Watch  (telat 1 hari)
 *   delta >= 2 → Late   (telat ≥2 hari) */
export function deriveSla(task: SlaTaskShape, now: Date = new Date()): SlaStatus {
  if (!isCanonicalStatus(task.status)) return 'Healthy';
  const due = parseLocalDate(task.dueDate);
  const reference = slaReferenceDate(task, now);
  const delta = calendarDayDiff(reference, due);
  if (delta <= 0) return 'Healthy';
  if (delta === 1) return 'Watch';
  return 'Late';
}

/** Poin kedisiplinan dari SLA (0-100). Task selesai (Done) dinilai dari
 * completedAt vs dueDate (hari kalender lokal); task terbuka dinilai dari
 * hari ini vs dueDate. Menghapus kebutuhan daftar pengecualian hardcode
 * ON_TIME_TASK_IDS — task yang selesai tepat waktu di masa lalu tidak lagi
 * dinilai Late/Watch. */
export function calcDisciplinePoints(task: SlaTaskShape, now: Date = new Date()): number {
  if (!isCanonicalStatus(task.status)) return 0;
  const due = parseLocalDate(task.dueDate);
  const reference = slaReferenceDate(task, now);
  const delta = calendarDayDiff(reference, due); // reference - due (hari kalender)
  const doneState = task.status === 'Done';
  if (doneState) {
    if (delta <= 0) return 100; // selesai ≤ due → tepat waktu
    if (delta === 1) return 80; // telat 1 hari
    if (delta === 2) return 70; // telat 2 hari
    if (delta === 3) return 60; // telat 3 hari
    return 40;
  }
  if (delta <= 0) return 100; // belum lewat / due hari ini
  if (delta === 1) return 80;
  if (delta === 2) return 70;
  if (delta === 3) return 60;
  return 40;
}
