#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migrasi sekali-jalan: default UI theme = PROFESSIONAL untuk SEMUA akun
(tanpa terkecuali), termasuk Rahmat yang sebelumnya ter-set marketing-aesthetic.

Latar: state `marketing-prototype-state.json` punya `uiPreferences[<userId>] =
'marketing-aesthetic'` sehingga akun itu (Rahmat) tampil aesthetic walau
department default sudah professional. Migrasi ini:
  1. Backup state lama ke `...-bak-<tanggal>`.
  2. `settings.appearance.departmentDefaultTheme = 'professional'`.
  3. Semua `uiPreferences[user]` di-set `'professional'` (menimpa aesthetic).
  4. Tulis ulang ATOMIK (tmp + rename) — aman terhadap crash/read bersamaan.

Penggunaan (di server, root folder project):
  python3 scripts/migrate-ui-theme-professional.py
"""
import json
import os
import shutil
import sys
from datetime import datetime

STATE_REL = os.path.join("backend", "data", "marketing-prototype-state.json")


def main() -> int:
    # Amankan output di terminal non-UTF8 (mis. Windows cp1252) — emoji boleh
    # ikut tercetak di server Linux (UTF-8), dan tidak error di mesin lain.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    root = os.getcwd()
    state_path = os.path.join(root, STATE_REL)
    if not os.path.exists(state_path):
        print(f"❌ State tidak ditemukan: {state_path}")
        print("   Jalankan dari root folder project (mis. /root/production-light).")
        return 1

    # 1. Backup
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = f"{state_path}.bak-{stamp}"
    shutil.copy2(state_path, backup_path)
    print(f"✅ Backup: {backup_path}")

    # 2-4. Baca, migrasi, tulis atomik
    with open(state_path, "r", encoding="utf-8") as fh:
        state = json.load(fh)

    changed = []

    # department default → professional
    appearance = state.setdefault("settings", {}).setdefault("appearance", {})
    old_default = appearance.get("departmentDefaultTheme")
    appearance["departmentDefaultTheme"] = "professional"
    if old_default != "professional":
        changed.append(f"departmentDefaultTheme: {old_default!r} -> 'professional'")

    # semua preferensi user → professional (tanpa terkecuali, termasuk Rahmat)
    prefs = state.get("uiPreferences")
    if prefs:
        for user_id, pref in list(prefs.items()):
            if pref != "professional":
                changed.append(f"uiPreferences[{user_id}]: {pref!r} -> 'professional'")
                prefs[user_id] = "professional"
    else:
        state["uiPreferences"] = {}

    tmp_path = f"{state_path}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as fh:
        json.dump(state, fh, ensure_ascii=False, indent=2)
    os.replace(tmp_path, state_path)  # atomik

    if changed:
        print("Perubahan:")
        for c in changed:
            print(f"  • {c}")
    else:
        print("Tidak ada perubahan (semua sudah professional).")

    print("✅ Selesai. Default theme = professional untuk semua akun.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
