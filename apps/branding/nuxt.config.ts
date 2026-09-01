export default defineNuxtConfig({
  /**
   * branding.supply — die eigene App des Brand-Wizards (Infra-Plan
   * docs/plans/BRANDING-SUPPLY-INFRA.md §2, Davids Entscheidung 2026-08-31).
   *
   * Früher gelistet = höhere Priorität; core + system sind das Fundament und
   * bleiben immer. Die Menge muss zum Site-Manifest passen — `pnpm
   * check:manifests` erzwingt Reihenfolge UND Menge.
   *
   * WARUM NUR `brand`, OHNE `blueprint` UND OHNE `admin`:
   *  • `blueprint` ist der Kompositions-Layer und zieht per `requires` posts,
   *    comments, events und courses mit — vier Produkt-Layer samt Tabellen,
   *    von denen der Wizard keinen einzigen anfasst. Nachgesehen am
   *    2026-08-31: keine Seite und keine Komponente des brand-Layers
   *    referenziert eine blueprint-Komponente; sein Vollbild-Workspace bringt
   *    seinen Rahmen über `BwWorkspace` + das eigene Layout
   *    `brand-workspace` selbst mit.
   *  • `admin` besitzt zwar das `dashboard`-Layout, das /dashboard/brands
   *    anfordert — aber auch die changelog-Tabelle (admin-001…003) und die
   *    ganze Betreiber-Navigation, und seine Shell koppelt über
   *    `DashboardUserMenu` an `useTheme()` aus `themes`. Aus einem Layer mehr
   *    würden also drei, und der Infra-Plan §3 nennt für die Instanz
   *    `branding` ausdrücklich NUR `system-001…038` + `brand-001…008`. Der
   *    Ersatz steht in `app/layouts/dashboard.vue` — dort auch die
   *    Begründung und der Weg zurück.
   */
  extends: ['../../packages/brand', '../../packages/core', '../../packages/system'],

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
