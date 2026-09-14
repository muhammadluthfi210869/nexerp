'use client';

import { useEffect, useRef } from 'react';

/** Authenticated SSE client with reconnect. The normal 30 second refresh is
 * intentionally retained as a fallback for proxies and mobile networks. */
export function useCrmRealtime(onEvent: () => void): void {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    let stopped = false;
    let controller: AbortController | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => callbackRef.current(), 250);
    };

    const connect = async () => {
      const token = localStorage.getItem('token');
      if (!token || stopped) return;
      controller = new AbortController();
      try {
        const response = await fetch('/api/crm/events', {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error(`CRM stream HTTP ${response.status}`);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!stopped) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';
          for (const frame of frames) {
            if (frame.split('\n').some((line) => line.startsWith('data:'))) scheduleRefresh();
          }
        }
      } catch (error) {
        if (!stopped && !(error instanceof DOMException && error.name === 'AbortError')) {
          retryTimer = setTimeout(connect, 3_000);
        }
      }
    };

    void connect();
    return () => {
      stopped = true;
      controller?.abort();
      if (retryTimer) clearTimeout(retryTimer);
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, []);
}
