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

export function toLocalDateString(date: Date = new Date()): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function parseLocalDate(value?: string | null): Date {
  if (!value || typeof value !== "string") return new Date(NaN)
  const parts = value.split("-").map(Number)
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return new Date(NaN)
  return new Date(parts[0], parts[1] - 1, parts[2])
}

export function calendarDayDiff(from?: Date | null, to?: Date | null): number {
  if (!from || !to) return 0
  const fromDate = new Date(from)
  const toDate = new Date(to)
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return 0
  fromDate.setHours(0, 0, 0, 0)
  toDate.setHours(0, 0, 0, 0)
  return Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
}

export function formatRupiah(value: number): string {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`
}
