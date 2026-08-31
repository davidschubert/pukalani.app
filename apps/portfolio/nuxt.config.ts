export default defineNuxtConfig({
  // früher gelistet = höhere Priorität — Produkt Layer vor dem Core.
  // Nicht benötigte Layer einfach entfernen (und aus package.json streichen);
  // core + system bilden das Fundament und bleiben immer.
  // `brand` steht hier, weil pukalani.studio DIE Site des Brand-Wizards ist
  // (Plan §6, Phase 1): eine Site = eine Login-Welt, also kein zweites
  // Appwrite-Projekt — die brand_*-Tabellen liegen in `portfolio`. Der Layer
  // bringt in dieser Fassung NUR `/api/brand/**` mit: seine Seiten leben im
  // .playground (Punkt-Ordner werden von `extends` nicht erfasst), seine
  // Komponenten heissen `Bw*` und sein CSS ist auf `.bw-root` gescopet.
  extends: ['../../packages/themes', '../../packages/admin', '../../packages/analytics', '../../packages/domains', '../../packages/pages', '../../packages/brand', '../../packages/core', '../../packages/system'],

  // Port pro App eindeutig vergeben (Konvention: 3001 comments, 3002+ weitere)
  devServer: {
    port: 3005,
  },

  // Portfolio-Design (Syne + Glibbergreen, DNA der alten davidschubert.com) —
  // gescopet auf body.portfolio-site (site-Layout): Login/Dashboard behalten
  // den Standard-Look. Syne self-hostet @nuxt/fonts über die font-family-
  // Deklaration im CSS (Registry-Muster, kein Google-Link).
  css: ['~/assets/css/portfolio.css'],

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
  },

  // SPRACHRICHTUNG GEDREHT (Content-Umzug aus dem alten Portfolio-Repo):
  // dort lag Deutsch auf `/` und Englisch unter `/en`. Hier gilt die
  // Monorepo-Konvention `prefix_except_default` — Englisch ohne Präfix,
  // Deutsch unter `/de/*`. `/en` und `/en/**` sind damit HISTORISCHE,
  // veröffentlichte und verlinkte Adressen (u. a. aus llms.txt und dem alten
  // Fußzeilen-Link) und leiten dauerhaft (301) auf ihr heutiges Gegenstück.
  // Die Quell-Muster dürfen nie mit umbenannt werden: eine Weiterleitung
  // beschreibt die Vergangenheit, nur ihr Ziel folgt der heutigen Struktur.
  routeRules: {
    '/en': { redirect: { to: '/', statusCode: 301 } },
    '/en/**': { redirect: { to: '/**', statusCode: 301 } },
  },

  // Eigene Keys der App — werden mit den Core-Locales gemergt (gleicher code)
  i18n: {
    locales: [
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
  },
})
