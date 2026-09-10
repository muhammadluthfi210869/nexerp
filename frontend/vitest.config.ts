import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    css: false,
    include: ['test/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'tests'],
    env: {
      // Use absolute URL so axios node adapter accepts it, but MSW intercepts
      // the /api/* path portion via the handler patterns
      NEXT_PUBLIC_API_URL: 'http://localhost',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
