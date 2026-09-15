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
// Dedup window: 5 seconds. Multiple concurrent 401s only redirect once.
// ponytail: simple timestamp-based dedup. Trade-off: clock skew across
// tabs could let through 2 redirects in same window — fine since /login
// is idempotent. Upgrade to BroadcastChannel if multi-tab dedup matters.
const REDIRECT_DEDUP_MS = 5000;
let lastRedirectAt = 0;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const onLogin = window.location.pathname === "/login";
      const now = Date.now();
      const withinDedupWindow = now - lastRedirectAt < REDIRECT_DEDUP_MS;

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Clear auth cookie too (path=/ so all routes lose it)
      document.cookie = "token=; path=/; max-age=0;";

      if (!onLogin && !withinDedupWindow) {
        lastRedirectAt = now;
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

