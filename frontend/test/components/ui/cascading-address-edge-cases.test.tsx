import { render, screen, fireEvent } from '@testing-library/react';
import { CascadingAddress } from '@/components/ui/cascading-address';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/indonesian-addresses', () => ({
  PROVINCES: [
    { code: '31', name: 'DKI JAKARTA' },
    { code: '32', name: 'JAWA BARAT' },
    { code: '51', name: 'BALI' },
  ],
  getFilteredCities: vi.fn((provCode: string) => {
    const cities: Record<string, { code: string; name: string }[]> = {
      '31': [
        { code: '31.71', name: 'JAKARTA PUSAT' },
        { code: '31.72', name: 'JAKARTA UTARA' },
      ],
      '32': [{ code: '32.01', name: 'KAB. BOGOR' }],
      '51': [{ code: '51.01', name: 'KOTA DENPASAR' }],
    };
    return cities[provCode] || [];
  }),
  getFilteredDistricts: vi.fn((cityCode: string) => {
    const districts: Record<string, { code: string; name: string }[]> = {
      '31.71': [
        { code: '31.71.01', name: 'GAMBIR' },
        { code: '31.71.02', name: 'MENTENG' },
      ],
      '32.01': [{ code: '32.01.01', name: 'BOGOR TENGAH' }],
    };
    return districts[cityCode] || [];
  }),
}));

vi.mock('@/components/ui/select', () => {
  function MockSelect({
    value,
    onValueChange,
    disabled,
    children,
  }: {
    value?: string;
    onValueChange?: (val: string) => void;
    disabled?: boolean;
    children?: React.ReactNode;
  }) {
    return (
      <select
        value={value || ''}
        onChange={(e) => onValueChange?.(e.target.value)}
        disabled={disabled}
      >
        <option value="">Pilih</option>
        {children}
      </select>
    );
  }
  return {
    Select: MockSelect,
    SelectTrigger: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    SelectValue: () => null,
    SelectContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
      <option value={value}>{children}</option>
    ),
  };
});

describe('CascadingAddress — Edge Cases', () => {
  const defaultProps = {
    provinsi: '',
    kota: '',
    kecamatan: '',
    onProvinsiChange: vi.fn(),
    onKotaChange: vi.fn(),
    onKecamatanChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles empty initial values gracefully', () => {
    render(<CascadingAddress {...defaultProps} />);
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(3);
    expect(selects[0]).toHaveValue('');
    expect(selects[1]).toHaveValue('');
    expect(selects[2]).toHaveValue('');
  });

  it('resets kota and kecamatan when province changes', () => {
    const onProvinsiChange = vi.fn();
    const onKotaChange = vi.fn();
    const onKecamatanChange = vi.fn();

    render(
      <CascadingAddress
        {...defaultProps}
        provinsi="31"
        kota="31.71"
        kecamatan="31.71.01"
        onProvinsiChange={onProvinsiChange}
        onKotaChange={onKotaChange}
        onKecamatanChange={onKecamatanChange}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '32' } });

    expect(onProvinsiChange).toHaveBeenCalledWith('32');
    expect(onKotaChange).toHaveBeenCalledWith('');
    expect(onKecamatanChange).toHaveBeenCalledWith('');
  });

  it('resets kecamatan when city changes', () => {
    const onKotaChange = vi.fn();
    const onKecamatanChange = vi.fn();

    render(
      <CascadingAddress
        {...defaultProps}
        provinsi="31"
        kota="31.71"
        kecamatan="31.71.01"
        onKotaChange={onKotaChange}
        onKecamatanChange={onKecamatanChange}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: '31.72' } });

    expect(onKotaChange).toHaveBeenCalledWith('31.72');
    expect(onKecamatanChange).toHaveBeenCalledWith('');
  });

  it('disables kota select when no province selected', () => {
    render(<CascadingAddress {...defaultProps} />);
    const selects = screen.getAllByRole('combobox');
    expect(selects[1]).toBeDisabled();
  });

  it('disables kecamatan select when no city selected', () => {
    render(<CascadingAddress {...defaultProps} />);
    const selects = screen.getAllByRole('combobox');
    expect(selects[2]).toBeDisabled();
  });

  it('enables kota select when province is selected', () => {
    render(<CascadingAddress {...defaultProps} provinsi="31" />);
    const selects = screen.getAllByRole('combobox');
    expect(selects[1]).not.toBeDisabled();
  });

  it('enables kecamatan select when city is selected', () => {
    render(<CascadingAddress {...defaultProps} provinsi="31" kota="31.71" />);
    const selects = screen.getAllByRole('combobox');
    expect(selects[2]).not.toBeDisabled();
  });

  it('handles selecting same province twice', () => {
    const onProvinsiChange = vi.fn();
    const onKotaChange = vi.fn();
    const onKecamatanChange = vi.fn();

    render(
      <CascadingAddress
        {...defaultProps}
        provinsi="31"
        onProvinsiChange={onProvinsiChange}
        onKotaChange={onKotaChange}
        onKecamatanChange={onKecamatanChange}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '31' } });

    expect(onProvinsiChange).toHaveBeenCalledWith('31');
    expect(onKotaChange).toHaveBeenCalledWith('');
    expect(onKecamatanChange).toHaveBeenCalledWith('');
  });

  it('handles rapid province switching', () => {
    const onProvinsiChange = vi.fn();
    const onKotaChange = vi.fn();
    const onKecamatanChange = vi.fn();

    render(
      <CascadingAddress
        {...defaultProps}
        onProvinsiChange={onProvinsiChange}
        onKotaChange={onKotaChange}
        onKecamatanChange={onKecamatanChange}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: '31' } });
    fireEvent.change(selects[0], { target: { value: '32' } });
    fireEvent.change(selects[0], { target: { value: '51' } });
    fireEvent.change(selects[0], { target: { value: '31' } });

    expect(onProvinsiChange).toHaveBeenCalledTimes(4);
    expect(onKotaChange).toHaveBeenCalledTimes(4);
    expect(onKecamatanChange).toHaveBeenCalledTimes(4);
  });

  it('handles switching to different province with different cities', () => {
    const onKotaChange = vi.fn();

    render(
      <CascadingAddress
        {...defaultProps}
        provinsi="31"
        kota="31.71"
        onKotaChange={onKotaChange}
        onKecamatanChange={vi.fn()}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: '31.72' } });
    expect(onKotaChange).toHaveBeenCalledWith('31.72');
  });

  it('applies custom className', () => {
    const { container } = render(
      <CascadingAddress {...defaultProps} className="custom-grid" />
    );
    expect(container.firstChild).toHaveClass('custom-grid');
  });

  it('handles kecamatan selection without error', () => {
    const onKecamatanChange = vi.fn();

    render(
      <CascadingAddress
        {...defaultProps}
        provinsi="31"
        kota="31.71"
        onKecamatanChange={onKecamatanChange}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[2], { target: { value: '31.71.01' } });
    expect(onKecamatanChange).toHaveBeenCalledWith('31.71.01');
  });

  it('displays labels correctly', () => {
    render(<CascadingAddress {...defaultProps} />);
    expect(screen.getByText('Provinsi')).toBeInTheDocument();
    expect(screen.getByText('Kota / Kab.')).toBeInTheDocument();
    expect(screen.getByText('Kecamatan')).toBeInTheDocument();
  });

  it('handles changing province multiple times without stale state', () => {
    const onProvinsiChange = vi.fn();
    const onKotaChange = vi.fn();

    render(
      <CascadingAddress
        {...defaultProps}
        onProvinsiChange={onProvinsiChange}
        onKotaChange={onKotaChange}
        onKecamatanChange={vi.fn()}
      />
    );

    const selects = screen.getAllByRole('combobox');

    fireEvent.change(selects[0], { target: { value: '31' } });
    fireEvent.change(selects[0], { target: { value: '32' } });
    fireEvent.change(selects[0], { target: { value: '51' } });

    expect(onProvinsiChange).toHaveBeenLastCalledWith('51');
    expect(onKotaChange).toHaveBeenLastCalledWith('');
  });
});
