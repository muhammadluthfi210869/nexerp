import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    replace: mockReplace,
    push: vi.fn(),
  }),
}));

import RootPage from '@/app/page';

describe('Stub: src/app/page.tsx (root)', () => {
  it('renders root page and handles redirect', () => {
    const { container } = render(<RootPage />);
    expect(container).toBeDefined();
    expect(mockReplace).toHaveBeenCalled();
  });
});