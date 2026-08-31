export function formatOperationalCurrency(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) return "—";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue);
}

export function formatOperationalCompactCurrency(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) return "—";
  if (numericValue === 0) return "Rp 0";
  if (Math.abs(numericValue) >= 1_000_000_000) return `Rp ${(numericValue / 1_000_000_000).toFixed(2)} M`;
  if (Math.abs(numericValue) >= 1_000_000) return `Rp ${(numericValue / 1_000_000).toFixed(1)} jt`;
  if (Math.abs(numericValue) >= 1_000) return `Rp ${(numericValue / 1_000).toFixed(0)}k`;
  return `Rp ${numericValue.toLocaleString("id-ID")}`;
}

export function formatOperationalNumber(value: unknown) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) return "—";
  return new Intl.NumberFormat("id-ID").format(numericValue);
}

export function formatOperationalDate(value: unknown, options?: Intl.DateTimeFormatOptions) {
  if (value === null || value === undefined || value === "") return "—";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", options).format(date);
}
