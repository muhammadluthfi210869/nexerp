import React, { Suspense } from "react";
import { PersonnelRegistry } from "./PersonnelRegistry";

export default function MasterPersonnelPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 font-mono text-xs">Memuat Master Personel & Pengguna...</div>}>
      <PersonnelRegistry />
    </Suspense>
  );
}
