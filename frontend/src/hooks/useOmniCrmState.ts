'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const STORAGE_KEY = 'erp_omnicrm_state_v1';

interface OmniCrmResponse {
  state: unknown | null;
  version: number | null;
}

/**
 * Read/write the Omni CRM state to the backend.
 *
 * Strategy: keep OmniCrmClient unchanged (it still uses localStorage).
 * This hook bridges:
 *   - On mount: GET backend → if backend has state, write it to localStorage.
 *                If only localStorage exists, POST it to backend once.
 *   - On localStorage change: debounce 800ms then PUT to backend.
 *
 * Same-tab writes are detected via a setItem monkey-patch (storage event
 * doesn't fire in the originating tab). Cross-tab writes still trigger via
 * the storage event listener as a fallback.
 */
export function useOmniCrmStateSync() {
  const qc = useQueryClient();
  const lastSavedVersionRef = useRef<number | null>(null);
  const saveStateRef = useRef<(state: unknown) => void>(() => {});

  const { data, isPending } = useQuery({
    queryKey: ['marketing', 'omni-crm', 'state'],
    queryFn: async () => {
      const res = await api.get<OmniCrmResponse>('/marketing/omni-crm/state');
      return res.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const { mutate: saveState } = useMutation({
    mutationFn: async (state: unknown) => {
      const res = await api.put<OmniCrmResponse>('/marketing/omni-crm/state', { state });
      return res.data;
    },
    onSuccess: (data) => {
      lastSavedVersionRef.current = data.version;
      qc.setQueryData(['marketing', 'omni-crm', 'state'], data);
    },
  });

  // Keep a ref to saveState so the monkey-patch (set up once) always calls
  // the latest version without needing to re-bind on every render.
  saveStateRef.current = saveState;

  // Hydration effect: on mount, sync backend ↔ localStorage once.
  useEffect(() => {
    if (isPending || !data) return;
    const localRaw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;

    if (data.state === null && localRaw) {
      // Backend empty, localStorage has data → migrate up.
      try {
        saveState(JSON.parse(localRaw));
      } catch {
        // ignore parse errors
      }
    } else if (data.state && !localRaw) {
      // Backend has data, localStorage empty → hydrate.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.state));
      lastSavedVersionRef.current = data.version;
    } else if (data.state && localRaw) {
      // Both exist → trust backend (last writer).
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.state));
      lastSavedVersionRef.current = data.version;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPending, data?.state === null, data?.version]);

  // Same-tab + cross-tab sync via localStorage interceptor + storage event.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleSave = (raw: string) => {
      // eslint-disable-next-line no-console
      console.log('[omni-sync] scheduleSave', raw?.slice(0, 80));
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          // eslint-disable-next-line no-console
          console.log('[omni-sync] firing saveState for', raw?.slice(0, 80));
          saveStateRef.current(JSON.parse(raw));
        } catch {
          // ignore
        }
      }, 800);
    };

    // 1. Same-tab: monkey-patch localStorage.setItem. The `storage` event
    //    does NOT fire in the originating tab, so without this patch, writes
    //    from OmniCrmClient never reach the backend.
    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
    window.localStorage.setItem = function patched(key: string, value: string) {
      // eslint-disable-next-line no-console
      console.log('[omni-sync] setItem', key, value?.slice(0, 80));
      originalSetItem(key, value);
      if (key === STORAGE_KEY && value) {
        scheduleSave(value);
      }
    };

    // 2. Cross-tab: storage event listener (still works across windows).
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      scheduleSave(e.newValue);
    };
    window.addEventListener('storage', handler);

    return () => {
      window.localStorage.setItem = originalSetItem;
      window.removeEventListener('storage', handler);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return { isLoading: isPending };
}
