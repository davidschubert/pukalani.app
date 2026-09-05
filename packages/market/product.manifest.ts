import type { ProductManifest } from '../core/shared/types/manifest'

/**
 * Marktvergleich — die Behauptungen der Wettbewerber in DERSELBEN Feldstruktur
 * wie die eigene Brand Foundation, jede mit Zitat und Quelle.
 * Plan: docs/plans/BRAND-MARKTVERGLEICH.md (Strategie + Konzept freigegeben
 * 2026-09-05, alle acht Entscheidungen in §6).
 *
 * STAND: **PROTOTYP (M0)** — vier Screens im `.playground`, sonst nichts.
 * `hasMigrations: false` ist deshalb WAHR und nicht vorläufig: die drei
 * Tabellen (`market_competitors`, `market_profiles`, `market_reports`, §2.6)
 * kommen mit M1; erst dann steht der Layer auch in der LAYER_ORDER von
 * `scripts/migrate.mjs` und im Soll von `pnpm ops:schema-parity`.
 *
 * `requires: ['brand']` ist keine Höflichkeit, sondern die Bedingung: ohne
 * Foundation gibt es keine eigene Behauptung, gegen die man vergleichen
 * könnte (§2.4 — freigeschaltet ab abgenommenem Kapitel B).
 *
 * `tier: 'optional'` IST die Bezahl-Aussage. Das Manifest kennt nur
 * `foundation | optional`; „bezahlt" steht nicht als drittes Wort darin,
 * sondern in der Zuteilung (`entitlementKey`, hier = key) und in der
 * Schranke der Oberfläche (§1.9: „frei bauen, bezahlt anwenden").
 *
 * `apiPrefixes` bleibt LEER, solange es keine Route gibt: ein Präfix, hinter
 * dem nichts liegt, ist ein Versprechen an die Produkt-Gate-Middleware, das
 * niemand einlöst. Er kommt mit der ersten Route in M2.
 */
export default {
  key: 'market',
  tier: 'optional',
  requires: ['brand'],
  hasMigrations: false,
  title: { en: 'Market comparison', de: 'Marktvergleich' },
  description: {
    en: 'Puts your brand foundation next to what competitors publicly say — field by field, every statement with a quote and its source.',
    de: 'Stellt eure Brand Foundation neben das, was Wettbewerber öffentlich sagen — Feld für Feld, jede Aussage mit Zitat und Quelle.',
  },
  icon: 'i-ph-compass',
} satisfies ProductManifest
