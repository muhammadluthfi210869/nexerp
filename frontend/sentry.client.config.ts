// Konfigurasi Sentry untuk browser (client-side).
// DSN dibaca dari NEXT_PUBLIC_SENTRY_DSN (bisa di-bundle ke client).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Tangkap error + unhandled rejection di browser secara otomatis.
  tracesSampleRate: 1,

  // Aktifkan saat debugging; matikan di produksi.
  debug: false,

  // Profiling opsional — nyalakan nanti bila perlu.
  // replaysSessionSampleRate: 0.1,
  // replaysOnErrorSampleRate: 1.0,
});
