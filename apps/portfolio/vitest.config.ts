import { defineConfig } from 'vitest/config'

/**
 * Unit-Tests dieser App (Muster `apps/marketing/vitest.config.ts`).
 *
 * `include` ist ENG auf `tests/**` gesetzt und das ist keine Kosmetik: Vitests
 * Vorgabe (`**\/*.{test,spec}.*`) würde `e2e/smoke.spec.ts` mitnehmen — eine
 * Playwright-Spec, die unter Vitest weder Browser noch Fixtures findet und mit
 * einem Fehler stirbt, der nichts mit dem Testgegenstand zu tun hat.
 *
 * Das test-Script läuft als `nuxi prepare && vitest run`: Vites oxc-Transform
 * liest die `tsconfig.json` der App, und die referenziert `.nuxt/tsconfig.*.json` —
 * ohne prepare (frischer Checkout, CI) stirbt jeder Transform an
 * „Tsconfig not found".
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
