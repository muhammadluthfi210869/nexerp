// Konfigurasi Sentry untuk Edge Runtime (middleware, route handlers edge).
// DSN dibaca dari SENTRY_DSN (server-only env).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Edge runtime tidak mendukung semua integration — pertahankan minimal.
  tracesSampleRate: 1,
  debug: false,
});
