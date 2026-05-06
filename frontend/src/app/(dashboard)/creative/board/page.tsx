import React from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import CreativeBoardClient from "./CreativeBoardClient";

export const dynamic = "force-dynamic";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

async function fetchFromApi(path: string) {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function CreativeBoardPage() {
  const queryClient = new QueryClient();

  // Prefetch tasks from NestJS API (no direct Prisma)
  await queryClient.prefetchQuery({
    queryKey: ["creative-board"],
    queryFn: () => fetchFromApi("/creative/board"),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CreativeBoardClient />
    </HydrationBoundary>
  );
}

