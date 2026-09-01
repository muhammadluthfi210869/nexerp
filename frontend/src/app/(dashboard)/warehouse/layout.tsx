"use client";

import React from "react";

export default function WarehouseLayout({ children }: { children: React.ReactNode }) {
 // Canonical: transparent container so warehouse pages render directly
 // on the app background (--app-bg), not on a page-level white sheet.
 // Per-page structure (tabs, KPIs, filters, tables) is preserved.
 return (
 <div className="min-h-full">
 {children}
 </div>
 );
}

