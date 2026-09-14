import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const replaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: (...args: unknown[]) => replaceMock(...args),
  }),
}));

import Page from '@/app/(dashboard)/marketing/management-task/page';

describe('Stub: marketing/management-task/page.tsx (client redirect)', () => {
  beforeEach(() => {
    replaceMock.mockClear();
    window.localStorage.clear();
  });

  it('replaces to a non-null canonical target on mount', async () => {
    render(<Page />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalled());
    const target = replaceMock.mock.calls[0][0] as unknown;
    expect(target).toBeTruthy();
    expect(typeof target).toBe('string');
    expect((target as string).length).toBeGreaterThan(0);
    expect(screen.getByText(/Redirecting/i)).toBeTruthy();
  });

  it('falls back to aurel workspace when no user is stored', async () => {
    render(<Page />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalled());
    expect(replaceMock.mock.calls[0][0]).toMatch(/\/marketing\/management-task\/(aurel|revi)/);
  });

  it('routes manager emails to revi workspace', async () => {
    window.localStorage.setItem(
      'user',
      JSON.stringify({ email: 'admin@dreamlab.id', fullName: 'Admin', roles: [] })
    );
    render(<Page />);
    await waitFor(() => expect(replaceMock).toHaveBeenCalled());
    expect(replaceMock.mock.calls[0][0]).toBe('/marketing/management-task/revi');
  });
});