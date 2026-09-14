import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

import { redirect } from 'next/navigation';
import Page from '@/app/(dashboard)/marketing/team/page';

describe('Stub: marketing/team/page.tsx', () => {
  it('redirects to a non-null canonical target', () => {
    Page();
    expect(redirect).toHaveBeenCalledTimes(1);
    const target = (redirect as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(target).toBeTruthy();
    expect(typeof target).toBe('string');
    expect((target as string).length).toBeGreaterThan(0);
  });
});