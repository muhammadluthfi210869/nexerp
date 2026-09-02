// Single source of truth untuk alias member marketing (dipakai seragam oleh
// Board, backend, dan filter mana pun — lihat BUG-C2/P3.2 di dokumen
// docs/REMEDIATION-MANAGEMENT-TASK.md). Nama kanonik = nama profil backend.
export const MEMBER_ALIASES: Record<string, string[]> = {
  Aurel: ["aurel"],
  Revi: ["revi", "revita", "fadhilah", "nisa"],
  Zarka: ["zarka", "zarkasi"],
  Gusti: ["gusti"],
  Luthfi: ["luthfi"],
  Rahmat: ["rahmat"],
};

export const MEMBER_CANONICAL_NAMES = Object.keys(MEMBER_ALIASES);

/** Kembalikan nama member kanonik ("Revita" → "Revi", "Zarkasi" → "Zarka").
 * Jika tidak dikenal, kembali ke input yang sudah di-trim. */
export function canonicalMember(name: string): string {
  const key = (name ?? "").trim().toLowerCase();
  for (const [canonical, aliases] of Object.entries(MEMBER_ALIASES)) {
    if (canonical.toLowerCase() === key || aliases.includes(key)) return canonical;
  }
  return (name ?? "").trim();
}

/** True jika dua nama member merujuk ke orang yang sama (alias-safe). */
export function sameMember(a: string, b: string): boolean {
  return canonicalMember(a) === canonicalMember(b);
}
