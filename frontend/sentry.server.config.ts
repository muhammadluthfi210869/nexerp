// Konfigurasi Sentry untuk sisi server (route handlers, server components,
// getServerSideProps, dll). DSN dibaca dari SENTRY_DSN (server-only env).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Tangkap error server secara otomatis.
  tracesSampleRate: 1,

  // Aktifkan saat debugging; matikan di produksi.
  debug: false,
});
