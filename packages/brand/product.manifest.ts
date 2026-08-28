import type { ProductManifest } from '../core/shared/types/manifest'

/**
 * Brand-Wizard (Phase 1 "Fundament") — KI-Markenberater "George".
 * Plan: docs/plans/BRAND-WIZARD-PHASE-1.md. Aktueller Stand: P0b-Clickdummy
 * im .playground (statische Daten); Tabellen/Routen folgen mit P1a/P1b.
 */
export default {
  key: 'brand',
  tier: 'optional',
  hasMigrations: false,
  apiPrefixes: ['/api/brand'],
  title: { en: 'Brand Wizard', de: 'Brand-Wizard' },
  description: {
    en: 'Guided AI brand consultant: build a complete brand foundation — purpose, values, archetype, voice and manifesto.',
    de: 'Geführter KI-Markenberater: eine vollständige Brand Foundation — Purpose, Werte, Archetyp, Stimme und Manifest.',
  },
  icon: 'i-ph-compass',
} satisfies ProductManifest
