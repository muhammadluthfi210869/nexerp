import { describe, it, expect } from 'vitest';
import { api } from '@/lib/api';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

const API_BASE = '/api';

describe('API Client — Production Integration', () => {
  describe('GET /production/analytics/dashboard', () => {
    it('returns dashboard data', async () => {
      const res = await api.get(`${API_BASE}/production/analytics/dashboard`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('activeWorkOrders');
      expect(res.data).toHaveProperty('machinesOnline');
      expect(res.data).toHaveProperty('totalMachines');
    });

    it('metrics are numeric', async () => {
      const res = await api.get(`${API_BASE}/production/analytics/dashboard`);
      expect(typeof res.data.activeWorkOrders).toBe('number');
      expect(typeof res.data.machinesOnline).toBe('number');
    });
  });

  describe('GET /production/work-orders', () => {
    it('returns work orders array', async () => {
      const res = await api.get(`${API_BASE}/production/work-orders`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('each work order has required fields', async () => {
      const res = await api.get(`${API_BASE}/production/work-orders`);
      const wo = res.data[0];
      expect(wo).toHaveProperty('id');
      expect(wo).toHaveProperty('woNumber');
      expect(wo).toHaveProperty('productName');
      expect(wo).toHaveProperty('status');
      expect(wo).toHaveProperty('targetQty');
    });
  });

  describe('GET /production/machines', () => {
    it('returns machines array', async () => {
      const res = await api.get(`${API_BASE}/production/machines`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('each machine has required fields', async () => {
      const res = await api.get(`${API_BASE}/production/machines`);
      const machine = res.data[0];
      expect(machine).toHaveProperty('id');
      expect(machine).toHaveProperty('name');
      expect(machine).toHaveProperty('category');
      expect(machine).toHaveProperty('status');
    });
  });

  describe('GET /production/schedules', () => {
    it('returns schedules array', async () => {
      const res = await api.get(`${API_BASE}/production/schedules`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('each schedule has required fields', async () => {
      const res = await api.get(`${API_BASE}/production/schedules`);
      const schedule = res.data[0];
      expect(schedule).toHaveProperty('id');
      expect(schedule).toHaveProperty('workOrderId');
      expect(schedule).toHaveProperty('stage');
      expect(schedule).toHaveProperty('status');
    });
  });

  describe('GET /production/active', () => {
    it('returns active work orders array', async () => {
      const res = await api.get(`${API_BASE}/production/active`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('active orders have required fields', async () => {
      const res = await api.get(`${API_BASE}/production/active`);
      const active = res.data[0];
      expect(active).toHaveProperty('id');
      expect(active).toHaveProperty('woNumber');
      expect(active).toHaveProperty('status');
      expect(active).toHaveProperty('currentStage');
    });
  });

  describe('Error Handling', () => {
    it('returns error for invalid endpoint', async () => {
      server.use(
        http.get(`${API_BASE}/production/nonexistent`, () => {
          return new HttpResponse(null, { status: 404 });
        }),
      );

      try {
        await api.get(`${API_BASE}/production/nonexistent`);
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });

    it('returns 500 for server errors', async () => {
      server.use(
        http.get(`${API_BASE}/production/work-orders`, () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      try {
        await api.get(`${API_BASE}/production/work-orders`);
      } catch (error: any) {
        expect(error.response?.status).toBe(500);
      }
    });
  });
});
