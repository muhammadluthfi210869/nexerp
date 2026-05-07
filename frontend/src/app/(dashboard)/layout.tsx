"use client";
export const dynamic = 'force-dynamic';

import React from "react";
import { SidebarWrapper } from "@/components/layout/SidebarWrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-base min-h-screen">
      <SidebarWrapper />
      
      <main 
        className="flex-1 min-h-screen bg-base overflow-x-hidden"
        style={{ 
          marginLeft: 'var(--sidebar-width)',
        }}
      >
        <div 
          className="max-w-[1600px] mx-auto"
          style={{ 
            padding: 'var(--page-py) var(--page-px) var(--page-pb)',
            minHeight: '100vh',
          }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
