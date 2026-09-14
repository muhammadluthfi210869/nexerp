#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migrasi sekali-jalan: task dengan id `local-<timestamp>` (sisa bug lama) diubah
menjadi id server `TSK-xxxx` yang valid.

Latar: 28/50 task di state produksi punya id `local-...`. Frontend memperlakukan
id `local-` sebagai "belum tersimpan ke server" → tombol Attachment disabled
(tooltip "Simpan task terlebih dahulu") untuk task tsb, untuk SEMUA user
(termasuk manager). Task-task ini TIDAK punya folder attachment (sudah
diverifikasi: hanya TSK-1601 & TSK-1879), sehingga aman diubah id-nya.

Prosedur:
  1. Backup state -> `...-bak-<tanggal>`.
  2. Untuk tiap task id `local-*`: generate id `TSK-<4 digit>` yang UNIK
     (tidak bentrok dengan id TSK- yang sudah ada).
  3. Tulis atomik (tmp + rename).

Penggunaan (di server, root folder project):
  python3 scripts/migrate-local-task-ids.py
"""
import json
import os
import random
import shutil
import sys
from datetime import datetime

STATE_REL = os.path.join("backend", "data", "marketing-prototype-state.json")


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

    root = os.getcwd()
    state_path = os.path.join(root, STATE_REL)
    if not os.path.exists(state_path):
        print(f"State tidak ditemukan: {state_path}")
        return 1

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = f"{state_path}.bak-{stamp}"
    shutil.copy2(state_path, backup_path)
    print(f"Backup: {backup_path}")

    with open(state_path, "r", encoding="utf-8") as fh:
        state = json.load(fh)

    tasks = state.get("tasks", [])
    existing_ids = {str(t.get("id", "")) for t in tasks}

    used = set(existing_ids)
    migrated = 0
    mapping = []
    for t in tasks:
        tid = str(t.get("id", ""))
        if not tid.startswith("local-"):
            continue
        while True:
            new_id = f"TSK-{random.randint(1000, 9999)}"
            if new_id not in used:
                used.add(new_id)
                break
        mapping.append((tid, new_id))
        t["id"] = new_id
        migrated += 1

    tmp_path = f"{state_path}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as fh:
        json.dump(state, fh, ensure_ascii=False, indent=2)
    os.replace(tmp_path, state_path)

    print(f"Task diubah id-nya: {migrated}")
    for old, new in mapping[:10]:
        print(f"  {old} -> {new}")
    if migrated > 10:
        print(f"  ... dan {migrated - 10} lainnya")
    print("Selesai. Semua task sekarang ber-id TSK-.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
