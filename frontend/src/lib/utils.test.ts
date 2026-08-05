import { describe, expect, it } from "vitest";

import {
  calendarDayDiff,
  daysOverdue,
  parseLocalDate,
  toLocalDateString,
} from "./utils";

describe("toLocalDateString — tanggal bisnis LOKAL, bukan UTC (BUG-D1/P1.1)", () => {
  it("memformat tanggal lokal menjadi YYYY-MM-DD", () => {
    // new Date(2026, 7, 5, 23, 59) — jam 23:59 LOKAL tetap tanggal 5 (bukan 4/5 UTC)
    expect(toLocalDateString(new Date(2026, 7, 5, 23, 59))).toBe("2026-08-05");
    expect(toLocalDateString(new Date(2026, 0, 1, 0, 0))).toBe("2026-01-01");
  });

  it("tidak pernah bergeser ke hari sebelumnya sebelum 07:00 (regresi UTC)", () => {
    // Di WIB, new Date() di 2026-08-05T00:30+07:00 = 2026-08-04T17:30Z.
    // toLocalDateString harus tetap 2026-08-05 (lokal), bukan 2026-08-04.
    const d = new Date(2026, 7, 5, 0, 30); // 00:30 waktu lokal
    expect(toLocalDateString(d)).toBe("2026-08-05");
  });
});

describe("parseLocalDate + calendarDayDiff (BUG-D3/P1.3)", () => {
  it("parseLocalDate membaca komponen tanggal sebagai LOKAL", () => {
    const d = parseLocalDate("2026-08-05");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7);
    expect(d.getDate()).toBe(5);
    expect(d.getHours()).toBe(0);
  });

  it("calendarDayDiff menghitung hari kalender tanpa rounding pecahan jam", () => {
    // 31 Jul → 1 Aug = 1 hari (lintas bulan)
    expect(calendarDayDiff(parseLocalDate("2026-08-01"), parseLocalDate("2026-07-31"))).toBe(1);
    expect(calendarDayDiff(parseLocalDate("2026-08-05"), parseLocalDate("2026-08-05"))).toBe(0);
    expect(calendarDayDiff(parseLocalDate("2026-08-04"), parseLocalDate("2026-08-05"))).toBe(-1);
  });
});

describe("daysOverdue", () => {
  it("0 jika belum lewat / hari ini; positif jika lewat", () => {
    const today = "2026-08-05";
    expect(daysOverdue("2026-08-05", today)).toBe(0);
    expect(daysOverdue("2026-08-06", today)).toBe(-1);
    expect(daysOverdue("2026-08-04", today)).toBe(1);
    expect(daysOverdue("2026-08-02", today)).toBe(3);
  });
});
