import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // jsdom provides document/window for safeQuery and tableSort tests.
    // Requires: npm install -D jsdom
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
  },
});
