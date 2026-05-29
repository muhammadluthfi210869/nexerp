import { describe, it, expect } from 'vitest';
import { api } from '@/lib/api';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

const API_BASE = '/api';

describe('API Client — Master Data Integration', () => {
  describe('GET /master/customers', () => {
    it('returns customers array', async () => {
      const res = await api.get(`${API_BASE}/master/customers`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('each customer has required fields', async () => {
      const res = await api.get(`${API_BASE}/master/customers`);
      const customer = res.data[0];
      expect(customer).toHaveProperty('id');
      expect(customer).toHaveProperty('name');
      expect(customer).toHaveProperty('email');
      expect(customer).toHaveProperty('phone');
    });

    it('supports search query param', async () => {
      const res = await api.get(`${API_BASE}/master/customers`, {
        params: { search: 'Customer A' },
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  describe('GET /master/suppliers', () => {
    it('returns suppliers array', async () => {
      const res = await api.get(`${API_BASE}/master/suppliers`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('each supplier has required fields', async () => {
      const res = await api.get(`${API_BASE}/master/suppliers`);
      const supplier = res.data[0];
      expect(supplier).toHaveProperty('id');
      expect(supplier).toHaveProperty('name');
      expect(supplier).toHaveProperty('performanceScore');
    });
  });

  describe('GET /master/categories', () => {
    it('returns categories array', async () => {
      const res = await api.get(`${API_BASE}/master/categories`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('each category has id, name, and type', async () => {
      const res = await api.get(`${API_BASE}/master/categories`);
      const cat = res.data[0];
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('name');
      expect(cat).toHaveProperty('type');
    });

    it('supports type query param', async () => {
      const res = await api.get(`${API_BASE}/master/categories`, {
        params: { type: 'GOODS' },
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });
  });

  describe('GET /master/warehouses/active', () => {
    it('returns active warehouses array', async () => {
      const res = await api.get(`${API_BASE}/master/warehouses/active`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('each warehouse has id, name, and status', async () => {
      const res = await api.get(`${API_BASE}/master/warehouses/active`);
      const wh = res.data[0];
      expect(wh).toHaveProperty('id');
      expect(wh).toHaveProperty('name');
      expect(wh).toHaveProperty('status');
    });

    it('all returned warehouses have ACTIVE status', async () => {
      const res = await api.get(`${API_BASE}/master/warehouses/active`);
      for (const wh of res.data) {
        expect(wh.status).toBe('ACTIVE');
      }
    });
  });

  describe('GET /master/materials', () => {
    it('returns materials array', async () => {
      const res = await api.get(`${API_BASE}/master/materials`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('each material has required fields', async () => {
      const res = await api.get(`${API_BASE}/master/materials`);
      const mat = res.data[0];
      expect(mat).toHaveProperty('id');
      expect(mat).toHaveProperty('name');
      expect(mat).toHaveProperty('type');
      expect(mat).toHaveProperty('unit');
      expect(mat).toHaveProperty('stockQty');
      expect(mat).toHaveProperty('category');
    });

    it('material includes nested category', async () => {
      const res = await api.get(`${API_BASE}/master/materials`);
      const cat = res.data[0].category;
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('name');
    });
  });

  describe('Error Handling', () => {
    it('returns 404 for nonexistent master endpoint', async () => {
      server.use(
        http.get(`${API_BASE}/master/nonexistent`, () => {
          return HttpResponse.json({ message: 'Not found' }, { status: 404 });
        }),
      );

      try {
        await api.get(`${API_BASE}/master/nonexistent`);
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });

    it('returns 500 for server error', async () => {
      server.use(
        http.get(`${API_BASE}/master/customers`, () => {
          return HttpResponse.json({ message: 'Database error' }, { status: 500 });
        }),
      );

      try {
        await api.get(`${API_BASE}/master/customers`);
      } catch (error: any) {
        expect(error.response?.status).toBe(500);
      }
    });
  });
});
