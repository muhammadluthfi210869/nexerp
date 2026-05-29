import { describe, it, expect } from 'vitest';
import { api } from '@/lib/api';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

const API_BASE = '/api';

describe('API Client — Warehouse Integration', () => {
  describe('GET /warehouse/stats', () => {
    it('returns warehouse stats object', async () => {
      const res = await api.get(`${API_BASE}/warehouse/stats`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('capacity');
      expect(res.data).toHaveProperty('valuation');
      expect(res.data).toHaveProperty('turnover');
      expect(res.data).toHaveProperty('risk');
    });

    it('capacity has utility, accuracy, and fifoScore', async () => {
      const res = await api.get(`${API_BASE}/warehouse/stats`);
      const cap = res.data.capacity;
      expect(cap).toHaveProperty('utility');
      expect(cap).toHaveProperty('accuracy');
      expect(cap).toHaveProperty('fifoScore');
    });

    it('valuation has total breakdown by type', async () => {
      const res = await api.get(`${API_BASE}/warehouse/stats`);
      const val = res.data.valuation;
      expect(val).toHaveProperty('total');
      expect(val).toHaveProperty('raw');
      expect(val).toHaveProperty('pack');
      expect(val).toHaveProperty('box');
      expect(val).toHaveProperty('label');
    });

    it('risk has deadStock, criticalItems, agingKarantina', async () => {
      const res = await api.get(`${API_BASE}/warehouse/stats`);
      const risk = res.data.risk;
      expect(risk).toHaveProperty('deadStock');
      expect(risk).toHaveProperty('criticalItems');
      expect(risk).toHaveProperty('agingKarantina');
    });
  });

  describe('GET /warehouse/catalog', () => {
    it('returns catalog array', async () => {
      const res = await api.get(`${API_BASE}/warehouse/catalog`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('each item has required fields', async () => {
      const res = await api.get(`${API_BASE}/warehouse/catalog`);
      const item = res.data[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('unit');
      expect(item).toHaveProperty('stockQty');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('inventories');
      expect(item).toHaveProperty('valuations');
    });
  });

  describe('GET /warehouse/inbounds', () => {
    it('returns inbounds array', async () => {
      const res = await api.get(`${API_BASE}/warehouse/inbounds`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('each inbound has required fields', async () => {
      const res = await api.get(`${API_BASE}/warehouse/inbounds`);
      const inbound = res.data[0];
      expect(inbound).toHaveProperty('id');
      expect(inbound).toHaveProperty('inboundNumber');
      expect(inbound).toHaveProperty('status');
      expect(inbound).toHaveProperty('items');
      expect(inbound).toHaveProperty('po');
    });

    it('inbound items have material details', async () => {
      const res = await api.get(`${API_BASE}/warehouse/inbounds`);
      const item = res.data[0].items[0];
      expect(item).toHaveProperty('materialId');
      expect(item).toHaveProperty('qtyActual');
      expect(item).toHaveProperty('material');
    });
  });

  describe('GET /warehouse/audit', () => {
    it('returns audit data with all sections', async () => {
      const res = await api.get(`${API_BASE}/warehouse/audit`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('jalurA');
      expect(res.data).toHaveProperty('jalurB');
      expect(res.data).toHaveProperty('jalurC');
    });

    it('jalurA has inbound, karantina, velocity', async () => {
      const res = await api.get(`${API_BASE}/warehouse/audit`);
      const jalurA = res.data.jalurA;
      expect(jalurA).toHaveProperty('inbound');
      expect(jalurA).toHaveProperty('karantina');
      expect(jalurA).toHaveProperty('velocity');
    });

    it('audit has arrays for materials and logs', async () => {
      const res = await api.get(`${API_BASE}/warehouse/audit`);
      expect(Array.isArray(res.data.sensitiveMaterials)).toBe(true);
      expect(Array.isArray(res.data.recentLogs)).toBe(true);
    });
  });

  describe('GET /warehouse/locations', () => {
    it('returns locations array', async () => {
      const res = await api.get(`${API_BASE}/warehouse/locations`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('each location has required fields', async () => {
      const res = await api.get(`${API_BASE}/warehouse/locations`);
      const loc = res.data[0];
      expect(loc).toHaveProperty('id');
      expect(loc).toHaveProperty('name');
      expect(loc).toHaveProperty('capacity');
      expect(loc).toHaveProperty('currentUsage');
      expect(loc).toHaveProperty('warehouseId');
    });
  });

  describe('Error Handling', () => {
    it('returns error for invalid endpoint', async () => {
      server.use(
        http.get(`${API_BASE}/warehouse/nonexistent`, () => {
          return HttpResponse.json({ message: 'Endpoint not found' }, { status: 404 });
        }),
      );

      try {
        await api.get(`${API_BASE}/warehouse/nonexistent`);
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });

    it('returns 500 for server error', async () => {
      server.use(
        http.get(`${API_BASE}/warehouse/stats`, () => {
          return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
        }),
      );

      try {
        await api.get(`${API_BASE}/warehouse/stats`);
      } catch (error: any) {
        expect(error.response?.status).toBe(500);
      }
    });
  });
});
