import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import CreativeBoardClient from "./CreativeBoardClient";

export const dynamic = "force-dynamic";

const API_URL = typeof window !== "undefined"
  ? "/api"
  : (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://backend:3001/v1");

async function fetchFromApi(path: string) {
  try {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const res = await fetch(`${API_URL}${cleanPath}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function CreativeBoardPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["creative-board"],
    queryFn: async () => {
      const body = await fetchFromApi("/creative/board");
      return Array.isArray(body) ? body : (body.data ?? []);
    },
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CreativeBoardClient />
    </HydrationBoundary>
  );
}
