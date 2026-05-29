import { describe, it, expect } from 'vitest';
import { api } from '@/lib/api';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';

const API_BASE = '/api';

describe('API Client — R&D Integration', () => {
  describe('GET /rnd/dashboard', () => {
    it('returns dashboard metrics', async () => {
      const res = await api.get(`${API_BASE}/rnd/dashboard`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('totalSamples');
      expect(res.data).toHaveProperty('activeSamples');
      expect(res.data).toHaveProperty('completedSamples');
      expect(res.data).toHaveProperty('formulasCount');
      expect(res.data).toHaveProperty('inboxCount');
    });

    it('metrics are numeric values', async () => {
      const res = await api.get(`${API_BASE}/rnd/dashboard`);
      expect(typeof res.data.totalSamples).toBe('number');
      expect(typeof res.data.activeSamples).toBe('number');
    });
  });

  describe('GET /rnd/samples', () => {
    it('returns samples array', async () => {
      const res = await api.get(`${API_BASE}/rnd/samples`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('each sample has required fields', async () => {
      const res = await api.get(`${API_BASE}/rnd/samples`);
      const sample = res.data[0];
      expect(sample).toHaveProperty('id');
      expect(sample).toHaveProperty('sampleNumber');
      expect(sample).toHaveProperty('productName');
      expect(sample).toHaveProperty('status');
      expect(sample).toHaveProperty('currentStage');
    });
  });

  describe('GET /rnd/formulas', () => {
    it('returns formulas array', async () => {
      const res = await api.get(`${API_BASE}/rnd/formulas`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('each formula has required fields', async () => {
      const res = await api.get(`${API_BASE}/rnd/formulas`);
      const formula = res.data[0];
      expect(formula).toHaveProperty('id');
      expect(formula).toHaveProperty('code');
      expect(formula).toHaveProperty('name');
      expect(formula).toHaveProperty('version');
      expect(formula).toHaveProperty('status');
    });
  });

  describe('GET /rnd/inbox', () => {
    it('returns inbox array', async () => {
      const res = await api.get(`${API_BASE}/rnd/inbox`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('inbox items have required fields', async () => {
      const res = await api.get(`${API_BASE}/rnd/inbox`);
      const item = res.data[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('sampleNumber');
      expect(item).toHaveProperty('clientName');
      expect(item).toHaveProperty('status');
    });
  });

  describe('GET /rnd/pipeline', () => {
    it('returns pipeline data', async () => {
      const res = await api.get(`${API_BASE}/rnd/pipeline`);
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('stages');
      expect(res.data).toHaveProperty('totalSamples');
      expect(Array.isArray(res.data.stages)).toBe(true);
    });

    it('pipeline stages have required fields', async () => {
      const res = await api.get(`${API_BASE}/rnd/pipeline`);
      const stage = res.data.stages[0];
      expect(stage).toHaveProperty('name');
      expect(stage).toHaveProperty('count');
    });
  });

  describe('Error Handling', () => {
    it('returns error for invalid endpoint', async () => {
      server.use(
        http.get(`${API_BASE}/rnd/nonexistent`, () => {
          return new HttpResponse(null, { status: 404 });
        }),
      );

      try {
        await api.get(`${API_BASE}/rnd/nonexistent`);
      } catch (error: any) {
        expect(error.response?.status).toBe(404);
      }
    });

    it('returns 500 for server errors', async () => {
      server.use(
        http.get(`${API_BASE}/rnd/samples`, () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      try {
        await api.get(`${API_BASE}/rnd/samples`);
      } catch (error: any) {
        expect(error.response?.status).toBe(500);
      }
    });
  });
});
