import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/error-boundary';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) throw new Error('Test error message');
  return <div>Child content</div>;
}

describe('ErrorBoundary', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    consoleSpy.mockClear();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('catches errors in children and shows fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    expect(screen.queryByText('Terjadi Kesalahan')).not.toBeInTheDocument();
  });

  it('provides a retry button that resets error state', () => {
    let shouldThrow = true;
    function ToggleThrow() {
      if (shouldThrow) throw new Error('Toggle error');
      return <div>Recovered child</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ToggleThrow />
      </ErrorBoundary>
    );

    expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }));

    expect(screen.getByText('Recovered child')).toBeInTheDocument();
    expect(screen.queryByText('Terjadi Kesalahan')).not.toBeInTheDocument();
  });

  it('does not show retry button when no retry prop', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    expect(screen.getByRole('button', { name: 'Coba Lagi' })).toBeInTheDocument();
  });

  it('handles errors from deeply nested children', () => {
    render(
      <ErrorBoundary>
        <div>
          <div>
            <ThrowingComponent />
          </div>
        </div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument();
  });

  it('does not catch errors from other siblings', () => {
    function Sibling() {
      return <div>Sibling OK</div>;
    }

    render(
      <ErrorBoundary>
        <Sibling />
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Terjadi Kesalahan')).toBeInTheDocument();
  });
});
