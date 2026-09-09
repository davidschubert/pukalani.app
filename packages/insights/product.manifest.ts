import type { ProductManifest } from '../core/shared/types/manifest'

/**
 * Brand Insights — der redaktionelle Bereich von branding.supply: Markenprofile
 * fremder Marken, Brand-Duelle, Artikel und Rankings, jede Aussage mit Quelle.
 * Plan: docs/plans/BRAND-INSIGHTS.md (Konzept ENTSCHIEDEN 2026-09-08, die acht
 * Entscheidungen in §11; Frage 1 = „eigener Layer `insights`").
 *
 * STAND: **PROTOTYP I0** (Paket I0 aus §9.9) — dieser Layer trägt heute NUR
 * die Vorlagen des Klickdummys (`app/components`, `In*`) und den PRODUKT-
 * VERTRAG (`shared/insightsPost.ts`). Es gibt KEINE Tabelle, KEINE Route,
 * KEINEN Modell-Aufruf und KEINE Naht zum brand-Layer. Sie kommen mit I1/I2
 * und übernehmen genau diese Bausteine.
 *
 * `hasMigrations: false` — und das ist keine Nachlässigkeit, sondern die
 * Reihenfolge: die drei Tabellen (`insights_posts`, `insights_brands`,
 * `insights_corrections`) stehen in §9.3 fertig da, aber ihr Gate ist Davids
 * Ja zur Prod-Migration (I1). Solange kein `scripts/migrations/`-Ordner
 * existiert, verlangt `pnpm check:manifests` hier `false` — und der Layer
 * gehört bis dahin AUCH NICHT in die LAYER_ORDER von `scripts/migrate.mjs`.
 *
 * `apiPrefixes: []` aus demselben Grund: ein Präfix ist ein Versprechen an die
 * Produkt-Middleware (`core/server/middleware/04.product-gate.ts`), und es
 * wird mit der ersten Route eingelöst. I1 trägt `/api/insights` ein — EIN
 * Präfix und nicht mehrere, damit die Notabschaltung
 * `app_config.products.insights.enabled = false` alles darunter trifft und
 * niemand den zweiten Eintrag vergessen kann.
 *
 * `requires: ['brand']` ist die Bedingung und nicht die Höflichkeit: Score,
 * Band, Farbwelt, Archetyp-Katalog und die Slug-Regel kommen aus dem
 * brand-Layer (§9.1 Nr. 2) — über GENAU EINEN Vertrag in `server/contracts/`,
 * nie über `server/utils/` (Nitro auto-importiert das Verzeichnis; ein
 * Re-Export dort stünde zweimal im Auto-Import, und der spätere Layer gewönne).
 *
 * `tier: 'optional'`: das Manifest kennt nur `foundation | optional`. Insights
 * ist kein Fundament — eine App ohne den Layer verliert eine Redaktion, kein
 * Gerüst.
 *
 * Montiert ist der Layer NOCH NIRGENDS: `apps/branding/site.manifest.ts`
 * bekommt ihn mit I1. Ein Prototyp lebt im `.playground` (Punkt-Ordner erfasst
 * weder der Manifest-Scan noch ein `extends`).
 */
export default {
  key: 'insights',
  tier: 'optional',
  requires: ['brand'],
  hasMigrations: false,
  apiPrefixes: [],
  title: { en: 'Brand Insights', de: 'Brand Insights' },
  description: {
    en: 'The editorial desk: brand profiles, duels, articles and rankings about brands we do not own — every statement with its source.',
    de: 'Der redaktionelle Bereich: Markenprofile, Duelle, Artikel und Rankings über fremde Marken — jede Aussage mit ihrer Quelle.',
  },
  icon: 'i-ph-newspaper',
} satisfies ProductManifest
