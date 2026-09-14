import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MasterPageShell, type MasterStatItem, type MasterTab } from '@/components/dna/MasterPageShell';

/**
 * Unit tests for MasterPageShell — Batch 6.4
 *
 * Per Batch 6.3: MasterPageShell is the reusable wrapper for consolidated
 * master pages. Each page provides: tabs, stats, search, daftarContent,
 * kelolaContent.
 */

vi.mock('next/link', () => ({
  default: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

const mockTabs: [MasterTab, MasterTab] = [
  { key: 'DAFTAR', label: 'Daftar Test', count: 10 },
  { key: 'KELOLA', label: 'Kelola Test', count: 5 },
];

const mockStats: [MasterStatItem, MasterStatItem, MasterStatItem, MasterStatItem] = [
  { variant: 'neutral', label: 'Total', value: 100 },
  { variant: 'emerald', label: 'Active', value: 80 },
  { variant: 'rose', label: 'Inactive', value: 20 },
  { variant: 'blue', label: 'Pending', value: 5 },
];

describe('MasterPageShell', () => {
  it('renders title and badge', () => {
    render(
      <MasterPageShell
        title="WAREHOUSE TEST"
        badge={<span>MY-BADGE</span>}
        subtitle="Test subtitle"
        tabs={mockTabs}
        activeTab="DAFTAR"
        onTabChange={vi.fn()}
        stats={mockStats}
        searchQuery=""
        onSearchChange={vi.fn()}
        daftarContent={<div>DAFTAR</div>}
        kelolaContent={<div>KELOLA</div>}
      />
    );
    expect(screen.getByText('WAREHOUSE TEST')).toBeDefined();
    expect(screen.getByText('MY-BADGE')).toBeDefined();
    expect(screen.getByText('Test subtitle')).toBeDefined();
  });

  it('renders both tabs with labels', () => {
    render(
      <MasterPageShell
        title="TEST"
        tabs={mockTabs}
        activeTab="DAFTAR"
        onTabChange={vi.fn()}
        stats={mockStats}
        searchQuery=""
        onSearchChange={vi.fn()}
        daftarContent={<div>DAFTAR</div>}
        kelolaContent={<div>KELOLA</div>}
      />
    );
    expect(screen.getByText('Daftar Test')).toBeDefined();
    expect(screen.getByText('Kelola Test')).toBeDefined();
  });

  it('shows daftarContent when activeTab is DAFTAR', () => {
    render(
      <MasterPageShell
        title="TEST"
        tabs={mockTabs}
        activeTab="DAFTAR"
        onTabChange={vi.fn()}
        stats={mockStats}
        searchQuery=""
        onSearchChange={vi.fn()}
        daftarContent={<div data-testid="daftar-content">DAFTAR LIST</div>}
        kelolaContent={<div data-testid="kelola-content">KELOLA LIST</div>}
      />
    );
    expect(screen.getByTestId('daftar-content')).toBeDefined();
    expect(screen.queryByTestId('kelola-content')).toBeNull();
  });

  it('shows kelolaContent when activeTab is KELOLA', () => {
    render(
      <MasterPageShell
        title="TEST"
        tabs={mockTabs}
        activeTab="KELOLA"
        onTabChange={vi.fn()}
        stats={mockStats}
        searchQuery=""
        onSearchChange={vi.fn()}
        daftarContent={<div data-testid="daftar-content">DAFTAR LIST</div>}
        kelolaContent={<div data-testid="kelola-content">KELOLA LIST</div>}
      />
    );
    expect(screen.queryByTestId('daftar-content')).toBeNull();
    expect(screen.getByTestId('kelola-content')).toBeDefined();
  });

  it('calls onTabChange when tab clicked', () => {
    const handleTabChange = vi.fn();
    render(
      <MasterPageShell
        title="TEST"
        tabs={mockTabs}
        activeTab="DAFTAR"
        onTabChange={handleTabChange}
        stats={mockStats}
        searchQuery=""
        onSearchChange={vi.fn()}
        daftarContent={<div>DAFTAR</div>}
        kelolaContent={<div>KELOLA</div>}
      />
    );
    fireEvent.click(screen.getByText('Kelola Test'));
    expect(handleTabChange).toHaveBeenCalledWith('KELOLA');
  });

  it('renders 4 stat cards with labels', () => {
    render(
      <MasterPageShell
        title="TEST"
        tabs={mockTabs}
        activeTab="DAFTAR"
        onTabChange={vi.fn()}
        stats={mockStats}
        searchQuery=""
        onSearchChange={vi.fn()}
        daftarContent={<div>DAFTAR</div>}
        kelolaContent={<div>KELOLA</div>}
      />
    );
    expect(screen.getByText('Total')).toBeDefined();
    expect(screen.getByText('Active')).toBeDefined();
    expect(screen.getByText('Inactive')).toBeDefined();
    expect(screen.getByText('Pending')).toBeDefined();
  });

  it('renders search input with placeholder', () => {
    render(
      <MasterPageShell
        title="TEST"
        tabs={mockTabs}
        activeTab="DAFTAR"
        onTabChange={vi.fn()}
        stats={mockStats}
        searchQuery=""
        onSearchChange={vi.fn()}
        searchPlaceholder="Cari barang..."
        daftarContent={<div>DAFTAR</div>}
        kelolaContent={<div>KELOLA</div>}
      />
    );
    expect(screen.getByPlaceholderText('Cari barang...')).toBeDefined();
  });

  it('uses default placeholder if searchPlaceholder not provided', () => {
    render(
      <MasterPageShell
        title="TEST"
        tabs={mockTabs}
        activeTab="DAFTAR"
        onTabChange={vi.fn()}
        stats={mockStats}
        searchQuery=""
        onSearchChange={vi.fn()}
        daftarContent={<div>DAFTAR</div>}
        kelolaContent={<div>KELOLA</div>}
      />
    );
    expect(screen.getByPlaceholderText('Cari...')).toBeDefined();
  });

  it('calls onSearchChange when typing in search', () => {
    const handleSearch = vi.fn();
    render(
      <MasterPageShell
        title="TEST"
        tabs={mockTabs}
        activeTab="DAFTAR"
        onTabChange={vi.fn()}
        stats={mockStats}
        searchQuery=""
        onSearchChange={handleSearch}
        daftarContent={<div>DAFTAR</div>}
        kelolaContent={<div>KELOLA</div>}
      />
    );
    const input = screen.getByPlaceholderText('Cari...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test query' } });
    expect(handleSearch).toHaveBeenCalledWith('test query');
  });

  it('reflects searchQuery value in input', () => {
    render(
      <MasterPageShell
        title="TEST"
        tabs={mockTabs}
        activeTab="DAFTAR"
        onTabChange={vi.fn()}
        stats={mockStats}
        searchQuery="existing value"
        onSearchChange={vi.fn()}
        daftarContent={<div>DAFTAR</div>}
        kelolaContent={<div>KELOLA</div>}
      />
    );
    const input = screen.getByPlaceholderText('Cari...') as HTMLInputElement;
    expect(input.value).toBe('existing value');
  });
});
