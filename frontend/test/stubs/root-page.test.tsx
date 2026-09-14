import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

import { redirect } from 'next/navigation';
import RootPage from '@/app/page';

describe('Stub: src/app/page.tsx (root)', () => {
  it('redirects to a non-null canonical target', () => {
    RootPage();
    expect(redirect).toHaveBeenCalledTimes(1);
    const target = (redirect as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(target).toBeTruthy();
    expect(typeof target).toBe('string');
    expect((target as string).length).toBeGreaterThan(0);
  });
});