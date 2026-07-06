import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '@/lib/api';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

describe('API Client — Bussdev Integration', () => {
  const API_BASE = '/api';

  describe('GET /bussdev/leads', () => {
    it('returns leads array successfully', async () => {
      const res = await api.get(`${API_BASE}/bussdev/leads`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('each lead has required fields', async () => {
      const res = await api.get(`${API_BASE}/bussdev/leads`);
      const lead = res.data[0];
      expect(lead).toHaveProperty('id');
      expect(lead).toHaveProperty('clientName');
      expect(lead).toHaveProperty('status');
      expect(lead).toHaveProperty('estimatedValue');
    });
  });

  describe('GET /bussdev/dashboard', () => {
    it('returns dashboard overview structure', async () => {
      const res = await api.get(`${API_BASE}/bussdev/dashboard`);
      expect(res.data).toHaveProperty('overview');
      expect(res.data).toHaveProperty('revenuePipeline');
      expect(res.data).toHaveProperty('activityPerformance');
      expect(res.data).toHaveProperty('criticalAlerts');
    });

    it('overview has all KPI fields', async () => {
      const res = await api.get(`${API_BASE}/bussdev/dashboard`);
      const overview = res.data.overview;
      expect(overview).toHaveProperty('totalLeads');
      expect(overview).toHaveProperty('contactRate');
      expect(overview).toHaveProperty('dealRate');
      expect(overview).toHaveProperty('retentionRate');
    });
  });

  describe('POST /bussdev/lead', () => {
    it('creates a new lead successfully', async () => {
      const newLead = {
        clientName: 'Test Client',
        brandName: 'Test Brand',
        contactInfo: 'test@test.com',
        source: 'REFERRAL',
        productInterest: 'Skincare',
        estimatedValue: 100000000,
      };

      const res = await api.post(`${API_BASE}/bussdev/lead`, newLead);
      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      expect(res.data).toHaveProperty('status', 'NEW_LEAD');
    });
  });

  describe('GET /bussdev/lead/:id/balance', () => {
    it('returns balance with percentage', async () => {
      const res = await api.get(`${API_BASE}/bussdev/lead/1/balance`);
      expect(res.data).toHaveProperty('totalEstimated');
      expect(res.data).toHaveProperty('totalPaid');
      expect(res.data).toHaveProperty('balance');
      expect(res.data).toHaveProperty('percentagePaid');
    });
  });

  describe('GET /bussdev/analytics/funnel', () => {
    it('returns funnel counts and conversion rates', async () => {
      const res = await api.get(`${API_BASE}/bussdev/analytics/funnel`);
      expect(res.data).toHaveProperty('counts');
      expect(res.data).toHaveProperty('conversion');
      expect(res.data.counts).toHaveProperty('totalLeads');
      expect(res.data.conversion).toHaveProperty('contactRate');
    });
  });

  describe('GET /bussdev/staffs', () => {
    it('returns staff with selected fields', async () => {
      const res = await api.get(`${API_BASE}/bussdev/staffs`);
      expect(Array.isArray(res.data)).toBe(true);
      if (res.data.length > 0) {
        expect(res.data[0]).toHaveProperty('id');
        expect(res.data[0]).toHaveProperty('name');
      }
    });
  });

  describe('GET /bussdev/analytics/staff-performance', () => {
    it('returns performance metrics array', async () => {
      const res = await api.get(`${API_BASE}/bussdev/analytics/staff-performance`);
      expect(Array.isArray(res.data)).toBe(true);
      if (res.data.length > 0) {
        const staff = res.data[0];
        expect(staff).toHaveProperty('name');
        expect(staff).toHaveProperty('leads');
        expect(staff).toHaveProperty('actualRevenue');
        expect(staff).toHaveProperty('status');
      }
    });
  });

  describe('Error Handling', () => {
    it('returns 401 for unauthorized requests', async () => {
      server.use(
        http.get(`${API_BASE}/bussdev/leads`, () => {
          return new HttpResponse(null, { status: 401 });
        }),
      );

      try {
        await api.get(`${API_BASE}/bussdev/leads`);
      } catch (error: any) {
        expect(error.response?.status).toBe(401);
      }
    });

    it('returns 404 for nonexistent resources', async () => {
      server.use(
        http.get(`${API_BASE}/bussdev/nonexistent`, () => {
          return new HttpResponse(null, { status: 404 });
        }),
      );

      try {
        await api.get(`${API_BASE}/bussdev/nonexistent`);
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });
  });

  describe('Response Content Type', () => {
    it('all responses are application/json', async () => {
      const res = await api.get(`${API_BASE}/bussdev/leads`);
      expect(res.headers['content-type']).toContain('json');
    });
  });
});
