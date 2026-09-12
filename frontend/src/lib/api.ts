import axios from "axios";

// Browser traffic must always use the same-origin reverse proxy. Depending on a
// build-time NEXT_PUBLIC_API_URL previously baked localhost into a production
// bundle, so every user's laptop tried to call its own port 3002.
const API_URL = typeof window !== "undefined"
  ? "/api"
  : process.env.NEXT_PUBLIC_API_URL ?? "http://backend:3001/v1";

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

// Response Interceptor: Handle 401 Unauthorized
// ponytail: isRedirecting guard prevents multiple in-flight 401s from
// queuing multiple navigations (root cause of "auto-refresh per detik" loop).
// Reset after 5s so a fresh page (after user re-logs in) can redirect again.
let isRedirecting = false;
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined" && !isRedirecting && window.location.pathname !== "/login") {
        isRedirecting = true;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        document.cookie = "token=; path=/; max-age=0;";
        window.location.replace("/login");
        setTimeout(() => { isRedirecting = false; }, 5000);
      }
    }
    return Promise.reject(error);
  }
);

