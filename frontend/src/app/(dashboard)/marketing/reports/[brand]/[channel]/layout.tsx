"use client";

import { ReactNode, createContext, useContext } from "react";
import { use } from "react";

interface BrandChannelContextValue {
  brand: string;
  channel: string;
}

const BrandChannelContext = createContext<BrandChannelContextValue | null>(null);

export function useBrandChannel() {
  const ctx = useContext(BrandChannelContext);
  if (!ctx) throw new Error("useBrandChannel must be used inside BrandChannelLayout");
  return ctx;
}

export default function BrandChannelLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ brand: string; channel: string }>;
}) {
  const { brand, channel } = use(params);

  return (
    <BrandChannelContext.Provider value={{ brand, channel }}>
      <div className="w-full">{children}</div>
    </BrandChannelContext.Provider>
  );
}
