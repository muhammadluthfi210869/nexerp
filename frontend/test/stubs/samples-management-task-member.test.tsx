import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

import { redirect } from 'next/navigation';
import Page from '@/app/(dashboard)/samples/management-task/[member]/page';

describe('Stub: samples/management-task/[member]/page.tsx', () => {
  beforeEach(() => {
    (redirect as unknown as ReturnType<typeof vi.fn>).mockClear();
  });

  it('redirects to a non-null target for invalid members', async () => {
    await Page({ params: Promise.resolve({ member: 'invalid-member' }) });
    expect(redirect).toHaveBeenCalledTimes(1);
    const target = (redirect as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(target).toBeTruthy();
    expect(typeof target).toBe('string');
    expect((target as string).length).toBeGreaterThan(0);
  });

  it('does not redirect for valid member (overview)', async () => {
    const result = await Page({ params: Promise.resolve({ member: 'overview' }) });
    expect(redirect).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });
});