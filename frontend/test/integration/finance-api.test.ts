import { describe, it, expect } from 'vitest';
import { api, extractApiError } from '@/lib/api';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

const API_BASE = '/api';

describe('API Client — Finance Integration', () => {
  describe('GET /finance/dashboard', () => {
    it('returns dashboard metrics', async () => {
      const res = await api.get(`${API_BASE}/finance/dashboard`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('totalRevenue');
      expect(res.data).toHaveProperty('totalExpenses');
      expect(res.data).toHaveProperty('netProfit');
      expect(res.data).toHaveProperty('cashBalance');
      expect(res.data).toHaveProperty('receivables');
      expect(res.data).toHaveProperty('payables');
    });

    it('metrics are numeric values', async () => {
      const res = await api.get(`${API_BASE}/finance/dashboard`);
      expect(typeof res.data.totalRevenue).toBe('number');
      expect(typeof res.data.netProfit).toBe('number');
    });
  });

  describe('GET /finance/journals', () => {
    it('returns journal entries array', async () => {
      const res = await api.get(`${API_BASE}/finance/journals`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  describe('POST /finance/journals', () => {
    it('creates a journal entry successfully', async () => {
      const journal = {
        date: new Date().toISOString(),
        description: 'Test journal entry',
        lines: [
          { accountId: '1110', debit: 1000000, credit: 0 },
          { accountId: '4101', debit: 0, credit: 1000000 },
        ],
      };

      const res = await api.post(`${API_BASE}/finance/journals`, journal);
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
    });

    it('rejects unbalanced journal', async () => {
      const journal = {
        date: new Date().toISOString(),
        description: 'Unbalanced journal',
        lines: [
          { accountId: '1110', debit: 1000000, credit: 0 },
          { accountId: '4101', debit: 0, credit: 500000 },
        ],
      };

      try {
        await api.post(`${API_BASE}/finance/journals`, journal);
      } catch (error: any) {
        expect(error.response?.status).toBe(400);
      }
    });
  });

  describe('GET /finance/accounts', () => {
    it('returns COA accounts array', async () => {
      const res = await api.get(`${API_BASE}/finance/accounts`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('each account has required fields', async () => {
      const res = await api.get(`${API_BASE}/finance/accounts`);
      const account = res.data[0];
      expect(account).toHaveProperty('id');
      expect(account).toHaveProperty('code');
      expect(account).toHaveProperty('name');
      expect(account).toHaveProperty('type');
    });
  });

  describe('GET /finance/invoices', () => {
    it('returns invoices array', async () => {
      const res = await api.get(`${API_BASE}/finance/invoices`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  describe('GET /finance/reports/trial-balance', () => {
    it('returns trial balance data', async () => {
      const res = await api.get(`${API_BASE}/finance/reports/trial-balance`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('accounts');
      expect(res.data).toHaveProperty('totalDebit');
      expect(res.data).toHaveProperty('totalCredit');
      expect(Array.isArray(res.data.accounts)).toBe(true);
    });

    it('trial balance accounts have debit and credit', async () => {
      const res = await api.get(`${API_BASE}/finance/reports/trial-balance`);
      const account = res.data.accounts[0];
      expect(account).toHaveProperty('code');
      expect(account).toHaveProperty('name');
      expect(account).toHaveProperty('debit');
      expect(account).toHaveProperty('credit');
    });
  });

  describe('Error Handling', () => {
    it('returns 401 for unauthorized requests', async () => {
      server.use(
        http.get(`${API_BASE}/finance/dashboard`, () => {
          return new HttpResponse(null, { status: 401 });
        }),
      );

      try {
        await api.get(`${API_BASE}/finance/dashboard`);
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    });

    it('returns 500 for server errors', async () => {
      server.use(
        http.get(`${API_BASE}/finance/journals`, () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      try {
        await api.get(`${API_BASE}/finance/journals`);
      } catch (error: any) {
        expect(error.response?.status).toBe(500);
      }
    });

    it('extractApiError handles non-axios errors', () => {
      const result = extractApiError(new Error('Unauthorized'));
      expect(result.status).toBe(500);
      expect(result.message).toBe('Unauthorized');
    });

    it('extractApiError handles generic errors', () => {
      const result = extractApiError(new Error('Network fail'));
      expect(result.status).toBe(500);
      expect(result.message).toBe('Network fail');
    });
  });
});
