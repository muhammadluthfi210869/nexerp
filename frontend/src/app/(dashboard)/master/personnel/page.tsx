import React, { Suspense } from "react";
import { PersonnelRegistry } from "./PersonnelRegistry";

export default async function MasterPersonnelPage() {
  return (
    <Suspense fallback={<PersonnelSkeleton />}>
      <PersonnelDataFetcher />
    </Suspense>
  );
}

async function PersonnelDataFetcher() {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
    const res = await fetch(`${API_URL}/hr/employees`, { cache: "no-store" }).catch(() => null);
    const employees = res?.ok ? await res.json() : [];

    return <PersonnelRegistry initialEmployees={employees as any} initialDepartments={[] as any} />;
  } catch (error) {
    console.error("Personnel Registry Build Error:", error);
    return <PersonnelRegistry initialEmployees={[]} initialDepartments={[]} />;
  }
}

function PersonnelSkeleton() {
  return (
    <div className="p-12 space-y-16 animate-pulse">
      <div className="h-8 w-64 bg-slate-200 rounded-xl" />
      <div className="grid grid-cols-3 gap-6">
        <div className="h-32 bg-slate-200 rounded-2xl" />
        <div className="h-32 bg-slate-200 rounded-2xl" />
        <div className="h-32 bg-slate-200 rounded-2xl" />
      </div>
      <div className="h-96 bg-slate-200 rounded-2xl" />
    </div>
  );
}
