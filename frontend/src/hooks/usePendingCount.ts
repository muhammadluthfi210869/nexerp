"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export function usePendingCount(intervalMs = 30000) {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await api.get<{ count: number }>("/scm/purchase-approval/pending-count");
        setCount(res.data?.count ?? 0);
      } catch {
        // silently ignore
      }
    };

    fetchCount();
    const id = setInterval(fetchCount, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return count;
}
