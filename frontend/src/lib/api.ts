import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : '/api');

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export function extractApiError(error: unknown): { status: number; message: string; code: string } {
  if (axios.isAxiosError(error)) {
    return {
      status: error.response?.status ?? 500,
      message: error.response?.data?.message ?? error.message ?? "Unknown error",
      code: error.response?.data?.code ?? "UNKNOWN_ERROR",
    };
  }
  if (error instanceof Error) {
    return { status: 500, message: error.message, code: "UNKNOWN_ERROR" };
  }
  return { status: 500, message: "Unknown error", code: "UNKNOWN_ERROR" };
}

// Request Interceptor: Attach JWT Token
api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401 Unauthorized & 403 Forbidden
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

