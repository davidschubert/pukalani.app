import { defineConfig } from 'vitest/config'

// Das test-Script läuft als `nuxi prepare && vitest run`: Vites oxc-Transform
// lädt die tsconfig.json der App, und die referenziert .nuxt/tsconfig.*.json —
// ohne prepare (frischer Checkout, CI) stirbt sonst jeder Transform an
// „Tsconfig not found". Gleiche Begründung wie in apps/marketing.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
