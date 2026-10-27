import { defineConfig } from 'vitest/config';
import path from 'path';

const root = path.resolve(__dirname);

export default defineConfig({
  resolve: {
    alias: {
      '@': root,
    },
  },
  test: {
    globals: false,
    environment: 'node',
    setupFiles: ['./tests/setupTests.ts'],
    include: ['tests/**/*.test.ts'],
    passWithNoTests: false,
  },
});
