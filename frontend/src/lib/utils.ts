import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value)
}

/** Tanggal lokal "YYYY-MM-DD". JANGAN pakai toISOString() untuk tanggal bisnis —
 * di timezone UTC+x sebelum 07:00 ia mengembalikan tanggal KEMARIN. */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/** Parse "YYYY-MM-DD" sebagai tengah malam WAKTU LOKAL (bukan UTC).
 * new Date("YYYY-MM-DD") = UTC tengah malam (07:00 WIB) → menggeser batas
 * "Watch"/"Late" ~12 jam. Fungsi ini membuat perbandingan hari kalender lokal. */
export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number)
  return new Date(y, m - 1, d)
}

/** Selisih HARI KALENDER lokal (tanpa rounding pecahan jam). */
export function calendarDayDiff(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
}

/** Selisih hari kalender antara tanggal "YYYY-MM-DD" dan "hari ini" (lokal).
 * Positif = sudah lewat, 0 = hari ini, negatif = belum lewat. */
export function daysOverdue(dueDate: string, today = toLocalDateString()): number {
  if (!dueDate) return 0
  return calendarDayDiff(parseLocalDate(today), parseLocalDate(dueDate))
}


