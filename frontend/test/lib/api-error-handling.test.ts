import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractApiError, api } from '@/lib/api';
import axios from 'axios';

describe('extractApiError', () => {
  it('extracts error from AxiosError with response data', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
        },
      },
      message: 'Request failed with status code 422',
      config: {} as any,
      code: 'ERR_BAD_REQUEST',
      name: 'AxiosError',
      status: 422,
      toJSON: vi.fn(),
      stack: '',
      headers: {},
      request: {},
    };
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const result = extractApiError(axiosError);
    expect(result.status).toBe(422);
    expect(result.message).toBe('Validation failed');
    expect(result.code).toBe('VALIDATION_ERROR');
  });

  it('falls back to error.message when response data has no message', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 500,
        data: {},
      },
      message: 'Network Error',
      config: {} as any,
      code: 'ERR_NETWORK',
      name: 'AxiosError',
      status: 500,
      toJSON: vi.fn(),
      stack: '',
      headers: {},
      request: {},
    };
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const result = extractApiError(axiosError);
    expect(result.status).toBe(500);
    expect(result.message).toBe('Network Error');
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  it('handles error with no response (network error)', () => {
    const axiosError = {
      isAxiosError: true,
      response: undefined,
      message: 'Network Error',
      config: {} as any,
      code: 'ERR_NETWORK',
      name: 'AxiosError',
      status: 500,
      toJSON: vi.fn(),
      stack: '',
      headers: {},
      request: {},
    };
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const result = extractApiError(axiosError);
    expect(result.status).toBe(500);
    expect(result.message).toBe('Network Error');
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  it('extracts error from standard Error instance', () => {
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);
    const error = new Error('Something broke');

    const result = extractApiError(error);
    expect(result.status).toBe(500);
    expect(result.message).toBe('Something broke');
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  it('handles completely unknown error types', () => {
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

    const result = extractApiError('string error');
    expect(result.status).toBe(500);
    expect(result.message).toBe('Unknown error');
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  it('handles null error', () => {
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

    const result = extractApiError(null);
    expect(result.status).toBe(500);
    expect(result.message).toBe('Unknown error');
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  it('handles undefined error', () => {
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

    const result = extractApiError(undefined);
    expect(result.status).toBe(500);
    expect(result.message).toBe('Unknown error');
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  it('handles numeric error', () => {
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

    const result = extractApiError(42);
    expect(result.status).toBe(500);
    expect(result.message).toBe('Unknown error');
    expect(result.code).toBe('UNKNOWN_ERROR');
  });

  it('handles AxiosError with missing code in response data', () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 404,
        data: { message: 'Not found' },
      },
      message: 'Request failed with status code 404',
      config: {} as any,
      code: 'ERR_BAD_REQUEST',
      name: 'AxiosError',
      status: 404,
      toJSON: vi.fn(),
      stack: '',
      headers: {},
      request: {},
    };
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const result = extractApiError(axiosError);
    expect(result.status).toBe(404);
    expect(result.message).toBe('Not found');
    expect(result.code).toBe('UNKNOWN_ERROR');
  });
});

describe('API client configuration', () => {
  it('api instance has timeout set', () => {
    expect(api.defaults.timeout).toBe(15000);
  });

  it('api instance has JSON content type header', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });
});
