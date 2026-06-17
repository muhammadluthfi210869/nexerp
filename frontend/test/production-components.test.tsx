import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IndustrialNumpad } from '@/components/production/IndustrialNumpad';
import { TerminalTabNav } from '@/components/production/TerminalTabNav';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/production/terminal/mixing'),
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe('IndustrialNumpad', () => {
  const mockOnChange = vi.fn();
  const mockOnConfirm = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders number buttons', () => {
    const { container } = render(<IndustrialNumpad value="" onChange={mockOnChange} onConfirm={mockOnConfirm} onClose={mockOnClose} label="Test" />);
    expect(screen.getByRole('button', { name: '1' })).toBeDefined();
    expect(screen.getByRole('button', { name: '0' })).toBeDefined();
  });

  it('calls onChange with value when a number button is pressed', () => {
    render(<IndustrialNumpad value="" onChange={mockOnChange} onConfirm={mockOnConfirm} onClose={mockOnClose} label="Test" />);
    fireEvent.click(screen.getByRole('button', { name: '1' }));
    expect(mockOnChange).toHaveBeenCalledWith('1');
  });

  it('displays the current value', () => {
    render(<IndustrialNumpad value="42" onChange={mockOnChange} onConfirm={mockOnConfirm} onClose={mockOnClose} label="Test" />);
    expect(screen.getByText('42')).toBeDefined();
  });

  it('renders confirm button', () => {
    render(<IndustrialNumpad value="" onChange={mockOnChange} onConfirm={mockOnConfirm} onClose={mockOnClose} label="Test" />);
    expect(screen.getByText('CONFIRM DATA')).toBeDefined();
  });

  it('renders backspace/delete button', () => {
    const { container } = render(<IndustrialNumpad value="" onChange={mockOnChange} onConfirm={mockOnConfirm} onClose={mockOnClose} label="Test" />);
    const deleteIcon = container.querySelector('.lucide-delete');
    expect(deleteIcon).not.toBeNull();
  });

  it('has the correct number of digit buttons (0-9)', () => {
    render(<IndustrialNumpad value="" onChange={mockOnChange} onConfirm={mockOnConfirm} onClose={mockOnClose} label="Test" />);
    for (let i = 1; i <= 9; i++) {
      const btn = screen.getByRole('button', { name: i.toString() });
      expect(btn).toBeDefined();
    }
    const zeroBtn = screen.getByRole('button', { name: '0' });
    expect(zeroBtn).toBeDefined();
  });

  it('renders the label', () => {
    render(<IndustrialNumpad value="" onChange={mockOnChange} onConfirm={mockOnConfirm} onClose={mockOnClose} label="Target Qty" />);
    expect(screen.getByText('Target Qty')).toBeDefined();
  });

  it('renders optional unit', () => {
    render(<IndustrialNumpad value="" onChange={mockOnChange} onConfirm={mockOnConfirm} onClose={mockOnClose} label="Test" unit="pcs" />);
    expect(screen.getByText('pcs')).toBeDefined();
  });

  it('calls onClose when close button is pressed', () => {
    const { container } = render(<IndustrialNumpad value="" onChange={mockOnChange} onConfirm={mockOnConfirm} onClose={mockOnClose} label="Test" />);
    const xIcon = container.querySelector('.lucide-x');
    expect(xIcon).not.toBeNull();
    const closeBtn = xIcon!.closest('button')!;
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onConfirm when confirm button is pressed', () => {
    render(<IndustrialNumpad value="5" onChange={mockOnChange} onConfirm={mockOnConfirm} onClose={mockOnClose} label="Test" />);
    fireEvent.click(screen.getByText('CONFIRM DATA'));
    expect(mockOnConfirm).toHaveBeenCalled();
  });
});

describe('TerminalTabNav', () => {
  it('renders all terminal tabs', () => {
    render(<TerminalTabNav />);
    expect(screen.getByText('Mixing')).toBeDefined();
    expect(screen.getByText('Filling')).toBeDefined();
    expect(screen.getByText('Packing')).toBeDefined();
    expect(screen.getByText('Reconciliation')).toBeDefined();
  });

  it('renders links for each tab', () => {
    render(<TerminalTabNav />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(4);
  });
});
