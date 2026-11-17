import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    alias: {
      '@undercover/shared': path.resolve(__dirname, 'shared/types/index.ts'),
    },
  },
  resolve: {
    alias: {
      '@undercover/shared': path.resolve(__dirname, 'shared/types/index.ts'),
    },
  },
});
