export default defineNuxtConfig({
  /**
   * branding.supply — die eigene App des Brand-Wizards (Infra-Plan
   * docs/plans/BRANDING-SUPPLY-INFRA.md §2, Davids Entscheidung 2026-08-31).
   *
   * Früher gelistet = höhere Priorität; core + system sind das Fundament und
   * bleiben immer. Die Menge muss zum Site-Manifest passen — `pnpm
   * check:manifests` erzwingt Reihenfolge UND Menge.
   *
   * SEIT 2026-09-03 MIT `themes` + `admin` (Davids Entscheidung: „als Admin
   * der Seite einen eigenen Dashboard-Zugang, wie auf allen anderen
   * Pukalani-Websites"): die Betreiber-Konsole unter /dashboard (Changelog,
   * Nutzer, Laufzeit-Config — u. a. der brandAiEnabled-Schalter ohne ssh)
   * plus die Konto-Seiten (/dashboard/settings: Sitzungen, Sicherheit,
   * Daten). `themes` kommt mit, weil die Dashboard-Shell über
   * `DashboardUserMenu` an `useTheme()` koppelt. Die admin-Migrationen
   * (001–003, changelog) gehören auf die branding-Instanz gefahren; die
   * Soll-Liste im Schema-Parity-Wächter zieht mit.
   *
   * WEITER OHNE `blueprint`: der Kompositions-Layer zieht per `requires`
   * posts/comments/events/courses mit — vier Produkt-Layer samt Tabellen,
   * von denen der Wizard keinen einzigen anfasst (nachgesehen 2026-08-31);
   * sein Vollbild-Workspace bringt seinen Rahmen über `BwWorkspace` + das
   * eigene Layout `brand-workspace` selbst mit.
   *
   * REIHENFOLGE: themes/admin vorn (kanonische EXTENDS_ORDER), dann brand —
   * die Werkstatt-Optik kollidiert mit keiner admin-Datei (eigene
   * Bw-Präfixe, eigene Routen); das frühere App-Layout `dashboard.vue`
   * (Ersatz-Durchreiche) ist GELÖSCHT, damit die echte Shell des
   * admin-Layers greift. Die brand-eigenen Seiten /dashboard/brands/*
   * fordern seit demselben Tag das default-Layout an (Wizard-Nav) — sie
   * sind Kunden-Fläche, keine Betreiber-Fläche.
   */
  extends: ['../../packages/themes', '../../packages/admin', '../../packages/brand', '../../packages/core', '../../packages/system'],

  // Port pro App eindeutig vergeben (3000–3009 vergeben — 3006 hält platform,
  // 3009 der brand-Playground; die erste Wahl 3006 kollidierte damit und ist
  // am 2026-09-01 hierher verschoben). Dev-Portkarte:
  // docs/content/2.architektur/6.hosts-und-ports.md
  devServer: {
    port: 3010,
  },

  // Eigene Keys der App — werden mit den Layer-Locales gemergt (gleicher code)
  i18n: {
    locales: [
      { code: 'de', language: 'de-DE', name: 'Deutsch', file: 'de.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
  },
})
