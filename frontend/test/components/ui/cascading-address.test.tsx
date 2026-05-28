import { render, screen, fireEvent } from '@testing-library/react';
import { CascadingAddress } from '@/components/ui/cascading-address';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/indonesian-addresses', () => ({
  PROVINCES: [
    { code: '31', name: 'DKI JAKARTA' },
    { code: '32', name: 'JAWA BARAT' },
  ],
  getFilteredCities: vi.fn((provCode: string) => {
    if (provCode === '31') return [{ code: '31.71', name: 'JAKARTA PUSAT' }];
    return [{ code: '32.01', name: 'KAB. BOGOR' }];
  }),
  getFilteredDistricts: vi.fn((cityCode: string) => {
    if (cityCode === '31.71') return [{ code: '31.71.01', name: 'GAMBIR' }];
    return [{ code: '32.01.01', name: 'KAB. BOGOR 1' }];
  }),
}));

vi.mock('@/components/ui/select', () => {
  function MockSelect({ value, onValueChange, disabled }: any) {
    return (
      <select
        value={value || ''}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">Pilih</option>
        <option value="31">DKI JAKARTA</option>
        <option value="32">JAWA BARAT</option>
        <option value="31.71">JAKARTA PUSAT</option>
        <option value="32.01">KAB. BOGOR</option>
        <option value="31.71.01">GAMBIR</option>
        <option value="32.01.01">KAB. BOGOR 1</option>
      </select>
    );
  }
  return {
    Select: MockSelect,
    SelectTrigger: ({ children }: any) => <>{children}</>,
    SelectValue: () => null,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  };
});

describe('CascadingAddress', () => {
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

  it('renders three select areas for Provinsi, Kota, and Kecamatan', () => {
    render(<CascadingAddress {...defaultProps} />);
    expect(screen.getByText('Provinsi')).toBeInTheDocument();
    expect(screen.getByText('Kota / Kab.')).toBeInTheDocument();
    expect(screen.getByText('Kecamatan')).toBeInTheDocument();
  });

  it('calls onProvinsiChange and resets Kota and Kecamatan', () => {
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

    expect(onProvinsiChange).toHaveBeenCalledWith('31');
    expect(onKotaChange).toHaveBeenCalledWith('');
    expect(onKecamatanChange).toHaveBeenCalledWith('');
  });

  it('calls onKotaChange and resets Kecamatan', () => {
    const onKotaChange = vi.fn();
    const onKecamatanChange = vi.fn();

    render(
      <CascadingAddress
        {...defaultProps}
        provinsi="31"
        onKotaChange={onKotaChange}
        onKecamatanChange={onKecamatanChange}
      />
    );

    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: '31.71' } });

    expect(onKotaChange).toHaveBeenCalledWith('31.71');
    expect(onKecamatanChange).toHaveBeenCalledWith('');
  });
});
