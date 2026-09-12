import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock MSW server BEFORE importing api so axios uses real adapter through MSW
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

// NOTE: api module re-imported per-test in beforeEach to reset module-scoped
// isRedirecting flag. Top-level import below is for the type only.
import type { api as ApiType } from './api';

describe('api 401 interceptor — auto-refresh loop fix', () => {
  let api: typeof ApiType;
  let originalLocation: Location;

  beforeEach(async () => {
    // ponytail: api.ts module-scoped `isRedirecting` flag persists across
    // tests. Re-import the module fresh each test to reset state.
    vi.resetModules();
    const mod = await import('./api');
    api = mod.api;

    localStorage.clear();
    sessionStorage.clear();
    document.cookie = 'token=; path=/; max-age=0;';

    // Mock window.location to capture redirect calls
    originalLocation = window.location;
    const mockLocation = {
      ...originalLocation,
      pathname: '/executive/dashboard',
      href: originalLocation.href,
      replace: vi.fn(),
      assign: vi.fn(),
      reload: vi.fn(),
    };
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: mockLocation,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: originalLocation,
    });
    vi.useRealTimers();
  });

  it('redirects to /login on first 401', async () => {
    server.use(
      http.get('*://*/api/test-401', () =>
        new HttpResponse(null, { status: 401 })
      )
    );

    await expect(api.get('/test-401')).rejects.toBeTruthy();

    expect((window.location as any).replace).toHaveBeenCalledWith('/login');
  });

  it('clears localStorage token and user on 401', async () => {
    localStorage.setItem('token', 'stale-token');
    localStorage.setItem('user', JSON.stringify({ id: 'u1' }));
    document.cookie = 'token=stale-token; path=/;';

    server.use(
      http.get('*://*/api/test-401-clear', () =>
        new HttpResponse(null, { status: 401 })
      )
    );

    await expect(api.get('/test-401-clear')).rejects.toBeTruthy();

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(document.cookie).not.toMatch(/token=stale-token/);
  });

  it('does NOT redirect twice on rapid concurrent 401s', async () => {
    server.use(
      http.get('*://*/api/concurrent-401', () =>
        new HttpResponse(null, { status: 401 })
      )
    );

    await Promise.allSettled([
      api.get('/concurrent-401'),
      api.get('/concurrent-401'),
      api.get('/concurrent-401'),
    ]);

    expect((window.location as any).replace).toHaveBeenCalledTimes(1);
  });

  it('does NOT redirect when already on /login', async () => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        ...originalLocation,
        pathname: '/login',
        href: originalLocation.href,
        replace: vi.fn(),
        assign: vi.fn(),
        reload: vi.fn(),
      },
    });

    server.use(
      http.get('*://*/api/test-already-on-login', () =>
        new HttpResponse(null, { status: 401 })
      )
    );

    await expect(api.get('/test-already-on-login')).rejects.toBeTruthy();

    expect((window.location as any).replace).not.toHaveBeenCalled();
  });

  it('does NOT redirect for non-401 errors (e.g. 500, 400)', async () => {
    server.use(
      http.get('*://*/api/test-500', () =>
        new HttpResponse(null, { status: 500 })
      ),
      http.get('*://*/api/test-400', () =>
        new HttpResponse(null, { status: 400 })
      )
    );

    await expect(api.get('/test-500')).rejects.toBeTruthy();
    await expect(api.get('/test-400')).rejects.toBeTruthy();

    expect((window.location as any).replace).not.toHaveBeenCalled();
  });

  it('allows re-redirect after the dedup window expires', async () => {
    vi.useFakeTimers();
    server.use(
      http.get('*://*/api/test-retry', () =>
        new HttpResponse(null, { status: 401 })
      )
    );

    // First 401 — redirects once
    await expect(api.get('/test-retry')).rejects.toBeTruthy();
    expect((window.location as any).replace).toHaveBeenCalledTimes(1);

    // Immediately after, no further redirects
    await expect(api.get('/test-retry')).rejects.toBeTruthy();
    expect((window.location as any).replace).toHaveBeenCalledTimes(1);

    // After dedup window expires — redirect allowed again
    vi.advanceTimersByTime(6000);
    await expect(api.get('/test-retry')).rejects.toBeTruthy();
    expect((window.location as any).replace).toHaveBeenCalledTimes(2);
  });
});
