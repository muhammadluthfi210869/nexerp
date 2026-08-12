import axios from "axios";
import { getMockData } from "@/lib/mock-data";

/**
 * ── PROTOTYPE MODE ─────────────────────────────────────────────
 * Aktifkan dengan NEXT_PUBLIC_PROTOTYPE_MODE=true (lihat .env.local).
 *
 * Saat aktif, SEMUA panggilan API frontend di-short-circuit ke
 * data contoh (mock-data.ts) — TANPA backend, TANPA database.
 * Cocok untuk demo ke bos / calon klien: `cd frontend && npm run dev`.
 *
 * Login prototype: superadmin@dreamlab.id / password123
 * (bukan untuk operasional — badge "PROTOTYPE MODE" tampil di dashboard).
 */
export const IS_PROTOTYPE_MODE =
  process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true";

const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' &&
   (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? ''
    : 'https://nexerp.id');

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

if (IS_PROTOTYPE_MODE) {
  // Custom adapter: gantikan request jaringan dengan data contoh.
  api.defaults.adapter = async (config) => {
    const url = config.url || "";
    const method = (config.method || "get").toLowerCase();

    if (method === "get") {
      return {
        data: getMockData(url),
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      };
    }

    // Mutasi (create/edit/delete) → no-op sukses (tidak dipersist).
    return {
      data: {
        success: true,
        message: "PROTOTYPE MODE — perubahan tidak disimpan (data contoh)",
        data: null,
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
}

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

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

