import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDir = dirname(fileURLToPath(import.meta.url))

/**
 * brand-Layer — Brand-Wizard (Plan: docs/plans/BRAND-WIZARD-PHASE-1.md).
 * Enthält die UI-Komponenten des Clickdummys (app/components, `Bw*`), die
 * Design-Tokens, die Routen unter /api/brand/** (P1b) und seit P1c die
 * ECHTEN Seiten (app/pages, app/stores, app/composables, app/layouts).
 * Der Dummy selbst läuft im .playground — Punkt-Ordner werden vom
 * Manifest-Scan und von extends nicht erfasst.
 */
export default defineNuxtConfig({
  // absoluter Pfad wie im Core-Layer (relative css-Pfade lösen Apps sonst
  // relativ zu sich selbst auf)
  css: [join(currentDir, './app/assets/css/brand.css')],

  // Layer-stores werden nicht auto-gescannt (Stolperfalle, CLAUDE.md)
  imports: {
    dirs: [join(currentDir, './app/stores')],
  },

  // Eigene Layer-Strings — mergen mit Core- und App-Locales (gleiche codes).
  // Sie lösen die Schuld ein, die `app/app.config.ts` seit P1a notiert:
  // `completionCta.labelKey` versprach `brand.cta.book`, ohne dass es den
  // Schlüssel gab. Der Wächter `pnpm check:i18n-keys` prüft es jetzt.
  i18n: {
    locales: [
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
  },
})
