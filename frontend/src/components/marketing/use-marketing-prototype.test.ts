import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the modules BEFORE importing the hook
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));
vi.mock('@/lib/api', () => ({
  api: { get: vi.fn() },
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useMarketingPrototypeBundle } from './use-marketing-prototype';

describe('useMarketingPrototypeBundle (regression)', () => {
  let mockOptions: any;

  beforeEach(() => {
    vi.clearAllMocks();
    (useQuery as any).mockImplementation((opts: any) => {
      mockOptions = opts;
      return { data: undefined, isLoading: true };
    });
  });

  it('disables query when no user is logged in', () => {
    (useAuth as any).mockReturnValue({ user: undefined });
    useMarketingPrototypeBundle();
    expect(mockOptions.enabled).toBe(false);
  });

  it('enables query when user is set', () => {
    (useAuth as any).mockReturnValue({ user: { id: 'u1' } });
    useMarketingPrototypeBundle();
    expect(mockOptions.enabled).toBe(true);
  });

  it('does NOT use placeholderData (root cause of system interrupt)', () => {
    (useAuth as any).mockReturnValue({ user: { id: 'u1' } });
    useMarketingPrototypeBundle();
    expect(mockOptions.placeholderData).toBeUndefined();
  });

  it('uses a 2-minute staleTime', () => {
    (useAuth as any).mockReturnValue({ user: { id: 'u1' } });
    useMarketingPrototypeBundle();
    expect(mockOptions.staleTime).toBe(2 * 60 * 1000);
  });

  it('uses user id (or anonymous) in the query key', () => {
    (useAuth as any).mockReturnValue({ user: { id: 'user-42' } });
    useMarketingPrototypeBundle();
    expect(mockOptions.queryKey).toEqual(['marketing-prototype-bundle', 'user-42']);

    (useAuth as any).mockReturnValue({ user: undefined });
    useMarketingPrototypeBundle();
    expect(mockOptions.queryKey).toEqual(['marketing-prototype-bundle', 'anonymous']);
  });
});
