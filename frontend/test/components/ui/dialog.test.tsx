import { render, screen } from '@testing-library/react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@base-ui/react/dialog', () => {
  function Root({ open, children }: any) {
    return open ? <div data-slot="dialog">{children}</div> : null;
  }
  function Portal({ children }: any) {
    return <>{children}</>;
  }
  function Popup({ children, ...props }: any) {
    return <div data-slot="dialog-content" {...props}>{children}</div>;
  }
  function Title({ children, ...props }: any) {
    return <h2 data-slot="dialog-title" {...props}>{children}</h2>;
  }
  function Description({ children, ...props }: any) {
    return <p data-slot="dialog-description" {...props}>{children}</p>;
  }
  return {
    Dialog: {
      Root,
      Portal,
      Popup,
      Title,
      Description,
      Trigger: ({ children }: any) => <button>{children}</button>,
      Close: ({ children }: any) => <button>{children}</button>,
      Backdrop: () => null,
    },
  };
});

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock('lucide-react', () => ({
  XIcon: () => <span data-testid="x-icon">X</span>,
}));

describe('Dialog', () => {
  it('renders dialog content when open', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>This is a description</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
    expect(screen.getByText('This is a description')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Dialog open={false}>
        <DialogContent>
          <DialogTitle>Hidden Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.queryByText('Hidden Dialog')).not.toBeInTheDocument();
  });

  it('renders title with correct slot', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>My Title</DialogTitle>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('My Title')).toHaveAttribute('data-slot', 'dialog-title');
  });

  it('renders description with correct slot', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogDescription>My Description</DialogDescription>
        </DialogContent>
      </Dialog>
    );
    expect(screen.getByText('My Description')).toHaveAttribute('data-slot', 'dialog-description');
  });
});
