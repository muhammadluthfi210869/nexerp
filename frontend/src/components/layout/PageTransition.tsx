'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="w-full h-full animate-[fadeIn_0.3s_ease-out]">
      {children}
    </div>
  );
}
