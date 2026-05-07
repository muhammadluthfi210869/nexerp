"use client";

import React from "react";

export default function WarehouseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-white">
      {children}
    </div>
  );
}

