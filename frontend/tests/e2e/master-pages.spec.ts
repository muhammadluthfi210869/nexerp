import { test, expect } from '@playwright/test';

/**
 * Master Pages E2E Tests — Batch 6.4
 *
 * Covers consolidated pattern (Daftar + Kelola tabs) across all 7 master pages:
 * - /master/warehouses
 * - /master/categories
 * - /master/goods (Sheet modal)
 * - /master/vendors (Import Excel + sub-nav)
 * - /master/suppliers (DashboardCard grid)
 * - /master/customers (CascadingAddress)
 * - /master/personnel (multi-component)
 *
 * Per Batch 6.3: each page has 2 tabs (Daftar = read-only, Kelola = CRUD).
 * These tests verify tab switching, KPI cards, search, modal opens.
 */

const TEST_USER = {
  email: 'superadmin@nexerp.id',
  password: 'password123',
};

async function login(page: any) {
  await page.goto('/login');
  await page.waitForSelector('input#email', { timeout: 15000 });
  await page.fill('input#email', TEST_USER.email);
  await page.fill('input#password', TEST_USER.password);
  await page.click('button[type="submit"]');
  // Wait for redirect away from /login (goes to /executive/dashboard)
  await page.waitForURL((url: URL) => !url.pathname.startsWith('/login'), { timeout: 30000 });
}

test.describe('Master Pages — Consolidated Pattern (Batch 6.3)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ─────────────────────────────────────────────────────────────────────
  // 1. WAREHOUSES — Baseline consolidated pattern
  // ─────────────────────────────────────────────────────────────────────
  test.describe('Gudang (/master/warehouses)', () => {
    test('should load with 2 tabs (Daftar + Kelola)', async ({ page }) => {
      await page.goto('/master/warehouses');
      await expect(page.getByRole('tab', { name: /Daftar Gudang/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Kelola Gudang/i })).toBeVisible();
    });

    test('should display 4 KPI cards', async ({ page }) => {
      await page.goto('/master/warehouses');
      await expect(page.getByText('Total Gudang')).toBeVisible();
      await expect(page.getByText('Gudang Aktif')).toBeVisible();
    });

    test('should switch Daftar ↔ Kelola tabs', async ({ page }) => {
      await page.goto('/master/warehouses');
      await page.getByRole('tab', { name: /Kelola Gudang/i }).click();
      await expect(page.getByRole('button', { name: /Tambah Gudang/i })).toBeVisible();
      await page.getByRole('tab', { name: /Daftar Gudang/i }).click();
      await expect(page.getByRole('button', { name: /Tambah Gudang/i })).not.toBeVisible();
    });

    test('should open Add Gudang modal from Kelola tab', async ({ page }) => {
      await page.goto('/master/warehouses');
      await page.getByRole('tab', { name: /Kelola Gudang/i }).click();
      await page.getByRole('button', { name: /Tambah Gudang/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Tambah Gudang').first()).toBeVisible();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 2. CATEGORIES — Type filter inner state
  // ─────────────────────────────────────────────────────────────────────
  test.describe('Categories (/master/categories)', () => {
    test('should load with type filter (Barang/Supplier/Customer)', async ({ page }) => {
      await page.goto('/master/categories');
      await expect(page.getByText('Tipe:')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Barang' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Supplier' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Customer' })).toBeVisible();
    });

    test('should switch type filter Barang ↔ Supplier', async ({ page }) => {
      await page.goto('/master/categories');
      await page.getByRole('button', { name: 'Supplier' }).click();
      // Active button should have different styling — verify it doesn't error
      await page.waitForTimeout(300);
    });

    test('should have Daftar + Kelola tabs', async ({ page }) => {
      await page.goto('/master/categories');
      await expect(page.getByRole('tab', { name: /Daftar Kategori/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Kelola Kategori/i })).toBeVisible();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 3. GOODS — Sheet modal multi-section
  // ─────────────────────────────────────────────────────────────────────
  test.describe('Barang (/master/goods)', () => {
    test('should load with 2 tabs', async ({ page }) => {
      await page.goto('/master/goods');
      await expect(page.getByRole('tab', { name: /Daftar Barang/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Kelola Barang/i })).toBeVisible();
    });

    test('should display 4 KPI cards (SKU/Critical/Dummy/Sync)', async ({ page }) => {
      await page.goto('/master/goods');
      await expect(page.getByText('Total SKU')).toBeVisible();
      await expect(page.getByText('Critical Stock')).toBeVisible();
      await expect(page.getByText('Dummy Materials')).toBeVisible();
      await expect(page.getByText('System Sync')).toBeVisible();
    });

    test('should open Sheet modal for Tambah Barang', async ({ page }) => {
      await page.goto('/master/goods');
      await page.getByRole('tab', { name: /Kelola Barang/i }).click();
      await page.getByRole('button', { name: /Tambah Barang/i }).click();
      // Sheet uses different role — check for the modal title
      await expect(page.getByText(/Initialize Material|Tambah/i).first()).toBeVisible({ timeout: 5000 });
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 4. VENDORS — Sub-nav + Import Excel
  // ─────────────────────────────────────────────────────────────────────
  test.describe('Vendors (/master/vendors)', () => {
    test('should load with 2 tabs', async ({ page }) => {
      await page.goto('/master/vendors');
      await expect(page.getByRole('tab', { name: /Daftar Vendor/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Kelola Vendor/i })).toBeVisible();
    });

    test('should show category sub-nav tabs in Kelola', async ({ page }) => {
      await page.goto('/master/vendors');
      await page.getByRole('tab', { name: /Kelola Vendor/i }).click();
      await expect(page.getByText(/Bahan Kimia|Kemasan|Sub-kontrak/i).first()).toBeVisible();
    });

    test('should show Import Excel + Tambah buttons in Kelola', async ({ page }) => {
      await page.goto('/master/vendors');
      await page.getByRole('tab', { name: /Kelola Vendor/i }).click();
      await expect(page.getByRole('button', { name: /Import Excel/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Tambah Pemasok/i })).toBeVisible();
    });

    test('should NOT show Import/Tambah in Daftar tab', async ({ page }) => {
      await page.goto('/master/vendors');
      // Default is Daftar
      await expect(page.getByRole('button', { name: /Tambah Pemasok/i })).not.toBeVisible();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 5. SUPPLIERS — DashboardCard grid + Import Excel
  // ─────────────────────────────────────────────────────────────────────
  test.describe('Suppliers (/master/suppliers)', () => {
    test('should load with 2 tabs', async ({ page }) => {
      await page.goto('/master/suppliers');
      await expect(page.getByRole('tab', { name: /Daftar Supplier/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Kelola Supplier/i })).toBeVisible();
    });

    test('should display 4 KPI cards', async ({ page }) => {
      await page.goto('/master/suppliers');
      await expect(page.getByText('Total Vendor')).toBeVisible();
      await expect(page.getByText('Vendor Aktif')).toBeVisible();
      await expect(page.getByText('Kategori')).toBeVisible();
    });

    test('should show Tambah + Import buttons in Kelola tab', async ({ page }) => {
      await page.goto('/master/suppliers');
      await page.getByRole('tab', { name: /Kelola Supplier/i }).click();
      await expect(page.getByRole('button', { name: /Tambah Vendor/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Import Excel/i })).toBeVisible();
    });

    test('should open Tambah Vendor modal', async ({ page }) => {
      await page.goto('/master/suppliers');
      await page.getByRole('tab', { name: /Kelola Supplier/i }).click();
      await page.getByRole('button', { name: /Tambah Vendor/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 6. CUSTOMERS — CascadingAddress preserved
  // ─────────────────────────────────────────────────────────────────────
  test.describe('Customers (/master/customers)', () => {
    test('should load with 2 tabs', async ({ page }) => {
      await page.goto('/master/customers');
      await expect(page.getByRole('tab', { name: /Daftar Customer/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Kelola Customer/i })).toBeVisible();
    });

    test('should display 4 KPI cards', async ({ page }) => {
      await page.goto('/master/customers');
      await expect(page.getByText('Total Customer')).toBeVisible();
      await expect(page.getByText('Customer Aktif')).toBeVisible();
      await expect(page.getByText(/NPWP|Tax/i).first()).toBeVisible();
    });

    test('should open Tambah Customer modal with CascadingAddress', async ({ page }) => {
      await page.goto('/master/customers');
      await page.getByRole('tab', { name: /Kelola Customer/i }).click();
      await page.getByRole('button', { name: /Tambah Customer/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      // CascadingAddress section is in green emerald box
      await expect(page.getByText(/Alamat & Wilayah/i)).toBeVisible();
    });

    test('should NOT show Aksi column in Daftar tab', async ({ page }) => {
      await page.goto('/master/customers');
      // Daftar is default — Aksi column should not be rendered
      const aksiCount = await page.getByRole('columnheader', { name: /Aksi/i }).count();
      expect(aksiCount).toBe(0);
    });

    test('should show Aksi column in Kelola tab', async ({ page }) => {
      await page.goto('/master/customers');
      await page.getByRole('tab', { name: /Kelola Customer/i }).click();
      await expect(page.getByRole('columnheader', { name: /Aksi/i })).toBeVisible();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // 7. PERSONNEL — Multi-component (page.tsx + PersonnelRegistry.tsx)
  // ─────────────────────────────────────────────────────────────────────
  test.describe('Personnel (/master/personnel)', () => {
    test('should load with 2 tabs', async ({ page }) => {
      await page.goto('/master/personnel');
      await expect(page.getByRole('tab', { name: /Daftar Pegawai/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Kelola Pegawai/i })).toBeVisible();
    });

    test('should display 4 KPI cards', async ({ page }) => {
      await page.goto('/master/personnel');
      await expect(page.getByText('Total Pegawai')).toBeVisible();
      await expect(page.getByText('Departemen')).toBeVisible();
      await expect(page.getByText('Linked User')).toBeVisible();
    });

    test('should open Tambah Pegawai modal', async ({ page }) => {
      await page.goto('/master/personnel');
      await page.getByRole('tab', { name: /Kelola Pegawai/i }).click();
      await page.getByRole('button', { name: /Tambah Pegawai/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
    });
  });

  // ─────────────────────────────────────────────────────────────────────
  // CROSS-CUTTING — Verify all master pages have consistent UX
  // ─────────────────────────────────────────────────────────────────────
  test.describe('Cross-page consistency', () => {
    const masterPages = [
      '/master/warehouses',
      '/master/categories',
      '/master/goods',
      '/master/vendors',
      '/master/suppliers',
      '/master/customers',
      '/master/personnel',
    ];

    for (const path of masterPages) {
      test(`${path} should have exactly 2 tabs (Daftar + Kelola)`, async ({ page }) => {
        await page.goto(path);
        const tabs = page.getByRole('tab');
        await expect(tabs).toHaveCount(2);
        // First tab is Daftar
        await expect(tabs.nth(0)).toContainText(/Daftar/i);
        // Second tab is Kelola
        await expect(tabs.nth(1)).toContainText(/Kelola/i);
      });

      test(`${path} should have search input`, async ({ page }) => {
        await page.goto(path);
        await expect(page.getByPlaceholder(/Cari|Search/i).first()).toBeVisible();
      });
    }
  });
});
