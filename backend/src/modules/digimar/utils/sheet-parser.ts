// ── Utility: parse raw string[][] from Google Sheets into typed values ──

/**
 * Parse a numeric value from a cell.
 * Handles both UNFORMATTED_VALUE (JS number) and FORMATTED_VALUE (string with comma as decimal).
 * Returns null for empty cells, 'N/A', '#DIV/0!', '-' etc.
 */
export function num(val: unknown): number | null {
  if (val === undefined || val === null) return null;

  // If already a number, return it directly
  if (typeof val === 'number') return isNaN(val) ? null : val;

  const trimmed = String(val).trim();
  if (trimmed === '' || trimmed === '-' || trimmed === 'N/A' ||
      trimmed === '#DIV/0!' || trimmed === '#REF!' || trimmed === '#VALUE!') {
    return null;
  }
  // Indonesian locale: comma = decimal separator, remove dots (thousands)
  const cleaned = trimmed.replace(/\./g, '').replace(/,/g, '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse a percentage value.
 * Handles both UNFORMATTED_VALUE (JS number) and FORMATTED_VALUE (string with comma as decimal).
 * Returns decimal (e.g. 0.266 for "26.6%")
 */
export function pct(val: unknown): number | null {
  if (val === undefined || val === null) return null;

  // If already a number, return it directly (already a decimal fraction)
  if (typeof val === 'number') return isNaN(val) ? null : val;

  const trimmed = String(val).trim();
  if (trimmed === '' || trimmed === '-' || trimmed === 'N/A' || trimmed === '#DIV/0!') {
    return null;
  }
  // Remove % sign
  const withoutPct = trimmed.replace(/%/g, '');
  // Indonesian locale: comma = decimal separator, remove dots (thousands)
  const cleaned = withoutPct.replace(/\./g, '').replace(/,/g, '.');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return null;
  // If > 1, it's a percentage value (e.g. "26.6" = 26.6%) → divide by 100
  if (parsed > 1) return parsed / 100;
  return parsed;
}

/**
 * Safe parse string cell
 */
export function str(val: string | undefined | null): string {
  if (val === undefined || val === null) return '';
  const trimmed = val.toString().trim();
  return trimmed === '-' || trimmed === 'N/A' ? '' : trimmed;
}

/**
 * Find row index by matching first column value (case-insensitive)
 */
export function findRowByMonth(rows: string[][], month: string): number | null {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].trim().toLowerCase() === month.toLowerCase()) {
      return i;
    }
  }
  return null;
}

/**
 * Find all rows for a given month
 */
export function findRowsByMonth(rows: string[][], month: string): string[][] {
  return rows.filter(r => r[0] && r[0].trim().toLowerCase() === month.toLowerCase());
}
