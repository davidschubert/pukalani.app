import type { SiteManifest } from '../../packages/core/shared/types/manifest'

/**
 * Produkt-Wahl dieser Site — Single Source of Truth; `pnpm check:manifests`
 * hält `extends` (nuxt.config.ts) und die @pukalani/*-Dependencies
 * (package.json) deckungsgleich. core + system sind implizit immer dabei.
 *
 * branding.supply trägt GENAU EIN Produkt: den Brand-Wizard. Das ist die
 * Kehrtwende vom 2026-08-31 (Infra-Plan §1): der Wizard zieht aus `portfolio`
 * aus und lebt unter seiner eigenen Marke mit eigenem Konten-Stamm im
 * Appwrite-Projekt `branding`.
 */
export default {
  siteId: 'branding',
  products: [
    'themes',
    // Betreiber-Konsole + Konto-Seiten (Davids Entscheidung 2026-09-03,
    // „Dashboard-Zugang wie auf allen anderen Pukalani-Websites").
    'admin',
    'brand',
  ],
} satisfies SiteManifest
