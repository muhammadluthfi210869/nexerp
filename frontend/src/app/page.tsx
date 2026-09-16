"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        const isExecutive = user.roles?.some((r: string) =>
          ['SUPER_ADMIN', 'HEAD_OPS', 'FINANCE', 'DIRECTOR'].includes(r)
        );
        if (!isExecutive && user.roles?.some((r: string) => ['DIGIMAR', 'MARKETING'].includes(r))) {
          router.replace('/marketing/management-task/overview');
          return;
        }
      }
    } catch {
      // ignore
    }
    router.replace('/executive/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

