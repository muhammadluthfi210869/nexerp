"use client";

type ErrorLevel = "fatal" | "error" | "warning" | "info";

interface ErrorReport {
  id: string;
  level: ErrorLevel;
  message: string;
  stack?: string;
  digest?: string;
  componentName?: string;
  route: string;
  timestamp: string;
  userAgent: string;
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, unknown>;
}

const STORAGE_KEY = "nex_errors";
const MAX_BATCH = 20;
const FLUSH_INTERVAL = 10000;
const API_ENDPOINT = "/api/system/error-report";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getRoute(): string {
  if (typeof window !== "undefined") {
    return window.location.pathname + window.location.search;
  }
  return "";
}

function getUserInfo(): { userId?: string; userEmail?: string } {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      return { userId: user?.id, userEmail: user?.email };
    }
  } catch {}
  return {};
}

const pendingQueue: ErrorReport[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

function getQueue(): ErrorReport[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: ErrorReport[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {}
}

function addToQueue(report: ErrorReport) {
  const queue = getQueue();
  queue.push(report);
  saveQueue(queue.slice(-MAX_BATCH));
}

async function flushToBackend() {
  const queue = getQueue();
  if (queue.length === 0) return;
  try {
    await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ errors: queue.slice(0, MAX_BATCH) }),
      keepalive: true,
    });
    const remaining = queue.slice(MAX_BATCH);
    saveQueue(remaining);
  } catch {
    // Silently fail - will retry next flush
  }
}

function startFlushTimer() {
  if (flushTimer || typeof window === "undefined") return;
  flushTimer = setInterval(flushToBackend, FLUSH_INTERVAL);
  window.addEventListener("beforeunload", flushToBackend);
}

export function trackError(error: Error | string, options?: {
  level?: ErrorLevel;
  componentName?: string;
  digest?: string;
  metadata?: Record<string, unknown>;
}) {
  const message = typeof error === "string" ? error : error.message;
  const stack = typeof error === "string" ? undefined : error.stack;

  if (process.env.NODE_ENV === "development") {
    console.error(`[ErrorTracker] ${message}`, { stack, ...options });
  }

  const report: ErrorReport = {
    id: generateId(),
    level: options?.level || "error",
    message,
    stack: stack?.slice(0, 2000),
    digest: options?.digest,
    componentName: options?.componentName,
    route: getRoute(),
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    ...getUserInfo(),
    metadata: options?.metadata,
  };

  addToQueue(report);

  if (options?.level === "fatal") {
    flushToBackend();
  }
}

export function trackApiError(url: string, status: number, message: string, durationMs?: number) {
  trackError(`[API ${status}] ${message}`, {
    level: status >= 500 ? "error" : "warning",
    metadata: { apiUrl: url, statusCode: status, durationMs },
  });
}

export function initializeErrorTracking() {
  startFlushTimer();
}

if (typeof window !== "undefined") {
  startFlushTimer();
}
