import type { UserConfig } from 'vitest/config';

export default {
  test: {
    environment: 'happy-dom',
    globals: true,
    coverage: {
      exclude: ['./*.config.{js,ts,mts}', 'dist'],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
} satisfies UserConfig;
