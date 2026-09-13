"use client";

import React, { use, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import BrandWorkspace from "../workspace/BrandWorkspace";

function BrandPageContent({ brand }: { brand: string }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || undefined;
  const channel = searchParams.get("channel") || undefined;
  const mode = (searchParams.get("mode") as "planner" | "report" | undefined) || undefined;

  return (
    <BrandWorkspace
      initialBrandSlug={brand}
      initialTab={tab}
      initialChannel={channel}
      initialMode={mode}
    />
  );
}

export default function BrandOverviewPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = use(params);

  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center text-sm font-semibold text-slate-400">
          Memuat Workspace...
        </div>
      }
    >
      <BrandPageContent brand={brand} />
    </Suspense>
  );
}
