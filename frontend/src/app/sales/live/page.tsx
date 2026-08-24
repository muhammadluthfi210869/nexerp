"use client";

// /sales/live — Real-time lead dashboard page.
// Loads user from localStorage (same pattern as ManagementTask page) and
// renders the LiveLeadDashboard component. In Fase 4 polish: add role
// guard (DIGIMAR/SUPER_ADMIN only), date filters, channel filters.
import { useEffect, useState } from 'react';
import LiveLeadDashboard from './LiveLeadDashboard';

export default function SalesLivePage() {
  const [salesUserId, setSalesUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        setSalesUserId(user?.id ?? 'anonymous');
      } else {
        setSalesUserId('anonymous');
      }
    } catch {
      setSalesUserId('anonymous');
    }
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="border-b border-slate-200 px-4 py-3">
        <h1 className="text-lg font-semibold">Sales Live</h1>
        <p className="text-xs text-slate-500">
          Real-time lead stream from QR scans, WhatsApp clicks, and website forms.
        </p>
      </header>
      {salesUserId && <LiveLeadDashboard salesUserId={salesUserId} />}
    </div>
  );
}