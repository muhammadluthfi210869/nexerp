import { render, screen, fireEvent } from '@testing-library/react';
import { DnaInput } from '@/components/dna/DnaInput';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('DnaInput — Edge Cases', () => {
  it('handles empty string value', () => {
    render(<DnaInput value="" readOnly />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('');
  });

  it('handles very long input (1000+ chars)', () => {
    const handleChange = vi.fn();
    const longString = 'a'.repeat(1500);
    render(<DnaInput onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: longString } });
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ value: longString }) })
    );
  });

  it('handles special characters', () => {
    const handleChange = vi.fn();
    render(<DnaInput onChange={handleChange} />);
    const special = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/`~';
    fireEvent.change(screen.getByRole('textbox'), { target: { value: special } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('handles unicode characters', () => {
    const handleChange = vi.fn();
    render(<DnaInput onChange={handleChange} />);
    const unicode = '你好世界 🌍 مرحبا';
    fireEvent.change(screen.getByRole('textbox'), { target: { value: unicode } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('handles copy/paste input', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<DnaInput onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    await user.click(input);
    await user.paste('pasted content');
    expect(handleChange).toHaveBeenCalled();
  });

  it('enforces maxLength when provided', () => {
    render(<DnaInput maxLength={10} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '10');
  });

  it('renders as readonly when readOnly is set', () => {
    render(<DnaInput value="readonly" readOnly />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });

  it('handles rapid sequential changes', () => {
    const handleChange = vi.fn();
    render(<DnaInput onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    for (let i = 0; i < 50; i++) {
      fireEvent.change(input, { target: { value: `val${i}` } });
    }
    expect(handleChange).toHaveBeenCalledTimes(50);
  });

  it('handles input with only whitespace', () => {
    const handleChange = vi.fn();
    render(<DnaInput onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('handles numeric string input', () => {
    const handleChange = vi.fn();
    render(<DnaInput type="text" onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '12345.67' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders icon with correct styling', () => {
    render(<DnaInput icon={<span data-testid="icon">🔍</span>} placeholder="Search" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('pl-11');
  });

  it('does not apply icon padding when no icon', () => {
    render(<DnaInput placeholder="No icon" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('px-4');
    expect(input).not.toHaveClass('pl-11');
  });

  it('handles controlled value updates', () => {
    const { rerender } = render(<DnaInput value="initial" readOnly />);
    expect(screen.getByDisplayValue('initial')).toBeInTheDocument();

    rerender(<DnaInput value="updated" readOnly />);
    expect(screen.getByDisplayValue('updated')).toBeInTheDocument();
  });

  it('handles placeholder text', () => {
    render(<DnaInput placeholder="Type here..." />);
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<DnaInput ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('spreads additional HTML attributes', () => {
    render(<DnaInput data-testid="custom" aria-label="Custom label" />);
    expect(screen.getByLabelText('Custom label')).toBeInTheDocument();
  });
});
