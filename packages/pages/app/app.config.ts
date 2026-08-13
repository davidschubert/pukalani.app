/**
 * pages meldet seine Dashboard-Sektion bei der Admin-Modul-Registry an
 * (pukalani.admin.modules, deep-merged) — capability-gefiltert (A14).
 */
export default defineAppConfig({
  pukalani: {
    pages: {
      /**
       * Fehlt die Regeln-Seite, liefern die Routen die Vorlage aus und das
       * Dashboard bietet sie zum Bearbeiten an (F1, Davids Entscheidung 2 —
       * Begründung in shared/guidelinesFallback.ts, Schalter-Begründung in
       * server/utils/guidelinesFallbackGate.ts).
       *
       * Layer-Default AUS: dieser Layer läuft auch in `control`, wo der
       * BETREIBER seine eigenen Rechtstexte pflegt und Community-Regeln
       * niemanden meinen. Eingeschaltet wird er dort, wo die Seiten einer
       * Community gehören (apps/platform).
       */
      guidelinesFallback: false,
    },
    // Chrome-Registry (S9): pages ist die CMS-Nav-Quelle — das blueprint-
    // Layout holt /api/pages/public NUR, wenn dieses Flag (= dieser Layer)
    // da ist. Veröffentlichte Seiten erscheinen in der Haupt-Nav, Seiten mit
    // Legal-Slugs (imprint/impressum/privacy/datenschutz) im Footer.
    chrome: {
      pagesNav: true,
      /**
       * U15: dieser Layer besitzt den Navigations-Editor UND die Route
       * dahinter (`/api/pages/navigation`). Das Flag sagt dem
       * blueprint-Layout, dass es die gespeicherte Menü-Wahl überhaupt holen
       * darf — ohne diesen Layer gibt es sie nicht, und ein Abruf ins Leere
       * kostete jeden SSR-Aufbau einen 404. Dieselbe Mechanik und dieselbe
       * Begründung wie `pagesNav` darüber.
       */
      navOverride: true,
    },
    admin: {
      /**
       * DAS MENÜ DER COMMUNITY (U15 Teil 1) — Reiter im Community-Hub.
       *
       * Der Hinweis an den Modulen unten („Navigation kommt später als
       * zweiter Eintrag dazu", E9) hat sich bestätigt und den Ort gewechselt:
       * seit F51 (2026-08-07) leben Community-Einstellungen als REITER unter
       * /dashboard/community/*, nicht als Menüpunkte. Die Gruppe „Website"
       * behält damit die Seiten-VERWALTUNG (Redaktion, `pages.manage`), das
       * Menü zieht zu den übrigen Community-Einstellungen.
       *
       * `branding.manage` (owner + admin), NICHT `pages.manage`: die
       * ausführliche Begründung steht an der Route
       * (server/api/pages/navigation.patch.ts). Kurz: wer einen Text
       * schreiben darf, soll nicht die Struktur der Website umstellen.
       *
       * `order: 25` setzt ihn direkt hinter „Erscheinungsbild" (20) — beides
       * ist Gestaltung der öffentlichen Seite, und beides verlangt dieselbe
       * Capability.
       */
      communityTabs: [
        {
          id: 'community-navigation',
          scope: 'community',
          labelKey: 'pages.navigation.navLabel',
          icon: 'i-ph-list-dashes',
          to: '/dashboard/community/navigation',
          requiredCapability: 'branding.manage',
          order: 25,
        },
      ],
      modules: [
        {
          // E9: die Seiten SIND die Website einer Community (eigene Gruppe
          // „Website"; „Navigation" kommt später als zweiter Eintrag dazu).
          // scope 'community', weil sie einer Community gehören — im
          // Einzelbetrieb (apps/control pflegt hier seine Rechtstexte) bleibt
          // der Eintrag über das Operator-Label sichtbar.
          id: 'pages',
          scope: 'community',
          productKey: 'pages',
          labelKey: 'admin.nav.pages',
          icon: 'i-ph-file-text',
          to: '/dashboard/pages',
          requiredCapability: 'pages.manage',
          group: 'website',
          order: 1,
        },
      ],
    },
  },
})
