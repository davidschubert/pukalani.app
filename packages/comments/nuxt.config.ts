import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))

/**
 * Produkt Layer: Reddit-artiges Kommentarsystem (eigenes Datenmodell —
 * Regel 3: eigene Tables, deshalb niemals Core). Extended den Core NICHT
 * selbst — die App komponiert beide: extends: [comments, core].
 * Spec: reddit-comment-system-setup (targetId/targetType-Architektur).
 */
export default defineNuxtConfig({
  // Layer-stores werden nicht auto-gescannt (Stolperfalle)
  imports: {
    dirs: [join(currentDir, './app/stores')],
  },

  /**
   * ALT-PFAD (U8/G7, 2026-08-11): das Einbetter-Register ist vom flachen
   * `/dashboard/embed` in den Community-Hub gezogen. Beide Locales, weil eine
   * routeRule nur Pfade sieht (`prefix_except_default`: `en` ohne Prefix,
   * `de` unter `/de/*`).
   */
  routeRules: {
    '/dashboard/embed': { redirect: { to: '/dashboard/community/embed', statusCode: 301 } },
    '/de/dashboard/embed': { redirect: { to: '/de/dashboard/community/embed', statusCode: 301 } },
  },

  // Eigene Layer-Strings — mergen mit Core- und App-Locales (gleiche codes)
  i18n: {
    locales: [
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
  },
})
