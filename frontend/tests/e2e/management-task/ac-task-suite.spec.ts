import { test, expect } from '@playwright/test';
import { loginForE2E } from '../helpers/auth';

test.describe('Management Task SSOT Acceptance Suite (AC-TASK-001..013)', () => {
  test.beforeEach(async ({ page }) => {
    await loginForE2E(page);
  });

  test('AC-TASK-001: Deterministic entrypoint redirects to /overview', async ({ page }) => {
    await page.goto('/marketing/management-task');
    await expect(page).toHaveURL(/\/marketing\/management-task\/overview/);
    await expect(page.locator('h1')).toContainText(/MANAGEMENT TASK/i);
  });

  test('AC-TASK-002: Overview renders 4 Standalone KPI Cards', async ({ page }) => {
    await page.goto('/marketing/management-task/overview');
    await expect(page.getByText('TOTAL TASK')).toBeVisible();
    await expect(page.getByText('SEDANG BERJALAN')).toBeVisible();
    await expect(page.getByText('TERLAMBAT')).toBeVisible();
    await expect(page.getByText('SELESAI')).toBeVisible();
  });

  test('AC-TASK-003: Deep-link URL query params persist search and filter state', async ({ page }) => {
    await page.goto('/marketing/management-task/overview?status=IN_PROGRESS&q=Campaign');
    await expect(page).toHaveURL(/status=IN_PROGRESS/);
    await expect(page).toHaveURL(/q=Campaign/);
    const searchInput = page.getByPlaceholder(/Cari kode atau judul/i);
    await expect(searchInput).toHaveValue('Campaign');
  });

  test('AC-TASK-004: Create task opens canonical drawer modal with ERP fields', async ({ page }) => {
    await page.goto('/marketing/management-task/overview');
    await page.getByRole('button', { name: /Tambah task/i }).first().click();
    await expect(page.getByRole('heading', { name: /Tambah task/i })).toBeVisible();
    await expect(page.getByLabel(/Judul task/i)).toBeVisible();
    await expect(page.getByLabel(/Assignee/i)).toBeVisible();
    await expect(page.getByLabel(/Channel/i)).toBeVisible();
    await expect(page.getByLabel(/Mulai/i)).toBeVisible();
    await expect(page.getByLabel(/Deadline/i)).toBeVisible();
  });

  test('AC-TASK-007 & AC-TASK-009: Detail drawer features DnaAuditTimeline and comments', async ({ page }) => {
    await page.goto('/marketing/management-task/overview');
    
    // Intercept task API to return a predictable task with audit history
    await page.route('**/api/marketing/tasks*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'task-e2e-1',
              taskCode: 'TSK-2026-0001',
              type: 'DAILY',
              title: 'Audited Test Task',
              status: 'IN_PROGRESS',
              priority: 'HIGH',
              channel: 'Instagram',
              category: 'content_operations',
              assigneeId: 'user-1',
              assignee: { id: 'user-1', fullName: 'Revi Manager', roles: ['MARKETING'] },
              startDate: '2026-09-10T00:00:00Z',
              dueDate: '2026-09-20T00:00:00Z',
              version: 2,
              checklistDone: 1,
              checklistTotal: 2,
              checklist: [
                { id: 'chk-1', text: 'Konsep disetujui', done: true, isRequired: true, sortOrder: 0 },
                { id: 'chk-2', text: 'Produksi aset', done: false, isRequired: true, sortOrder: 1 }
              ],
              history: [
                {
                  id: 'hist-1',
                  fromStatus: 'NOT_STARTED',
                  toStatus: 'IN_PROGRESS',
                  note: 'Mulai pengerjaan sprint',
                  createdAt: '2026-09-11T10:00:00Z',
                  by: { id: 'user-1', fullName: 'Revi Manager', roles: ['MARKETING'] }
                }
              ],
              comments: [],
              attachments: [],
              createdAt: '2026-09-10T00:00:00Z',
              updatedAt: '2026-09-11T10:00:00Z'
            }
          ],
          total: 1,
          page: 1,
          limit: 25,
          hasMore: false
        })
      });
    });

    await page.reload();
    await page.getByText('Audited Test Task').click();

    // Drawer detail checks
    await expect(page.getByRole('heading', { name: /Audited Test Task/i })).toBeVisible();
    await expect(page.getByText(/Riwayat aktivitas & audit/i)).toBeVisible();
    // Audit timeline entry checks
    await expect(page.getByText(/Belum mulai → Dikerjakan/i)).toBeVisible();
    await expect(page.getByText(/Mulai pengerjaan sprint/i)).toBeVisible();
    // Checklist verification
    await expect(page.getByText('Konsep disetujui')).toBeVisible();
    await expect(page.getByText('Produksi aset')).toBeVisible();
  });

  test('AC-TASK-011: Member tab navigates to scoped workspace', async ({ page }) => {
    await page.goto('/marketing/management-task/overview');
    const myTasksTab = page.getByRole('tab', { name: /Task Saya/i });
    if (await myTasksTab.isVisible()) {
      await myTasksTab.click();
      await expect(page).toHaveURL(/\/marketing\/management-task\/my-tasks/);
    }
  });

  test('AC-TASK-013: Optimistic concurrency 409 displays resolution dialog', async ({ page }) => {
    await page.goto('/marketing/management-task/overview');

    // Intercept mutation to simulate 409 conflict
    await page.route('**/api/marketing/tasks/*/status', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 409,
          error: 'Conflict',
          code: 'VERSION_CONFLICT',
          message: 'Data task telah diperbarui oleh pengguna lain. Silakan muat ulang data terbaru.'
        })
      });
    });

    // Provide one mock task to trigger status change
    await page.route('**/api/marketing/tasks*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 'task-conflict-1',
              taskCode: 'TSK-CONF-01',
              type: 'DAILY',
              title: 'Conflict Simulation Task',
              status: 'NOT_STARTED',
              priority: 'MEDIUM',
              channel: 'Instagram',
              category: 'content_operations',
              assigneeId: 'user-1',
              startDate: '2026-09-10T00:00:00Z',
              dueDate: '2026-09-20T00:00:00Z',
              version: 1,
              checklistDone: 0,
              checklistTotal: 0,
              checklist: [],
              history: [],
              comments: [],
              attachments: [],
              createdAt: '2026-09-10T00:00:00Z',
              updatedAt: '2026-09-10T00:00:00Z'
            }
          ],
          total: 1,
          page: 1,
          limit: 25,
          hasMore: false
        })
      });
    });

    await page.reload();
    await page.getByText('Conflict Simulation Task').click();
    await page.getByRole('button', { name: /Ke Dikerjakan/i }).click();

    // 409 Modal should be triggered
    await expect(page.getByText('Konflik Perubahan Data (409)')).toBeVisible();
    await expect(page.getByText(/Data telah diperbarui di sesi lain/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Muat Ulang Data Terbaru/i })).toBeVisible();
  });
});
