import type { SiteManifest } from '../../packages/core/shared/types/manifest'

/**
 * Produkt-Wahl dieser Site — Single Source of Truth; `pnpm check:manifests`
 * hält `extends` (nuxt.config.ts) und die @pukalani/*-Dependencies
 * (package.json) deckungsgleich. core + system sind implizit immer dabei.
 *
 * branding.supply trägt den Brand-Wizard und seit MV1 M1 (2026-09-05) den
 * Marktvergleich. Das Zuhause ist die Kehrtwende vom 2026-08-31 (Infra-Plan
 * §1): der Wizard zieht aus `portfolio` aus und lebt unter seiner eigenen
 * Marke mit eigenem Konten-Stamm im Appwrite-Projekt `branding`.
 *
 * `market` steht NACH `brand`, und das ist keine Geschmacksfrage: die
 * kanonische EXTENDS_ORDER in `scripts/check-manifests.mjs` kennt beide nicht
 * und hängt sie deshalb in DIESER Reihenfolge ans Ende — die
 * `nuxt.config.ts` muss identisch lauten, sonst ist der Manifest-Wächter rot.
 * Inhaltlich passt es: market hängt per `requires` an brand, seine
 * Komponenten kollidieren mit keiner brand-Datei (eigener `Mk`-Präfix), und
 * die Werkstatt-Optik soll aus brand kommen.
 */
export default {
  siteId: 'branding',
  products: [
    'themes',
    // Betreiber-Konsole + Konto-Seiten (Davids Entscheidung 2026-09-03,
    // „Dashboard-Zugang wie auf allen anderen Pukalani-Websites").
    'admin',
    'brand',
    'market',
    // Rechtsseiten als CMS (BS1 R1, 2026-09-07 — Plan
    // docs/plans/BRANDING-SUPPLY-RECHT-UND-BEZAHLUNG.md §9 Frage 1): Impressum,
    // Datenschutz und AGB entstehen als Entwurfs-Zeilen in der Tabelle `pages`
    // (`pnpm --filter branding seed:legal`) und werden unter /dashboard/pages
    // gefüllt — eine Korrektur des Anwalts ist damit eine Bearbeitung und kein
    // Deploy. Steht ZULETZT unter den Produkten: seine dynamische Route
    // `/[slug]` hat die niedrigste Priorität und darf keine Wizard-Seite
    // überlagern (früher gelistet = höhere Priorität).
    'pages',
  ],
} satisfies SiteManifest
