"use client";

import { ReactNode, createContext, useContext } from "react";
import { use } from "react";

interface BrandContextValue {
  brand: string;
  brandName: string;
}

const BrandContext = createContext<BrandContextValue | null>(null);

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used inside BrandLayout");
  return ctx;
}

const BRAND_DISPLAY: Record<string, string> = {
  dreamlab: "Dreamlab",
  toribio: "Toribio",
};

export default function BrandLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ brand: string }>;
}) {
  const { brand } = use(params);
  const brandName = BRAND_DISPLAY[brand] ?? brand;

  return (
    <BrandContext.Provider value={{ brand, brandName }}>
      <div className="w-full">{children}</div>
    </BrandContext.Provider>
  );
}
