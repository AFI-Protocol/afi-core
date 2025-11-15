import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/**/*.test.ts', 'tests/**/*.spec.ts']
    }
});
//# sourceMappingURL=vitest.config.js.map