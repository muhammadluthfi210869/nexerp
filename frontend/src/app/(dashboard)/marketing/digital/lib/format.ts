// Ponytail: shared formatters. Single source of truth so currency/integer/percent
// formatting stays consistent across all marketing tabs.
const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const integer = new Intl.NumberFormat('id-ID');

const percent = new Intl.NumberFormat('id-ID', {
  style: 'percent',
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? currency.format(n) : '—';
}

export function formatInteger(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? integer.format(n) : '—';
}

export function formatPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(n) ? percent.format(n) : '—';
}

export function formatDate(value: string | null, withTime = false): string {
  if (!value) return 'Belum pernah';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString('id-ID', withTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' },
  );
}
